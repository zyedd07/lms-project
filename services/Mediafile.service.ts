// services/mediaFile.service.ts
// COMPLETE FIXED VERSION - This addresses all the CloudFront 403 issues
// Now updated to use CloudFront Signed Cookies for HLS playback.

import { PutObjectCommand, DeleteObjectCommand, PutObjectCommandInput, DeleteObjectCommandInput, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedCookies, CloudfrontSignedCookiesOutput } from '@aws-sdk/cloudfront-signer'; // Changed from getSignedUrl to getSignedCookies, imported CloudfrontSignedCookiesOutput
import { s3Client, RAW_VIDEO_BUCKET_NAME, PROCESSED_VIDEO_BUCKET_NAME, AWS_REGION } from '../config/aws';
import MediaFile from '../models/Mediafile.model';
import * as multer from 'multer';

/**
 * Generates CloudFront signed cookies for a given resource path.
 * These cookies allow access to all content under the specified resource pattern.
 * This is the recommended approach for HLS streaming with private content.
 *
 * @param resourcePath The CloudFront path pattern to sign (e.g., /processed-videos/*).
 * @returns A promise that resolves with an object containing the signed cookies.
 * @throws An error if CloudFront environment variables are missing or signing fails.
 */
const getCloudFrontSignedCookies = async (resourcePath: string): Promise<CloudfrontSignedCookiesOutput> => { // Changed return type to CloudfrontSignedCookiesOutput
    // Retrieve CloudFront environment variables
    const CLOUDFRONT_PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY;
    const CLOUDFRONT_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID;

    // Validate environment variables are present
    if (!CLOUDFRONT_PRIVATE_KEY || !CLOUDFRONT_KEY_PAIR_ID) {
        throw new Error('CloudFront environment variables missing: CLOUDFRONT_PRIVATE_KEY or CLOUDFRONT_KEY_PAIR_ID. Please ensure they are set in your .env file.');
    }

    // Calculate expiration time for the signed cookies.
    // A 2-year expiration is used here; adjust as per your security requirements.
    const currentTime = new Date();
    const expirationTime = new Date(currentTime.getTime() + (2 * 365 * 24 * 60 * 60 * 1000)); // 2 years from now

    console.log('=== CloudFront Cookie Signing Process ===');
    console.log('Resource Path Pattern to sign:', resourcePath);
    console.log('Current time (UTC):', currentTime.toISOString());
    console.log('Expiration time (UTC):', expirationTime.toISOString());
    console.log('Key Pair ID:', CLOUDFRONT_KEY_PAIR_ID);

    try {
        // Ensure the private key is correctly formatted with actual newlines.
        let formattedPrivateKey = CLOUDFRONT_PRIVATE_KEY;
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');

        if (!formattedPrivateKey.includes('-----BEGIN') || !formattedPrivateKey.includes('-----END')) {
            throw new Error('CLOUDFRONT_PRIVATE_KEY must include "-----BEGIN PRIVATE KEY-----" and "-----END PRIVATE KEY-----" markers with proper newlines.');
        }

        // Generate the signed cookies
        const signedCookies = getSignedCookies({
            url: resourcePath, // The resource URL pattern to sign (e.g., "https://d123.cloudfront.net/private/*")
            keyPairId: CLOUDFRONT_KEY_PAIR_ID,
            privateKey: formattedPrivateKey,
            dateLessThan: expirationTime.toISOString(),
        });

        console.log('✅ Successfully generated signed cookies');
        console.log('=== End CloudFront Cookie Signing ===\n');

        return signedCookies;
    } catch (signingError: any) {
        console.error('❌ CloudFront cookie signing failed:', signingError);
        console.error('Private key format check details:', {
            hasBeginMarker: CLOUDFRONT_PRIVATE_KEY.includes('-----BEGIN'),
            hasEndMarker: CLOUDFRONT_PRIVATE_KEY.includes('-----END'),
            length: CLOUDFRONT_PRIVATE_KEY.length,
            keyPairIdLength: CLOUDFRONT_KEY_PAIR_ID.length,
            privateKeySnippet: CLOUDFRONT_PRIVATE_KEY.substring(0, 50) + '...' + CLOUDFRONT_PRIVATE_KEY.substring(CLOUDFRONT_PRIVATE_KEY.length - 50)
        });
        throw new Error(`CloudFront cookie signing failed: ${signingError?.message || 'Unknown signing error'}. Please check your private key format and CloudFront configuration.`);
    }
};

/**
 * Uploads a single media file to S3 and creates a corresponding database entry.
 * It now returns CloudFront signed cookies for the expected processed video path.
 *
 * @param fileBuffer The buffer of the file to upload.
 * @param originalname The original name of the file.
 * @param mimetype The MIME type of the file.
 * @param fileSize The size of the file in bytes.
 * @returns A promise that resolves with the media file metadata, including the CloudFront signed cookies.
 * @throws An error if S3 upload or database operations fail.
 */
export const uploadMedia = async (
    fileBuffer: Buffer,
    originalname: string,
    mimetype: string,
    fileSize: number
): Promise<any> => {
    const timestamp = Date.now();
    const sanitizedFilename = originalname.replace(/[^a-zA-Z0-9.-_]/g, '_');
    const s3Key = `uploads/${timestamp}_${sanitizedFilename}`;

    console.log(`🚀 Starting upload process for: ${originalname}`);
    console.log(`📁 S3 Key to be used: ${s3Key}`);

    const params: PutObjectCommandInput = {
        Bucket: RAW_VIDEO_BUCKET_NAME,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimetype,
        Metadata: {
            'original-name': originalname,
            'upload-timestamp': timestamp.toString()
        }
    };

    try {
        console.log(`📤 Uploading file to S3 bucket "${RAW_VIDEO_BUCKET_NAME}"...`);
        await s3Client.send(new PutObjectCommand(params));
        console.log(`✅ S3 upload successful: ${s3Key}`);

        console.log(`💾 Creating database entry for ${originalname}...`);
        const mediaFileEntry = await MediaFile.create({
            originalName: originalname,
            s3Key: s3Key,
            s3Bucket: RAW_VIDEO_BUCKET_NAME,
            s3Region: AWS_REGION,
            fileUrl: `s3://${RAW_VIDEO_BUCKET_NAME}/${s3Key}`,
            mimeType: mimetype,
            fileSize: fileSize,
        });
        console.log(`✅ Database entry created with ID: ${(mediaFileEntry as any).id}`);

        const mediaConvertBaseName = s3Key.split('/').pop()?.split('.')[0] || '';
        if (!mediaConvertBaseName) {
            throw new Error('Could not derive base name for processed video from S3 key.');
        }

        // The CloudFront path should be `/processed-videos/TIMESTAMP_FILENAME/TIMESTAMP_FILENAME.m3u8`
        // The S3 key for HeadObjectCommand should be `processed-videos/TIMESTAMP_FILENAME/TIMESTAMP_FILENAME.m3u8`
        const processedHlsPath = `/processed-videos/${mediaConvertBaseName}/${mediaConvertBaseName}.m3u8`;
        const s3KeyForProcessedVideo = `processed-videos/${mediaConvertBaseName}/${mediaConvertBaseName}.m3u8`;

        console.log(`🎬 Expected processed video path for CloudFront: ${processedHlsPath}`);
        console.log(`🔑 Expected S3 key for processed video: ${s3KeyForProcessedVideo}`);

        // Generate CloudFront signed cookies for the processed video path pattern
        // The pattern should cover all HLS components (master manifest, sub-manifests, .ts segments)
        const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
        if (!CLOUDFRONT_MEDIA_DOMAIN) {
            throw new Error('CLOUDFRONT_MEDIA_DOMAIN environment variable is missing.');
        }
        // Sign the entire processed-videos folder for simplicity with HLS
        const resourcePathPattern = `https://${CLOUDFRONT_MEDIA_DOMAIN}/processed-videos/*`;
        const signedCookies = await getCloudFrontSignedCookies(resourcePathPattern);

        console.log(`✅ Upload process completed successfully for ${originalname}`);

        // Return the database entry along with the base CloudFront URL (without signing params)
        // and the signed cookies. The frontend will set these cookies.
        return {
            ...mediaFileEntry.toJSON(),
            fileUrl: `https://${CLOUDFRONT_MEDIA_DOMAIN}${processedHlsPath}`, // Base URL for the processed file
            processedPath: processedHlsPath,
            s3KeyForProcessedVideo: s3KeyForProcessedVideo,
            status: 'processing', // Still processing by MediaConvert
            signedCookies: signedCookies // Include the signed cookies in the response
        };

    } catch (error: any) {
        console.error(`❌ Upload failed for ${originalname}:`, error);
        if (error?.name === 'NoSuchBucket') {
            throw new Error(`S3 bucket "${RAW_VIDEO_BUCKET_NAME}" does not exist or is not accessible. Check your RAW_VIDEO_BUCKET_NAME configuration.`);
        } else if (error?.name === 'AccessDenied') {
            throw new Error('S3 access denied. Check IAM permissions for PutObject operation on your S3 bucket.'); // Corrected: removed extra 'new'
        } else if (error?.message?.includes('CloudFront')) {
            throw new Error(`CDN Configuration Error: ${error.message}`);
        } else if (error?.message?.includes('signing')) {
            throw new Error(`Cookie signing failed during upload: ${error.message}. Check your CloudFront private key and key pair ID.`);
        }
        throw error;
    }
};

/**
 * Retrieves all media files from the database and generates CloudFront signed cookies for them.
 * This function now returns the base CloudFront URL and the signed cookies.
 *
 * @returns A promise that resolves with an array of media file metadata, each including a base CloudFront URL and signed cookies.
 */
export const getAllMedia = async (): Promise<any[]> => {
    try {
        console.log(`📋 Fetching all media files from database...`);
        const mediaFiles = await MediaFile.findAll({
            order: [['createdAt', 'DESC']],
        });

        console.log(`📊 Found ${mediaFiles.length} media files in database`);

        if (mediaFiles.length === 0) {
            return [];
        }

        const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
        if (!CLOUDFRONT_MEDIA_DOMAIN) {
            throw new Error('CLOUDFRONT_MEDIA_DOMAIN environment variable is missing.');
        }

        // Generate signed cookies once for all processed videos (assuming they are all under /processed-videos/*)
        const resourcePathPattern = `https://${CLOUDFRONT_MEDIA_DOMAIN}/processed-videos/*`;
        const signedCookies = await getCloudFrontSignedCookies(resourcePathPattern);

        const mediaFilesWithUrlsAndCookies = mediaFiles.map((file, index) => {
            const fileData = file.toJSON();
            const originalFilename = fileData.originalName;

            if (!originalFilename) {
                console.warn(`⚠️  [${index + 1}] Missing original filename for s3Key: ${fileData.s3Key}. Cannot generate processed path.`);
                return {
                    ...fileData,
                    fileUrl: null,
                    error: 'Missing original filename for processed path generation',
                    status: 'error'
                };
            }

            const mediaConvertBaseName = fileData.s3Key.split('/').pop()?.split('.')[0] || '';
            if (!mediaConvertBaseName) {
                console.warn(`⚠️  [${index + 1}] Could not derive base name for processed video from s3Key: ${fileData.s3Key}.`);
                return {
                    ...fileData,
                    fileUrl: null,
                    error: 'Could not derive processed video path from s3Key',
                    status: 'error'
                };
            }

            const processedHlsPath = `/processed-videos/${mediaConvertBaseName}/${mediaConvertBaseName}.m3u8`;
            const s3KeyForProcessedVideo = `processed-videos/${mediaConvertBaseName}/${mediaConvertBaseName}.m3u8`;

            console.log(`✅ [${index + 1}] Generated base URL for ${originalFilename}`);
            return {
                ...fileData,
                fileUrl: `https://${CLOUDFRONT_MEDIA_DOMAIN}${processedHlsPath}`, // Base URL
                processedPath: processedHlsPath,
                s3KeyForProcessedVideo: s3KeyForProcessedVideo,
                status: fileData.status || 'processing', // Preserve existing status or default
                signedCookies: signedCookies // Attach signed cookies to each item for frontend to use
            };
        });

        const successCount = mediaFilesWithUrlsAndCookies.filter(f => f.status === 'ready').length;
        const errorCount = mediaFilesWithUrlsAndCookies.filter(f => f.status === 'error').length;
        console.log(`📈 Media file processing complete - Successful: ${successCount}, Failed: ${errorCount}`);

        return mediaFilesWithUrlsAndCookies;
    } catch (error) {
        console.error('❌ Error in getAllMedia service:', error);
        throw error;
    }
};

/**
 * Deletes a media file from S3 and its corresponding entry from the database.
 *
 * @param fileId The ID of the media file to delete.
 * @returns A promise that resolves with a success message.
 * @throws An error if the file is not found or deletion fails.
 */
export const deleteMedia = async (fileId: string): Promise<{ message: string }> => {
    try {
        const mediaFile = await MediaFile.findByPk(fileId);
        if (!mediaFile) {
            const error = new Error(`Media file with ID ${fileId} not found.`);
            (error as any).statusCode = 404;
            throw error;
        }

        const params: DeleteObjectCommandInput = {
            Bucket: (mediaFile as any).s3Bucket,
            Key: (mediaFile as any).s3Key,
        };

        console.log(`🗑️ Deleting file from S3: ${(mediaFile as any).s3Key}`);
        await s3Client.send(new DeleteObjectCommand(params));
        console.log(`✅ Successfully deleted from S3.`);

        await mediaFile.destroy();
        console.log(`✅ Successfully deleted media file entry from database: ${fileId}`);

        return { message: 'Media file deleted successfully.' };
    } catch (error) {
        console.error(`❌ Error in deleteMedia service for ID ${fileId}:`, error);
        throw error;
    }
};

/**
 * Handles the batch upload of multiple media files.
 * It iterates through the provided files, uploading each one individually.
 * Provides a summary of successful and failed uploads.
 *
 * @param files An array of multer.File objects to upload.
 * @returns A promise that resolves with an object containing successful uploads, failed uploads, and a summary.
 */
export const uploadMultipleMedia = async (files: multer.File[]): Promise<{
    successful: any[];
    failed: any[];
    summary: {
        total: number;
        successful: number;
        failed: number;
        successRate: number;
    };
}> => {
    console.log(`🔄 Starting batch upload of ${files.length} files.`);

    const uploadedFilesMetadata: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileNumber = i + 1;

        console.log(`\n[${fileNumber}/${files.length}] Processing file: ${file.originalname}`);
        console.log(`📏 File size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`🎭 MIME type: ${file.mimetype}`);

        try {
            const result = await uploadMedia(
                file.buffer,
                file.originalname,
                file.mimetype,
                file.size
            );

            uploadedFilesMetadata.push({
                ...result,
                batchIndex: fileNumber,
                batchTotal: files.length
            });

            console.log(`✅ [${fileNumber}/${files.length}] Successfully uploaded: ${file.originalname}`);

        } catch (error: any) {
            console.error(`❌ [${fileNumber}/${files.length}] Failed to upload: ${file.originalname}`, error?.message || 'Unknown error');
            errors.push({
                filename: file.originalname,
                error: error?.message || 'Unknown error',
                batchIndex: fileNumber,
                fileSize: file.size,
                mimeType: file.mimetype
            });
        }

        if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`\n📊 Batch upload completed:`);
    console.log(`✅ Successful uploads: ${uploadedFilesMetadata.length}`);
    console.log(`❌ Failed uploads: ${errors.length}`);

    if (errors.length > 0) {
        console.log(`\n💥 Details of upload errors:`);
        errors.forEach((err, idx) => {
            console.log(`  ${idx + 1}. Filename: ${err.filename}, Error: ${err.error}`);
        });
    }

    return {
        successful: uploadedFilesMetadata,
        failed: errors,
        summary: {
            total: files.length,
            successful: uploadedFilesMetadata.length,
            failed: errors.length,
            successRate: files.length > 0 ? Math.round((uploadedFilesMetadata.length / files.length) * 100) : 0
        }
    };
};

/**
 * Tests CloudFront access for a given processed path by attempting to generate signed cookies
 * and optionally checking for file existence in S3.
 * This is a helpful diagnostic tool for CloudFront 403 issues.
 *
 * @param processedPath The CloudFront path to test (e.g., /processed-videos/myvideo/index.m3u8).
 * @returns An object indicating success/failure, the base URL, signed cookies, error message, and file existence status.
 */
export const testCloudFrontAccess = async (processedPath: string): Promise<{
    success: boolean;
    baseUrl?: string; // Changed from signedUrl to baseUrl
    signedCookies?: CloudfrontSignedCookiesOutput; // Corrected type here
    error?: string;
    fileExists?: boolean;
    s3Key?: string;
}> => {
    try {
        console.log(`🧪 Initiating CloudFront access test for path: ${processedPath}`);

        const s3Key = processedPath.startsWith('/') ? processedPath.substring(1) : processedPath;
        let fileExists = false;

        try {
            await s3Client.send(new HeadObjectCommand({
                Bucket: PROCESSED_VIDEO_BUCKET_NAME,
                Key: s3Key
            }));
            fileExists = true;
            console.log(`✅ File confirmed to exist in S3: ${s3Key} in bucket: ${PROCESSED_VIDEO_BUCKET_NAME}`);
        } catch (s3Error: any) {
            console.log(`❌ File NOT found in S3: ${s3Key} in bucket: ${PROCESSED_VIDEO_BUCKET_NAME} - ${s3Error?.message || 'Unknown S3 error'}`);
        }

        const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
        if (!CLOUDFRONT_MEDIA_DOMAIN) {
            throw new Error('CLOUDFRONT_MEDIA_DOMAIN environment variable is missing.');
        }

        // Generate signed cookies for the path pattern that covers the test path
        const resourcePathPattern = `https://${CLOUDFRONT_MEDIA_DOMAIN}${processedPath.substring(0, processedPath.lastIndexOf('/') + 1)}*`; // Sign the folder
        const signedCookies = await getCloudFrontSignedCookies(resourcePathPattern);

        return {
            success: true,
            baseUrl: `https://${CLOUDFRONT_MEDIA_DOMAIN}${processedPath}`, // Base URL
            signedCookies,
            fileExists,
            s3Key
        };
    } catch (error: any) {
        console.error(`❌ CloudFront access test failed for ${processedPath}:`, error);
        return {
            success: false,
            error: error?.message || 'Unknown error during CloudFront access test',
            fileExists: false
        };
    }
};

/**
 * Validates the presence and basic format of critical CloudFront environment variables.
 * This helps in quickly identifying misconfigurations.
 *
 * @returns An object indicating validity, missing variables, and warnings about format.
 */
export const validateEnvironmentVariables = (): { valid: boolean; missing: string[]; warnings: string[] } => {
    const required = [
        'CLOUDFRONT_MEDIA_DOMAIN',
        'CLOUDFRONT_PRIVATE_KEY',
        'CLOUDFRONT_KEY_PAIR_ID'
    ];

    const missing: string[] = [];
    const warnings: string[] = [];

    required.forEach(envVar => {
        const value = process.env[envVar];
        if (!value) {
            missing.push(envVar);
        } else {
            if (envVar === 'CLOUDFRONT_PRIVATE_KEY') {
                if (!value.includes('-----BEGIN') || !value.includes('-----END')) {
                    warnings.push(`CLOUDFRONT_PRIVATE_KEY may be missing "-----BEGIN PRIVATE KEY-----" or "-----END PRIVATE KEY-----" markers. Ensure it's copied correctly.`);
                }
                if (!value.includes('\n') && value.includes('\\n')) {
                    warnings.push(`CLOUDFRONT_PRIVATE_KEY contains escaped newlines (\\n). Ensure these are properly converted to actual newlines in your environment setup or by the service logic.`);
                }
            } else if (envVar === 'CLOUDFRONT_MEDIA_DOMAIN') {
                if (value.startsWith('http://') || value.startsWith('https://')) {
                    warnings.push(`CLOUDFRONT_MEDIA_DOMAIN should generally not include protocol (http:// or https://). It should be just the domain name (e.g., 'd12345abcdef.cloudfront.net').`);
                }
            }
        }
    });

    if (!process.env.RAW_VIDEO_BUCKET_NAME) {
        missing.push('RAW_VIDEO_BUCKET_NAME');
    }
    if (!process.env.PROCESSED_VIDEO_BUCKET_NAME) {
        missing.push('PROCESSED_VIDEO_BUCKET_NAME');
    }

    return {
        valid: missing.length === 0,
        missing,
        warnings
    };
};

/**
 * Retrieves a single media file by its original filename from the database and generates CloudFront signed cookies for it.
 *
 * @param filename The original filename of the media file to retrieve.
 * @returns A promise that resolves with the media file metadata, including the base URL and signed cookies.
 * @throws An error if the media file is not found.
 */
export const getMediaByFilename = async (filename: string): Promise<any> => {
    try {
        console.log(`🔍 Attempting to retrieve media file by filename: ${filename}`);
        const mediaFile = await MediaFile.findOne({
            where: {
                originalName: filename
            }
        });

        if (!mediaFile) {
            throw new Error(`Media file not found with original filename: ${filename}`); // Corrected: removed extra 'new'
        }

        const fileData = mediaFile.toJSON();
        const mediaConvertBaseName = fileData.s3Key.split('/').pop()?.split('.')[0] || '';

        if (!mediaConvertBaseName) {
            throw new Error('Could not derive base name for processed video from S3 key.');
        }

        const processedHlsPath = `/processed-videos/${mediaConvertBaseName}/${mediaConvertBaseName}.m3u8`;
        const s3KeyForProcessedVideo = `processed-videos/${mediaConvertBaseName}/${mediaConvertBaseName}.m3u8`;

        const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
        if (!CLOUDFRONT_MEDIA_DOMAIN) {
            throw new Error('CLOUDFRONT_MEDIA_DOMAIN environment variable is missing.');
        }

        // Generate signed cookies for the processed video path pattern
        const resourcePathPattern = `https://${CLOUDFRONT_MEDIA_DOMAIN}/processed-videos/*`;
        const signedCookies = await getCloudFrontSignedCookies(resourcePathPattern);

        console.log(`✅ Successfully retrieved and generated cookies for ${filename}`);
        return {
            ...fileData,
            fileUrl: `https://${CLOUDFRONT_MEDIA_DOMAIN}${processedHlsPath}`, // Base URL
            processedPath: processedHlsPath,
            s3KeyForProcessedVideo: s3KeyForProcessedVideo,
            status: fileData.status || 'ready', // Assume ready if fetched
            signedCookies: signedCookies // Attach signed cookies
        };
    } catch (error: any) {
        console.error(`❌ Error in getMediaByFilename service for ${filename}:`, error);
        throw error;
    }
};
