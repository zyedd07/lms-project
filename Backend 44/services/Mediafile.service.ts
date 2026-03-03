// services/mediaFile.service.ts
// COMPLETE FIXED VERSION - Now supports both HLS video and static assets (images, PDFs)

import { PutObjectCommand, DeleteObjectCommand, PutObjectCommandInput, DeleteObjectCommandInput, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import { s3Client, RAW_VIDEO_BUCKET_NAME, PROCESSED_VIDEO_BUCKET_NAME, STATIC_ASSETS_BUCKET_NAME, AWS_REGION } from '../config/aws'; // Imported STATIC_ASSETS_BUCKET_NAME
import MediaFile from '../models/Mediafile.model';
import * as multer from 'multer';

/**
 * Generates a CloudFront signed URL for a given resource path.
 * This URL provides time-limited access to the content.
 *
 * @param resourceUrl The full CloudFront URL of the resource (e.g., https://your-cloudfront-domain.net/path/to/file.m3u8).
 * @returns A promise that resolves with the signed URL string.
 * @throws An error if CloudFront environment variables are missing or signing fails.
 */

const getCloudFrontSignedUrl = async (resourceUrl: string): Promise<string> => {
    const CLOUDFRONT_PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY;
    const CLOUDFRONT_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID;

    if (!CLOUDFRONT_PRIVATE_KEY || !CLOUDFRONT_KEY_PAIR_ID) {
        throw new Error('CloudFront environment variables missing: CLOUDFRONT_PRIVATE_KEY or CLOUDFRONT_KEY_PAIR_ID. Please ensure they are set in your .env file.');
    }

    const currentTime = new Date();
    const expirationTime = new Date(currentTime.getTime() + (2 * 365 * 24 * 60 * 60 * 1000)); // 2 years from now

    console.log('=== CloudFront URL Signing Process ===');
    console.log('Resource URL to sign:', resourceUrl);
    console.log('Expiration time (UTC):', expirationTime.toISOString());
    console.log('Key Pair ID:', CLOUDFRONT_KEY_PAIR_ID);

    try {
        let formattedPrivateKey = CLOUDFRONT_PRIVATE_KEY;
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');

        if (!formattedPrivateKey.includes('-----BEGIN') || !formattedPrivateKey.includes('-----END')) {
            throw new Error('CLOUDFRONT_PRIVATE_KEY must include "-----BEGIN PRIVATE KEY-----" and "-----END PRIVATE KEY-----" markers with proper newlines.');
        }

        const signedUrl = getSignedUrl({
            url: resourceUrl,
            keyPairId: CLOUDFRONT_KEY_PAIR_ID,
            privateKey: formattedPrivateKey,
            dateLessThan: expirationTime.toISOString(),
        });

        console.log('✅ Successfully generated signed URL');
        console.log('=== End CloudFront URL Signing ===\n');

        return signedUrl;
    } catch (signingError: any) {
        console.error('❌ CloudFront URL signing failed:', signingError);
        console.error('Private key format check details:', {
            hasBeginMarker: CLOUDFRONT_PRIVATE_KEY.includes('-----BEGIN'),
            hasEndMarker: CLOUDFRONT_PRIVATE_KEY.includes('-----END'),
            length: CLOUDFRONT_PRIVATE_KEY.length,
            keyPairIdLength: CLOUDFRONT_KEY_PAIR_ID.length,
            privateKeySnippet: CLOUDFRONT_PRIVATE_KEY.substring(0, 50) + '...' + CLOUDFRONT_PRIVATE_KEY.substring(CLOUDFRONT_PRIVATE_KEY.length - 50)
        });
        throw new Error(`CloudFront URL signing failed: ${signingError?.message || 'Unknown signing error'}. Please check your private key format and CloudFront configuration.`);
    }
};

/**
 * Uploads a single media file to S3 and creates a corresponding database entry.
 * It now intelligently routes files based on MIME type (video vs. other assets).
 *
 * @param fileBuffer The buffer of the file to upload.
 * @param originalname The original name of the file.
 * @param mimetype The MIME type of the file.
 * @param fileSize The size of the file in bytes.
 * @returns A promise that resolves with the media file metadata, including the generated URL.
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
    const s3KeyBase = `${timestamp}_${sanitizedFilename}`;
    let targetBucket: string;
    let s3Key: string;
    let fileUrl: string;
    let processedPath: string | undefined;
    let status: 'ready' | 'error' | 'processing' = 'ready'; // Default status for static assets

    console.log(`🚀 Starting upload process for: ${originalname}`);
    console.log(`🎭 MIME type: ${mimetype}`);

    // Determine if the file is a video
    const isVideo = mimetype.startsWith('video/');

    if (isVideo) {
        targetBucket = RAW_VIDEO_BUCKET_NAME;
        s3Key = `uploads/${s3KeyBase}`; // Raw video uploads go to 'uploads' prefix
        status = 'processing'; // Videos need MediaConvert processing
        console.log(`🎥 Detected as video. Target bucket: ${targetBucket}`);
    } else {
        targetBucket = STATIC_ASSETS_BUCKET_NAME;
        s3Key = `static-assets/${s3KeyBase}`; // Static assets go to 'static-assets' prefix
        console.log(`🖼️ Detected as static asset. Target bucket: ${targetBucket}`);
    }

    const params: PutObjectCommandInput = {
        Bucket: targetBucket,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimetype,
        Metadata: {
            'original-name': originalname,
            'upload-timestamp': timestamp.toString()
        }
    };

    try {
        console.log(`📤 Uploading file to S3 bucket "${targetBucket}" with key "${s3Key}"...`);
        await s3Client.send(new PutObjectCommand(params));
        console.log(`✅ S3 upload successful: ${s3Key}`);

        // Generate the URL based on file type
        if (isVideo) {
            const mediaConvertBaseName = s3KeyBase.split('.')[0] || '';
            if (!mediaConvertBaseName) {
                throw new Error('Could not derive base name for processed video from S3 key.');
            }
            // HLS master manifest path after MediaConvert
            processedPath = `/processed-videos/${mediaConvertBaseName}/${mediaConvertBaseName}.m3u8`;

            const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
            if (!CLOUDFRONT_MEDIA_DOMAIN) {
                throw new Error('CLOUDFRONT_MEDIA_DOMAIN environment variable is missing.');
            }
            const fullCloudFrontUrl = `https://${CLOUDFRONT_MEDIA_DOMAIN}${processedPath}`;
            fileUrl = await getCloudFrontSignedUrl(fullCloudFrontUrl); // Signed URL for videos
            console.log(`🎬 Video URL (signed CloudFront): ${fileUrl}`);
        } else {
            // For static assets, generate a direct S3 public URL (assuming the bucket is public or has appropriate policy)
            // If you want private static assets via CloudFront, this logic would change to use CloudFront signed URLs for them too.
            fileUrl = `https://${targetBucket}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
            console.log(`🖼️ Static asset URL (direct S3): ${fileUrl}`);
        }

        console.log(`💾 Creating database entry for ${originalname}...`);
        const mediaFileEntry = await MediaFile.create({
            originalName: originalname,
            s3Key: s3Key, // Store the S3 key of the original upload (raw video or static asset)
            s3Bucket: targetBucket, // Store the bucket where it was originally uploaded
            s3Region: AWS_REGION,
            fileUrl: fileUrl, // The generated (signed or public) URL
            mimeType: mimetype,
            fileSize: fileSize,
            processedPath: processedPath, // Only set for videos
            status: status, // 'processing' for video, 'ready' for static assets
        });
        console.log(`✅ Database entry created with ID: ${(mediaFileEntry as any).id}`);

        console.log(`✅ Upload process completed successfully for ${originalname}`);

        return mediaFileEntry.toJSON(); // Return the full entry including the generated URL and status
    } catch (error: any) {
        console.error(`❌ Upload failed for ${originalname}:`, error);
        if (error?.name === 'NoSuchBucket') {
            throw new Error(`S3 bucket "${targetBucket}" does not exist or is not accessible. Check your bucket configuration.`);
        } else if (error?.name === 'AccessDenied') {
            throw new Error(`S3 access denied for bucket "${targetBucket}". Check IAM permissions for PutObject operation.`);
        } else if (error?.message?.includes('CloudFront')) {
            throw new Error(`CDN Configuration Error: ${error.message}`);
        } else if (error?.message?.includes('signing')) {
            throw new Error(`URL signing failed during upload: ${error.message}. Check your CloudFront private key and key pair ID.`);
        }
        throw error;
    }
};

/**
 * Retrieves all media files from the database and generates appropriate URLs (signed for videos, public for static assets).
 *
 * @returns A promise that resolves with an array of media file metadata, each including a generated URL.
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
            console.warn('CLOUDFRONT_MEDIA_DOMAIN environment variable is missing. Signed URLs for videos will not be generated.');
        }

        const mediaFilesWithUrls = await Promise.all(mediaFiles.map(async (file, index) => {
            const fileData = file.toJSON();
            const originalFilename = fileData.originalName;
            const isVideo = fileData.mimeType && fileData.mimeType.startsWith('video/');

            let generatedFileUrl = fileData.fileUrl; // Use existing URL from DB as a fallback
            let currentStatus = fileData.status;

            // Re-generate URL if it's a video or if the existing URL is missing/invalid
            if (isVideo) {
                const mediaConvertBaseName = fileData.s3Key.split('/').pop()?.split('.')[0] || '';
                if (!mediaConvertBaseName) {
                    console.warn(`⚠️  [${index + 1}] Could not derive base name for processed video from s3Key: ${fileData.s3Key}.`);
                    currentStatus = 'error';
                    // generatedFileUrl will remain null or existing invalid one
                } else {
                    const processedHlsPath = `/processed-videos/${mediaConvertBaseName}/${mediaConvertBaseName}.m3u8`;
                    const fullCloudFrontUrl = `https://${CLOUDFRONT_MEDIA_DOMAIN}${processedHlsPath}`;
                    try {
                        if (CLOUDFRONT_MEDIA_DOMAIN) {
                             generatedFileUrl = await getCloudFrontSignedUrl(fullCloudFrontUrl);
                             currentStatus = fileData.status; // Preserve original status if URL generated
                        } else {
                            currentStatus = 'error';
                            generatedFileUrl = null;
                            console.error(`❌ [${index + 1}] CLOUDFRONT_MEDIA_DOMAIN is missing. Cannot generate signed URL for video.`);
                        }
                    } catch (urlError: any) {
                        console.error(`❌ [${index + 1}] Failed to generate signed URL for ${originalFilename}:`, urlError.message);
                        currentStatus = 'error';
                        generatedFileUrl = null;
                        fileData.error = `URL signing failed: ${urlError.message}`;
                    }
                    fileData.processedPath = processedHlsPath; // Ensure processedPath is set for videos
                }
            } else {
                // For static assets, ensure direct S3 public URL is used if not already
                if (fileData.s3Bucket === STATIC_ASSETS_BUCKET_NAME && !fileData.fileUrl?.startsWith(`https://${STATIC_ASSETS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/`)) {
                     generatedFileUrl = `https://${fileData.s3Bucket}.s3.${AWS_REGION}.amazonaws.com/${fileData.s3Key}`;
                }
                currentStatus = 'ready'; // Static assets are ready immediately after upload
            }

            return {
                ...fileData,
                fileUrl: generatedFileUrl,
                status: currentStatus,
            };
        }));

        const successCount = mediaFilesWithUrls.filter(f => f.status === 'ready').length;
        const errorCount = mediaFilesWithUrls.filter(f => f.status === 'error').length;
        const processingCount = mediaFilesWithUrls.filter(f => f.status === 'processing').length;
        console.log(`📈 Media file processing complete - Ready: ${successCount}, Processing: ${processingCount}, Failed: ${errorCount}`);

        return mediaFilesWithUrls;
    } catch (error) {
        console.error('❌ Error in getAllMedia service:', error);
        throw error;
    }
};

/**
 * Deletes a media file from S3 and its corresponding entry from the database.
 * This function now deletes from the correct S3 bucket (raw video or static assets).
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

        const bucketToDeleteFrom = (mediaFile as any).s3Bucket;
        const keyToDelete = (mediaFile as any).s3Key;

        const params: DeleteObjectCommandInput = {
            Bucket: bucketToDeleteFrom,
            Key: keyToDelete,
        };

        console.log(`🗑️ Deleting file from S3 bucket "${bucketToDeleteFrom}" with key: ${keyToDelete}`);
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
 * Tests CloudFront access for a given processed path by attempting to generate a signed URL
 * and optionally checking for file existence in S3.
 * This is a helpful diagnostic tool for CloudFront 403 issues.
 *
 * @param processedPath The CloudFront path to test (e.g., /processed-videos/myvideo/index.m3u8).
 * @returns An object indicating success/failure, the signed URL, error message, and file existence status.
 */
export const testCloudFrontAccess = async (processedPath: string): Promise<{
    success: boolean;
    signedUrl?: string;
    error?: string;
    fileExists?: boolean;
    s3Key?: string;
}> => {
    try {
        console.log(`🧪 Initiating CloudFront access test for path: ${processedPath}`);

        const s3Key = processedPath.startsWith('/') ? processedPath.substring(1) : processedPath;
        let fileExists = false;

        // Determine the bucket based on the path prefix
        let targetBucket: string;
        if (processedPath.startsWith('/processed-videos/')) {
            targetBucket = PROCESSED_VIDEO_BUCKET_NAME;
        } else if (processedPath.startsWith('/static-assets/')) {
            targetBucket = STATIC_ASSETS_BUCKET_NAME;
        } else {
            console.warn(`Could not determine target bucket for path: ${processedPath}. Assuming PROCESSED_VIDEO_BUCKET_NAME.`);
            targetBucket = PROCESSED_VIDEO_BUCKET_NAME; // Fallback
        }

        try {
            await s3Client.send(new HeadObjectCommand({
                Bucket: targetBucket, // Use determined bucket
                Key: s3Key
            }));
            fileExists = true;
            console.log(`✅ File confirmed to exist in S3: ${s3Key} in bucket: ${targetBucket}`);
        } catch (s3Error: any) {
            console.log(`❌ File NOT found in S3: ${s3Key} in bucket: ${targetBucket} - ${s3Error?.message || 'Unknown S3 error'}`);
        }

        const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
        if (!CLOUDFRONT_MEDIA_DOMAIN) {
            throw new Error('CLOUDFRONT_MEDIA_DOMAIN environment variable is missing.');
        }

        const fullCloudFrontUrl = `https://${CLOUDFRONT_MEDIA_DOMAIN}${processedPath}`;
        let signedUrl: string | undefined;

        // Only generate signed URL if it's a video path (processed-videos)
        if (processedPath.startsWith('/processed-videos/')) {
            signedUrl = await getCloudFrontSignedUrl(fullCloudFrontUrl);
        } else {
            // For static assets, return the direct S3 public URL if the bucket is public
            // Or, if served via CloudFront publicly, the direct CloudFront URL (without signing)
            signedUrl = `https://${targetBucket}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
            console.log(`Note: For static assets, returning direct S3 URL. No CloudFront signing applied in testCloudFrontAccess for non-video paths.`);
        }


        return {
            success: true,
            signedUrl,
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
    if (!process.env.STATIC_ASSETS_BUCKET_NAME) { // NEW: Check for static assets bucket
        missing.push('STATIC_ASSETS_BUCKET_NAME');
    }

    return {
        valid: missing.length === 0,
        missing,
        warnings
    };
};

/**
 * Retrieves a single media file by its original filename from the database and generates an appropriate URL.
 *
 * @param filename The original filename of the media file to retrieve.
 * @returns A promise that resolves with the media file metadata, including the generated URL.
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
            throw new Error(`Media file not found with original filename: ${filename}`);
        }

        const fileData = mediaFile.toJSON();
        const isVideo = fileData.mimeType && fileData.mimeType.startsWith('video/');
        let generatedFileUrl = fileData.fileUrl; // Use existing URL from DB as a fallback
        let currentStatus = fileData.status;

        if (isVideo) {
            const mediaConvertBaseName = fileData.s3Key.split('/').pop()?.split('.')[0] || '';
            if (!mediaConvertBaseName) {
                throw new Error('Could not derive base name for processed video from S3 key.');
            }

            const processedHlsPath = `/processed-videos/${mediaConvertBaseName}/${mediaConvertBaseName}.m3u8`;
            const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
            if (!CLOUDFRONT_MEDIA_DOMAIN) {
                console.error('CLOUDFRONT_MEDIA_DOMAIN environment variable is missing. Cannot generate signed URL for video.');
                currentStatus = 'error';
                generatedFileUrl = null;
            } else {
                const fullCloudFrontUrl = `https://${CLOUDFRONT_MEDIA_DOMAIN}${processedHlsPath}`;
                try {
                    generatedFileUrl = await getCloudFrontSignedUrl(fullCloudFrontUrl);
                    currentStatus = fileData.status; // Preserve original status if URL generated
                } catch (urlError: any) {
                    console.error(`❌ Failed to generate signed URL for ${filename}:`, urlError.message);
                    currentStatus = 'error';
                    generatedFileUrl = null;
                    fileData.error = `URL signing failed: ${urlError.message}`;
                }
            }
            fileData.processedPath = processedHlsPath; // Ensure processedPath is set for videos
        } else {
            // For static assets, ensure direct S3 public URL is used if not already
            if (fileData.s3Bucket === STATIC_ASSETS_BUCKET_NAME && !fileData.fileUrl?.startsWith(`https://${STATIC_ASSETS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/`)) {
                generatedFileUrl = `https://${fileData.s3Bucket}.s3.${AWS_REGION}.amazonaws.com/${fileData.s3Key}`;
            }
            currentStatus = 'ready'; // Static assets are ready immediately after upload
        }

        console.log(`✅ Successfully retrieved and generated URL for ${filename}`);
        return {
            ...fileData,
            fileUrl: generatedFileUrl,
            status: currentStatus,
        };
    } catch (error: any) {
        console.error(`❌ Error in getMediaByFilename service for ${filename}:`, error);
        throw error;
    }
};
