// services/mediaFile.service.ts
// COMPLETE FIXED VERSION - This addresses all the CloudFront 403 issues

import { PutObjectCommand, DeleteObjectCommand, PutObjectCommandInput, DeleteObjectCommandInput, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import { s3Client, S3_BUCKET_NAME, AWS_REGION } from '../config/aws';
import MediaFile from '../models/Mediafile.model';
import * as multer from 'multer';

/**
 * Generates a CloudFront signed URL for a given processed file path.
 * This function is critical for securely serving private content via CloudFront.
 *
 * @param processedCloudFrontPath The path to the file on CloudFront (e.g., /processed-videos/myvideo/index.m3u8).
 * This path should be relative to the CloudFront distribution's root.
 * @param checkFileExists Optional. If true, performs a HeadObjectCommand on S3 to verify file existence before signing.
 * Useful for debugging, but can be set to false for files that will be created later (e.g., by MediaConvert).
 * @returns A promise that resolves with the generated signed URL.
 * @throws An error if CloudFront environment variables are missing, the private key is malformed, or signing fails.
 */
const generateCloudFrontSignedUrl = async (processedCloudFrontPath: string, checkFileExists: boolean = true): Promise<string> => {
    // Retrieve CloudFront environment variables
    const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
    const CLOUDFRONT_PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY;
    const CLOUDFRONT_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID;

    // Validate environment variables are present
    if (!CLOUDFRONT_MEDIA_DOMAIN || !CLOUDFRONT_PRIVATE_KEY || !CLOUDFRONT_KEY_PAIR_ID) {
        throw new Error('CloudFront environment variables missing: CLOUDFRONT_MEDIA_DOMAIN, CLOUDFRONT_PRIVATE_KEY, or CLOUDFRONT_KEY_PAIR_ID. Please ensure they are set in your .env file.');
    }

    // Normalize the CloudFront path:
    // 1. Ensure it starts with a forward slash.
    // 2. Remove any multiple consecutive forward slashes (e.g., //, ///) to prevent issues.
    const normalizedPath = processedCloudFrontPath.startsWith('/')
        ? processedCloudFrontPath
        : `/${processedCloudFrontPath}`;
    const cleanPath = normalizedPath.replace(/\/+/g, '/'); // Replaces // with /

    // Construct the full resource URL that CloudFront will serve
    const resourceUrl = `https://${CLOUDFRONT_MEDIA_DOMAIN}${cleanPath}`;

    // OPTIONAL: Check if the file exists in S3 before generating the signed URL.
    // This helps in debugging 403 errors that might be due to non-existent files.
    // For files that are processed asynchronously (e.g., by AWS MediaConvert),
    // this check might initially fail, which is expected.
    if (checkFileExists) {
        // S3 key should not start with a leading slash for HeadObjectCommand
        const s3Key = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
        try {
            await s3Client.send(new HeadObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: s3Key
            }));
            console.log(`✅ File verified in S3: ${s3Key}`);
        } catch (s3Error: any) {
            console.warn(`⚠️  File may not exist in S3: ${s3Key} - ${s3Error?.message || 'Unknown error'}. This might be expected if MediaConvert is still processing.`);
            // Do not throw an error here, as the file might be created by MediaConvert later.
        }
    }

    // Calculate expiration time for the signed URL.
    // A 2-year expiration is used here; adjust as per your security requirements.
    const currentTime = new Date();
    const expirationTime = new Date(currentTime.getTime() + (2 * 365 * 24 * 60 * 60 * 1000)); // 2 years from now

    console.log('=== CloudFront Signing Process ===');
    console.log('Path to be signed:', cleanPath);
    console.log('Full Resource URL:', resourceUrl);
    console.log('Current time (UTC):', currentTime.toISOString());
    console.log('Expiration time (UTC):', expirationTime.toISOString());
    console.log('Key Pair ID:', CLOUDFRONT_KEY_PAIR_ID);

    try {
        // CRITICAL FIX: Ensure the private key is correctly formatted with actual newlines.
        // Environment variables often escape newlines (e.g., `\n` instead of actual newline characters).
        let formattedPrivateKey = CLOUDFRONT_PRIVATE_KEY;
        // Replace escaped newlines with actual newline characters
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');

        // Validate that the private key includes the necessary BEGIN/END markers.
        // This is a common source of 403 errors if the key is copied incorrectly.
        if (!formattedPrivateKey.includes('-----BEGIN') || !formattedPrivateKey.includes('-----END')) {
            throw new Error('CLOUDFRONT_PRIVATE_KEY must include "-----BEGIN PRIVATE KEY-----" and "-----END PRIVATE KEY-----" markers with proper newlines.');
        }

        // Generate the signed URL using the CloudFront signer library
        const signedUrl = getSignedUrl({
            url: resourceUrl,
            keyPairId: CLOUDFRONT_KEY_PAIR_ID,
            privateKey: formattedPrivateKey,
            dateLessThan: expirationTime.toISOString(), // Use ISO string for consistency
        });

        // For debugging: Extract and log the 'Expires' parameter from the generated URL
        const urlParams = new URL(signedUrl);
        const expiresParam = urlParams.searchParams.get('Expires');
        if (expiresParam) {
            const expiresDate = new Date(parseInt(expiresParam) * 1000); // Expires is a Unix timestamp
            console.log('URL Expires parameter (Parsed Date):', expiresDate.toISOString());
        }

        console.log('✅ Successfully generated signed URL');
        console.log('=== End CloudFront Signing ===\n');

        return signedUrl;
    } catch (signingError: any) {
        console.error('❌ CloudFront signing failed:', signingError);
        // Provide detailed information to help diagnose the issue
        console.error('Private key format check details:', {
            hasBeginMarker: CLOUDFRONT_PRIVATE_KEY.includes('-----BEGIN'),
            hasEndMarker: CLOUDFRONT_PRIVATE_KEY.includes('-----END'),
            length: CLOUDFRONT_PRIVATE_KEY.length,
            keyPairIdLength: CLOUDFRONT_KEY_PAIR_ID.length,
            // Only log a snippet of the key, not the whole key for security
            privateKeySnippet: CLOUDFRONT_PRIVATE_KEY.substring(0, 50) + '...' + CLOUDFRONT_PRIVATE_KEY.substring(CLOUDFRONT_PRIVATE_KEY.length - 50)
        });
        throw new Error(`CloudFront signing failed: ${signingError?.message || 'Unknown signing error'}. Please check your private key format and CloudFront configuration.`);
    }
};

/**
 * Uploads a single media file to S3 and creates a corresponding database entry.
 * It also generates a CloudFront signed URL for the expected processed video path.
 *
 * @param fileBuffer The buffer of the file to upload.
 * @param originalname The original name of the file.
 * @param mimetype The MIME type of the file.
 * @param fileSize The size of the file in bytes.
 * @returns A promise that resolves with the media file metadata, including the signed CloudFront URL.
 * @throws An error if S3 upload or database operations fail.
 */
export const uploadMedia = async (
    fileBuffer: Buffer,
    originalname: string,
    mimetype: string,
    fileSize: number
): Promise<any> => {
    // Generate a unique S3 key using a timestamp and a sanitized version of the original filename.
    const timestamp = Date.now();
    // Sanitize filename to remove characters that might cause issues in S3 keys or URLs.
    const sanitizedFilename = originalname.replace(/[^a-zA-Z0-9.-_]/g, '_');
    const s3Key = `uploads/${timestamp}_${sanitizedFilename}`;

    console.log(`🚀 Starting upload process for: ${originalname}`);
    console.log(`📁 S3 Key to be used: ${s3Key}`);

    // Define parameters for the S3 PutObjectCommand
    const params: PutObjectCommandInput = {
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimetype,
        Metadata: { // Custom metadata for the S3 object
            'original-name': originalname,
            'upload-timestamp': timestamp.toString()
        }
    };

    try {
        // Step 1: Upload the file to S3
        console.log(`📤 Uploading file to S3 bucket "${S3_BUCKET_NAME}"...`);
        await s3Client.send(new PutObjectCommand(params));
        console.log(`✅ S3 upload successful: ${s3Key}`);

        // Step 2: Create a database entry for the uploaded file
        console.log(`💾 Creating database entry for ${originalname}...`);
        const mediaFileEntry = await MediaFile.create({
            originalName: originalname,
            s3Key: s3Key,
            s3Bucket: S3_BUCKET_NAME,
            s3Region: AWS_REGION,
            fileUrl: `s3://${S3_BUCKET_NAME}/${s3Key}`, // S3 URI for the original file
            mimeType: mimetype,
            fileSize: fileSize,
        });
        console.log(`✅ Database entry created with ID: ${(mediaFileEntry as any).id}`);

        // Step 3: Determine the expected path for the processed video (e.g., HLS output from MediaConvert).
        // This path is used to generate the CloudFront signed URL.
        // Based on S3 listing: processed-videos/TIMESTAMP_FILENAME/TIMESTAMP_FILENAME.m3u8
        const mediaConvertBaseName = s3Key.split('/').pop()?.split('.')[0] || ''; // Extract "TIMESTAMP_FILENAME" from "uploads/TIMESTAMP_FILENAME.ext"

        if (!mediaConvertBaseName) {
            throw new Error('Could not derive base name for processed video from S3 key.');
        }

        const processedHlsPath = `/processed-videos/${mediaConvertBaseName}/${mediaConvertBaseName}.m3u8`;
        console.log(`🎬 Expected processed video path for CloudFront: ${processedHlsPath}`);

        // Step 4: Generate a CloudFront signed URL for the *expected* processed file.
        // We set `checkFileExists` to `false` here because MediaConvert will create this file asynchronously.
        console.log(`🔐 Generating CloudFront signed URL for processed path...`);
        const signedCloudFrontUrl = await generateCloudFrontSignedUrl(processedHlsPath, false);
        console.log(`✅ Upload process completed successfully for ${originalname}`);

        // Return the database entry along with the signed CloudFront URL and other relevant paths.
        return {
            ...mediaFileEntry.toJSON(),
            fileUrl: signedCloudFrontUrl, // This is the URL for the *processed* file
            processedPath: processedHlsPath, // The path on CloudFront for the processed file
            originalS3Key: s3Key // The S3 key for the original uploaded file
        };

    } catch (error: any) {
        console.error(`❌ Upload failed for ${originalname}:`, error);

        // Enhance error messages for common S3/CloudFront issues
        if (error?.name === 'NoSuchBucket') {
            throw new Error(`S3 bucket "${S3_BUCKET_NAME}" does not exist or is not accessible. Check your S3_BUCKET_NAME configuration.`);
        } else if (error?.name === 'AccessDenied') {
            throw new Error('S3 access denied. Check IAM permissions for PutObject operation on your S3 bucket.');
        } else if (error?.message?.includes('CloudFront')) {
            throw new Error(`CloudFront configuration or signing error during upload: ${error.message}`);
        } else if (error?.message?.includes('signing')) {
            throw new Error(`URL signing failed during upload: ${error.message}. Check your CloudFront private key and key pair ID.`);
        }

        throw error; // Re-throw any other unhandled errors
    }
};

/**
 * Retrieves all media files from the database and generates CloudFront signed URLs for them.
 * This function handles potential errors during URL signing for individual files.
 *
 * @returns A promise that resolves with an array of media file metadata, each including a signed CloudFront URL or an error status.
 */
export const getAllMedia = async (): Promise<any[]> => {
    try {
        console.log(`📋 Fetching all media files from database...`);
        const mediaFiles = await MediaFile.findAll({
            order: [['createdAt', 'DESC']], // Order by creation date, newest first
        });

        console.log(`📊 Found ${mediaFiles.length} media files in database`);

        if (mediaFiles.length === 0) {
            return []; // Return an empty array if no files are found
        }

        // Process each media file to generate its signed CloudFront URL.
        // Using Promise.allSettled would be more robust if you need to continue processing
        // even if some promises fail, but Promise.all is fine if individual errors are handled.
        const mediaFilesWithSignedUrls = await Promise.all(
            mediaFiles.map(async (file, index) => {
                const fileData = file.toJSON();
                const originalFilename = fileData.originalName;

                console.log(`[${index + 1}/${mediaFiles.length}] Processing file: ${originalFilename || fileData.s3Key}`);

                // Basic validation: Ensure original filename exists for path generation
                if (!originalFilename) {
                    console.warn(`⚠️  [${index + 1}] Missing original filename for s3Key: ${fileData.s3Key}. Cannot generate processed path.`);
                    return {
                        ...fileData,
                        fileUrl: null,
                        error: 'Missing original filename for processed path generation',
                        status: 'error' // Indicate an error for this specific file
                    };
                }

                // Re-derive the processed HLS path consistently based on the stored s3Key.
                // Based on S3 listing: processed-videos/TIMESTAMP_FILENAME/TIMESTAMP_FILENAME.m3u8
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

                try {
                    // Generate signed URL. Here, we set `checkFileExists` to `true`
                    // because we expect these files to have been processed and exist in S3.
                    const signedCloudFrontUrl = await generateCloudFrontSignedUrl(processedHlsPath, true);

                    console.log(`✅ [${index + 1}] Generated signed URL successfully for ${originalFilename}`);
                    return {
                        ...fileData,
                        fileUrl: signedCloudFrontUrl, // The signed URL for the processed file
                        processedPath: processedHlsPath, // The CloudFront path for the processed file
                        status: 'ready' // Indicate successful processing
                    };
                } catch (signingError: any) {
                    console.error(`❌ [${index + 1}] Signing failed for ${originalFilename}:`, signingError?.message || 'Unknown error');
                    return {
                        ...fileData,
                        fileUrl: null,
                        error: signingError?.message || 'Unknown signing error',
                        processedPath: processedHlsPath,
                        status: 'error' // Indicate an error for this specific file
                    };
                }
            })
        );

        // Log a summary of the processing results
        const successCount = mediaFilesWithSignedUrls.filter(f => f.status === 'ready').length;
        const errorCount = mediaFilesWithSignedUrls.filter(f => f.status === 'error').length;
        console.log(`📈 Media file processing complete - Successful: ${successCount}, Failed: ${errorCount}`);

        return mediaFilesWithSignedUrls;
    } catch (error) {
        console.error('❌ Error in getAllMedia service:', error);
        throw error; // Re-throw the error for higher-level handling
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
        // Find the media file in the database
        const mediaFile = await MediaFile.findByPk(fileId);

        if (!mediaFile) {
            const error = new Error(`Media file with ID ${fileId} not found.`);
            (error as any).statusCode = 404; // Custom status code for HTTP responses
            throw error;
        }

        // Define parameters for the S3 DeleteObjectCommand
        const params: DeleteObjectCommandInput = {
            Bucket: (mediaFile as any).s3Bucket,
            Key: (mediaFile as any).s3Key, // S3 key of the original file
        };

        console.log(`🗑️ Deleting file from S3: ${(mediaFile as any).s3Key}`);
        await s3Client.send(new DeleteObjectCommand(params));
        console.log(`✅ Successfully deleted from S3.`);

        // Delete the entry from the database
        await mediaFile.destroy();
        console.log(`✅ Successfully deleted media file entry from database: ${fileId}`);

        return { message: 'Media file deleted successfully.' };
    } catch (error) {
        console.error(`❌ Error in deleteMedia service for ID ${fileId}:`, error);
        throw error; // Re-throw the error
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

    // Process files sequentially to manage resource usage and avoid potential rate limiting.
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileNumber = i + 1;

        console.log(`\n[${fileNumber}/${files.length}] Processing file: ${file.originalname}`);
        console.log(`📏 File size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`🎭 MIME type: ${file.mimetype}`);

        try {
            // Call the single file upload function
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

        // Add a small delay between uploads to prevent overwhelming S3/CloudFront with requests.
        // Adjust the delay as needed based on your expected throughput and AWS service limits.
        if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        }
    }

    // Final summary of the batch upload operation
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

// NEW UTILITY FUNCTIONS FOR DEBUGGING AND VALIDATION

/**
 * Tests CloudFront access for a given processed path by attempting to generate a signed URL
 * and optionally checking for file existence in S3.
 * This is a helpful diagnostic tool for CloudFront 403 issues.
 *
 * @param processedPath The CloudFront path to test (e.g., /processed-videos/myvideo/index.m3u8).
 * @returns An object indicating success/failure, the signed URL (if successful), error message, and file existence status.
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

        // Derive S3 key from the processed path for file existence check
        const s3Key = processedPath.startsWith('/') ? processedPath.substring(1) : processedPath;
        let fileExists = false;

        // Check if the file exists in S3
        try {
            await s3Client.send(new HeadObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: s3Key
            }));
            fileExists = true;
            console.log(`✅ File confirmed to exist in S3: ${s3Key}`);
        } catch (s3Error: any) {
            console.log(`❌ File NOT found in S3: ${s3Key} - ${s3Error?.message || 'Unknown S3 error'}`);
            // Do not throw, just report status
        }

        // Attempt to generate a signed URL (without re-checking file existence within generateCloudFrontSignedUrl)
        const signedUrl = await generateCloudFrontSignedUrl(processedPath, false);

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
            // Add specific validation checks for each environment variable
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

    return {
        valid: missing.length === 0,
        missing,
        warnings
    };
};

/**
 * Retrieves a single media file by its original filename from the database and generates a signed CloudFront URL for it.
 * Useful for debugging specific files.
 *
 * @param filename The original filename of the media file to retrieve.
 * @returns A promise that resolves with the media file metadata, including the signed URL, or an error status.
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
        // Re-derive the processed HLS path consistently based on the stored s3Key.
        // Based on S3 listing: processed-videos/TIMESTAMP_FILENAME/TIMESTAMP_FILENAME.m3u8
        const mediaConvertBaseName = fileData.s3Key.split('/').pop()?.split('.')[0] || '';

        if (!mediaConvertBaseName) {
            throw new Error('Could not derive base name for processed video from S3 key.');
        }

        const processedHlsPath = `/processed-videos/${mediaConvertBaseName}/${mediaConvertBaseName}.m3u8`;

        try {
            // Generate signed URL, checking for file existence
            const signedCloudFrontUrl = await generateCloudFrontSignedUrl(processedHlsPath, true);
            console.log(`✅ Successfully retrieved and signed URL for ${filename}`);
            return {
                ...fileData,
                fileUrl: signedCloudFrontUrl,
                processedPath: processedHlsPath,
                status: 'ready'
            };
        } catch (signingError: any) {
            console.error(`❌ Signing failed for ${filename}:`, signingError?.message || 'Unknown error');
            return {
                ...fileData,
                fileUrl: null,
                error: signingError?.message || 'Unknown signing error',
                processedPath: processedHlsPath,
                status: 'error'
            };
        }
    } catch (error: any) {
        console.error(`❌ Error in getMediaByFilename service for ${filename}:`, error);
        throw error;
    }
};
