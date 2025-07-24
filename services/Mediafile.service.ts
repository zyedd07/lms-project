// services/mediaFile.service.ts
// COMPLETE FIXED VERSION - This addresses all the CloudFront 403 issues

import { PutObjectCommand, DeleteObjectCommand, PutObjectCommandInput, DeleteObjectCommandInput, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import { s3Client, S3_BUCKET_NAME, AWS_REGION } from '../config/aws';
import MediaFile from '../models/Mediafile.model';
import * as multer from 'multer';

// CRITICAL: Fixed CloudFront signing with proper error handling and file existence check
const generateCloudFrontSignedUrl = async (processedCloudFrontPath: string, checkFileExists: boolean = true): Promise<string> => {
    const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
    const CLOUDFRONT_PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY;
    const CLOUDFRONT_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID;

    // Validate environment variables
    if (!CLOUDFRONT_MEDIA_DOMAIN || !CLOUDFRONT_PRIVATE_KEY || !CLOUDFRONT_KEY_PAIR_ID) {
        throw new Error('CloudFront environment variables missing: CLOUDFRONT_MEDIA_DOMAIN, CLOUDFRONT_PRIVATE_KEY, or CLOUDFRONT_KEY_PAIR_ID');
    }

    // Normalize path - ensure it starts with forward slash and remove any double slashes
    const normalizedPath = processedCloudFrontPath.startsWith('/') 
        ? processedCloudFrontPath 
        : `/${processedCloudFrontPath}`;
    
    const cleanPath = normalizedPath.replace(/\/+/g, '/'); // Remove double slashes
    const resourceUrl = `https://${CLOUDFRONT_MEDIA_DOMAIN}${cleanPath}`;

    // OPTIONAL: Check if file exists in S3 before signing (helps with debugging)
    if (checkFileExists) {
        const s3Key = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
        try {
            await s3Client.send(new HeadObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: s3Key
            }));
            console.log(`✅ File verified in S3: ${s3Key}`);
        } catch (s3Error: any) {
            console.warn(`⚠️  File may not exist in S3: ${s3Key} - ${s3Error?.message || 'Unknown error'}`);
            // Don't throw error here - file might be created by MediaConvert later
        }
    }

    // FIXED: Proper UTC time handling for signing
    const currentTime = new Date();
    const expirationTime = new Date(currentTime.getTime() + (2 * 365 * 24 * 60 * 60 * 1000)); // 2 years from now

    console.log('=== CloudFront Signing ===');
    console.log('Path:', cleanPath);
    console.log('Resource URL:', resourceUrl);
    console.log('Current time (UTC):', currentTime.toISOString());
    console.log('Expiration time (UTC):', expirationTime.toISOString());
    console.log('Key Pair ID:', CLOUDFRONT_KEY_PAIR_ID);

    try {
        // FIXED: Ensure private key is properly formatted
        let formattedPrivateKey = CLOUDFRONT_PRIVATE_KEY;
        if (!formattedPrivateKey.includes('-----BEGIN') || !formattedPrivateKey.includes('-----END')) {
            throw new Error('CLOUDFRONT_PRIVATE_KEY must include BEGIN and END markers');
        }

        // Replace any escaped newlines with actual newlines
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');

        const signedUrl = getSignedUrl({
            url: resourceUrl,
            keyPairId: CLOUDFRONT_KEY_PAIR_ID,
            privateKey: formattedPrivateKey,
            dateLessThan: expirationTime.toISOString(),
        });

        // Extract and log the expires parameter for debugging
        const urlParams = new URL(signedUrl);
        const expiresParam = urlParams.searchParams.get('Expires');
        if (expiresParam) {
            const expiresDate = new Date(parseInt(expiresParam) * 1000);
            console.log('URL Expires parameter:', expiresDate.toISOString());
        }

        console.log('✅ Successfully generated signed URL');
        console.log('=== End Signing ===\n');

        return signedUrl;
    } catch (signingError: any) {
        console.error('❌ CloudFront signing failed:', signingError);
        console.error('Private key format check:', {
            hasBeginMarker: CLOUDFRONT_PRIVATE_KEY.includes('-----BEGIN'),
            hasEndMarker: CLOUDFRONT_PRIVATE_KEY.includes('-----END'),
            length: CLOUDFRONT_PRIVATE_KEY.length,
            keyPairIdLength: CLOUDFRONT_KEY_PAIR_ID.length
        });
        throw new Error(`CloudFront signing failed: ${signingError?.message || 'Unknown signing error'}`);
    }
};

// FIXED: Enhanced upload with better path handling and validation
export const uploadMedia = async (
    fileBuffer: Buffer, 
    originalname: string, 
    mimetype: string, 
    fileSize: number
): Promise<any> => {
    // Generate timestamp-based S3 key
    const timestamp = Date.now();
    const sanitizedFilename = originalname.replace(/[^a-zA-Z0-9.-_]/g, '_'); // Remove special chars
    const s3Key = `uploads/${timestamp}_${sanitizedFilename}`;

    console.log(`🚀 Starting upload process for: ${originalname}`);
    console.log(`📁 S3 Key: ${s3Key}`);

    const params: PutObjectCommandInput = {
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimetype,
        Metadata: {
            'original-name': originalname,
            'upload-timestamp': timestamp.toString()
        }
    };

    try {
        // Upload to S3
        console.log(`📤 Uploading to S3...`);
        await s3Client.send(new PutObjectCommand(params));
        console.log(`✅ S3 upload successful: ${s3Key}`);

        // Create database entry
        console.log(`💾 Creating database entry...`);
        const mediaFileEntry = await MediaFile.create({
            originalName: originalname,
            s3Key: s3Key,
            s3Bucket: S3_BUCKET_NAME,
            s3Region: AWS_REGION,
            fileUrl: `s3://${S3_BUCKET_NAME}/${s3Key}`,
            mimeType: mimetype,
            fileSize: fileSize,
        });
        console.log(`✅ Database entry created with ID: ${(mediaFileEntry as any).id}`);

        // Generate processed video path (MediaConvert output location)
        const filenameWithoutExtension = sanitizedFilename
            .split('.')
            .slice(0, -1)
            .join('.');
        
        const processedHlsPath = `/processed-videos/${filenameWithoutExtension}/index.m3u8`;
        console.log(`🎬 Expected processed video path: ${processedHlsPath}`);
        
        // Generate signed URL (don't check file existence yet - MediaConvert will create it)
        console.log(`🔐 Generating CloudFront signed URL...`);
        const signedCloudFrontUrl = await generateCloudFrontSignedUrl(processedHlsPath, false);
        console.log(`✅ Upload process completed successfully`);
        
        return { 
            ...mediaFileEntry.toJSON(), 
            fileUrl: signedCloudFrontUrl,
            processedPath: processedHlsPath,
            originalS3Key: s3Key
        };

    } catch (error: any) {
        console.error(`❌ Upload failed for ${originalname}:`, error);
        
        // Enhanced error handling with specific error types
        if (error?.name === 'NoSuchBucket') {
            throw new Error(`S3 bucket "${S3_BUCKET_NAME}" does not exist or is not accessible`);
        } else if (error?.name === 'AccessDenied') {
            throw new Error('S3 access denied. Check IAM permissions for PutObject operation');
        } else if (error?.message?.includes('CloudFront')) {
            throw new Error(`CloudFront configuration error: ${error.message}`);
        } else if (error?.message?.includes('signing')) {
            throw new Error(`URL signing failed: ${error.message}`);
        }
        
        throw error;
    }
};

// FIXED: Enhanced getAllMedia with robust error handling and file validation
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

        // Process each file with signed URL generation
        const mediaFilesWithSignedUrls = await Promise.all(
            mediaFiles.map(async (file, index) => {
                const fileData = file.toJSON();
                const originalFilename = fileData.originalName;
                
                console.log(`[${index + 1}/${mediaFiles.length}] Processing: ${originalFilename}`);
                
                if (!originalFilename) {
                    console.warn(`⚠️  [${index + 1}] Missing original filename for s3Key: ${fileData.s3Key}`);
                    return { 
                        ...fileData, 
                        fileUrl: null, 
                        error: 'Missing original filename',
                        status: 'error'
                    };
                }

                // FIXED: Better filename sanitization matching upload process
                const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.-_]/g, '_');
                const filenameWithoutExtension = sanitizedFilename
                    .split('.')
                    .slice(0, -1)
                    .join('.');
                
                const processedHlsPath = `/processed-videos/${filenameWithoutExtension}/index.m3u8`;

                try {
                    // Generate signed URL with file existence check
                    const signedCloudFrontUrl = await generateCloudFrontSignedUrl(processedHlsPath, true);
                    
                    console.log(`✅ [${index + 1}] Generated signed URL successfully`);
                    return { 
                        ...fileData, 
                        fileUrl: signedCloudFrontUrl,
                        processedPath: processedHlsPath,
                        status: 'ready'
                    };
                } catch (signingError: any) {
                    console.error(`❌ [${index + 1}] Signing failed for ${originalFilename}:`, signingError?.message || 'Unknown error');
                    return { 
                        ...fileData, 
                        fileUrl: null, 
                        error: signingError?.message || 'Unknown signing error',
                        processedPath: processedHlsPath,
                        status: 'error'
                    };
                }
            })
        );

        // Log summary
        const successCount = mediaFilesWithSignedUrls.filter(f => f.status === 'ready').length;
        const errorCount = mediaFilesWithSignedUrls.filter(f => f.status === 'error').length;
        console.log(`📈 Processing complete - Success: ${successCount}, Errors: ${errorCount}`);

        return mediaFilesWithSignedUrls;
    } catch (error) {
        console.error('❌ Error in getAllMedia service:', error);
        throw error;
    }
};

export const deleteMedia = async (fileId: string): Promise<{ message: string }> => {
    try {
        const mediaFile = await MediaFile.findByPk(fileId);

        if (!mediaFile) {
            const error = new Error('Media file not found.');
            (error as any).statusCode = 404;
            throw error;
        }

        // Delete from S3
        const params: DeleteObjectCommandInput = {
            Bucket: (mediaFile as any).s3Bucket,
            Key: (mediaFile as any).s3Key,
        };

        console.log(`Deleting from S3: ${(mediaFile as any).s3Key}`);
        await s3Client.send(new DeleteObjectCommand(params));
        
        // Delete from database
        await mediaFile.destroy();
        console.log(`Successfully deleted media file: ${fileId}`);

        return { message: 'Media file deleted successfully.' };
    } catch (error) {
        console.error('Error in deleteMedia service:', error);
        throw error;
    }
};

// FIXED: Enhanced multiple file upload with better error handling
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
    console.log(`🔄 Starting batch upload of ${files.length} files`);
    
    const uploadedFilesMetadata: any[] = [];
    const errors: any[] = [];

    // Process files sequentially to avoid overwhelming S3/CloudFront
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileNumber = i + 1;
        
        console.log(`\n[${fileNumber}/${files.length}] Processing: ${file.originalname}`);
        console.log(`📏 File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
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
            
            console.log(`✅ [${fileNumber}/${files.length}] Success: ${file.originalname}`);
            
        } catch (error: any) {
            console.error(`❌ [${fileNumber}/${files.length}] Failed: ${file.originalname}`, error?.message || 'Unknown error');
            errors.push({
                filename: file.originalname,
                error: error?.message || 'Unknown error',
                batchIndex: fileNumber,
                fileSize: file.size,
                mimeType: file.mimetype
            });
        }

        // Add small delay between uploads to prevent rate limiting
        if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Final summary
    console.log(`\n📊 Batch upload completed:`);
    console.log(`✅ Successful uploads: ${uploadedFilesMetadata.length}`);
    console.log(`❌ Failed uploads: ${errors.length}`);
    
    if (errors.length > 0) {
        console.log(`\n💥 Upload errors:`);
        errors.forEach((err, idx) => {
            console.log(`  ${idx + 1}. ${err.filename}: ${err.error}`);
        });
    }

    // Return results with error information included
    return {
        successful: uploadedFilesMetadata,
        failed: errors,
        summary: {
            total: files.length,
            successful: uploadedFilesMetadata.length,
            failed: errors.length,
            successRate: Math.round((uploadedFilesMetadata.length / files.length) * 100)
        }
    };
};

// NEW: Utility functions for debugging and validation
export const testCloudFrontAccess = async (processedPath: string): Promise<{ 
    success: boolean; 
    signedUrl?: string; 
    error?: string; 
    fileExists?: boolean;
    s3Key?: string;
}> => {
    try {
        console.log(`🧪 Testing CloudFront access for: ${processedPath}`);
        
        // Check if file exists in S3
        const s3Key = processedPath.startsWith('/') ? processedPath.substring(1) : processedPath;
        let fileExists = false;
        
        try {
            await s3Client.send(new HeadObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: s3Key
            }));
            fileExists = true;
            console.log(`✅ File exists in S3: ${s3Key}`);
        } catch (s3Error: any) {
            console.log(`❌ File not found in S3: ${s3Key}`);
        }

        // Test signed URL generation
        const signedUrl = await generateCloudFrontSignedUrl(processedPath, false);
        
        return { 
            success: true, 
            signedUrl, 
            fileExists,
            s3Key 
        };
    } catch (error: any) {
        return { 
            success: false, 
            error: error?.message || 'Unknown error',
            fileExists: false
        };
    }
};

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
            // Additional validation
            if (envVar === 'CLOUDFRONT_PRIVATE_KEY') {
                if (!value.includes('-----BEGIN') || !value.includes('-----END')) {
                    warnings.push('CLOUDFRONT_PRIVATE_KEY may be missing BEGIN/END markers');
                }
            } else if (envVar === 'CLOUDFRONT_MEDIA_DOMAIN') {
                if (value.includes('http://') || value.includes('https://')) {
                    warnings.push('CLOUDFRONT_MEDIA_DOMAIN should not include protocol (http/https)');
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

// NEW: Function to get media by filename (useful for debugging specific files)
export const getMediaByFilename = async (filename: string): Promise<any> => {
    try {
        const mediaFile = await MediaFile.findOne({
            where: {
                originalName: filename
            }
        });

        if (!mediaFile) {
            throw new Error(`Media file not found: ${filename}`);
        }

        const fileData = mediaFile.toJSON();
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-_]/g, '_');
        const filenameWithoutExtension = sanitizedFilename.split('.').slice(0, -1).join('.');
        const processedHlsPath = `/processed-videos/${filenameWithoutExtension}/index.m3u8`;

        try {
            const signedCloudFrontUrl = await generateCloudFrontSignedUrl(processedHlsPath, true);
            return { 
                ...fileData, 
                fileUrl: signedCloudFrontUrl,
                processedPath: processedHlsPath,
                status: 'ready'
            };
        } catch (signingError: any) {
            return { 
                ...fileData, 
                fileUrl: null,
                error: signingError?.message || 'Unknown signing error',
                processedPath: processedHlsPath,
                status: 'error'
            };
        }
    } catch (error: any) {
        console.error('Error in getMediaByFilename:', error);
        throw error;
    }
};