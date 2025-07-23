// services/mediaFile.service.ts
// This file contains the core logic for interacting with AWS S3 and the database.

// Import S3Client and specific commands from AWS SDK v3
import { PutObjectCommand, DeleteObjectCommand, PutObjectCommandInput, DeleteObjectCommandInput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer'; // Import getSignedUrl for CloudFront signing
import { s3Client, S3_BUCKET_NAME, AWS_REGION } from '../config/aws'; // S3_BUCKET_NAME is your input bucket
import MediaFile from '../models/Mediafile.model';
import * as multer from 'multer'; // Explicitly import multer to make its namespace available for typing

// Helper function to generate a CloudFront signed URL for the PROCESSED HLS video
// This function now expects the *path* within the CloudFront distribution for the processed file.

const generateCloudFrontSignedUrl = async (processedCloudFrontPath: string): Promise<string> => {
    const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
    const CLOUDFRONT_PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY; // This is the variable we want to inspect
    const CLOUDFRONT_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID;

    if (!CLOUDFRONT_MEDIA_DOMAIN || !CLOUDFRONT_PRIVATE_KEY || !CLOUDFRONT_KEY_PAIR_ID) {
        throw new Error('CloudFront signing environment variables are not fully set (CLOUDFRONT_MEDIA_DOMAIN, CLOUDFRONT_PRIVATE_KEY, CLOUDFRONT_KEY_PAIR_ID).');
    }

    // --- ADD THIS CONSOLE.LOG ---
    // Log a portion of the key to avoid exposing the full key in logs, but enough to check format.
    console.log('CLOUDFRONT_PRIVATE_KEY prefix (first 50 chars):', CLOUDFRONT_PRIVATE_KEY.substring(0, 50));
    console.log('CLOUDFRONT_PRIVATE_KEY suffix (last 50 chars):', CLOUDFRONT_PRIVATE_KEY.slice(-50));
    console.log('CLOUDFRONT_PRIVATE_KEY length:', CLOUDFRONT_PRIVATE_KEY.length);
    console.log('CLOUDFRONT_PRIVATE_KEY contains BEGIN:', CLOUDFRONT_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----'));
    console.log('CLOUDFRONT_PRIVATE_KEY contains END:', CLOUDFRONT_PRIVATE_KEY.includes('-----END PRIVATE KEY-----'));
    // --- END ADD ---

    const resourceUrl = `https://${CLOUDFRONT_MEDIA_DOMAIN}${processedCloudFrontPath}`;

    console.log('Resource URL being signed:', resourceUrl); // Keep this log

    const dateLessThan = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const signedUrl = getSignedUrl({
        url: resourceUrl,
        keyPairId: CLOUDFRONT_KEY_PAIR_ID,
        privateKey: CLOUDFRONT_PRIVATE_KEY,
        dateLessThan: dateLessThan.toISOString(),
    });

    return signedUrl;
};

// Function to upload a file to S3 (raw bucket) and save its metadata to the database
export const uploadMedia = async (fileBuffer: Buffer, originalname: string, mimetype: string, fileSize: number): Promise<any> => {
    // Generate a unique key for S3 to avoid overwrites in the RAW uploads bucket
    const s3Key = `uploads/${Date.now()}_${originalname.replace(/\s/g, '_')}`;

    const params: PutObjectCommandInput = { // Use v3 specific input type
        Bucket: S3_BUCKET_NAME, // This is your input S3 bucket (e.g., admin-media-library)
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimetype,
    };

    try {
        // 1. Upload the raw video to the input S3 bucket
        await s3Client.send(new PutObjectCommand(params));

        // 2. Store the original S3 Key and other metadata in the database.
        // The s3Key stored here refers to the RAW file in the input bucket.
        // The Lambda will use this s3Key to find the file for processing.
        const mediaFileEntry = await MediaFile.create({
            originalName: originalname,
            s3Key: s3Key, // Store the raw S3 key
            s3Bucket: S3_BUCKET_NAME, // Store the raw S3 bucket name
            s3Region: AWS_REGION,
            fileUrl: `s3://${S3_BUCKET_NAME}/${s3Key}`, // Store a logical S3 path to the raw file
            mimeType: mimetype,
            fileSize: fileSize,
            // uploadedByAdminId: adminId, // Uncomment if tracking admin uploads
        });

        // 3. Construct the path for the PROCESSED HLS video to generate the signed URL
        // This path must match how MediaConvert outputs files to your optimized bucket.
        // Example: s3://adminoptimzedvideos/processed-videos/YOUR_VIDEO_FILENAME_WITHOUT_EXTENSION/index.m3u8
        const filenameWithoutExtension = originalname.replace(/\s/g, '_').split('.').slice(0, -1).join('.');
        const processedHlsPath = `/processed-videos/${filenameWithoutExtension}/index.m3u8`; // Ensure this matches your MediaConvert output prefix

        // 4. Generate the CloudFront signed URL for the PROCESSED HLS video
        const signedCloudFrontUrl = await generateCloudFrontSignedUrl(processedHlsPath);

        // Return the metadata including the signed URL for the processed video
        return { ...mediaFileEntry.toJSON(), fileUrl: signedCloudFrontUrl }; // Override fileUrl with signed URL of processed video
    } catch (error) {
        console.error('Error in uploadMedia service:', error);
        throw error; // Re-throw to be caught by the controller
    }
};

// Function to get all media file metadata from the database
export const getAllMedia = async (): Promise<any[]> => {
    try {
        const mediaFiles = await MediaFile.findAll({
            order: [['createdAt', 'DESC']], // Order by most recent first
        });

        // For each media file, generate a CloudFront signed URL for its PROCESSED version
        const mediaFilesWithSignedUrls = await Promise.all(
            mediaFiles.map(async (file) => {
                const fileData = file.toJSON();
                // We need the original filename to derive the processed HLS path.
                // Assuming `originalName` is reliably stored in the DB.
                const originalFilename = fileData.originalName;
                if (!originalFilename) {
                    console.warn(`Original filename not found for s3Key: ${fileData.s3Key}. Skipping signed URL generation.`);
                    return { ...fileData, fileUrl: null }; // Or handle as an error
                }

                const filenameWithoutExtension = originalFilename.replace(/\s/g, '_').split('.').slice(0, -1).join('.');
                const processedHlsPath = `/processed-videos/${filenameWithoutExtension}/index.m3u8`; // Ensure this matches your MediaConvert output prefix

                try {
                    const signedCloudFrontUrl = await generateCloudFrontSignedUrl(processedHlsPath);
                    return { ...fileData, fileUrl: signedCloudFrontUrl }; // Replace stored fileUrl with signed one
                } catch (signingError) {
                    console.error(`Error generating signed URL for ${fileData.s3Key}:`, signingError);
                    return { ...fileData, fileUrl: null }; // Return null or a fallback URL if signing fails
                }
            })
        );

        return mediaFilesWithSignedUrls;
    } catch (error) {
        console.error('Error in getAllMedia service:', error);
        throw error;
    }
};

// Function to delete a media file from S3 and its metadata from the database
export const deleteMedia = async (fileId: string): Promise<{ message: string }> => {
    try {
        const mediaFile = await MediaFile.findByPk(fileId);

        if (!mediaFile) {
            const error = new Error('Media file not found.');
            (error as any).statusCode = 404; // Custom status code for controller
            throw error;
        }

        // Delete the raw file from the input S3 bucket
        const params: DeleteObjectCommandInput = { // Use v3 specific input type
            Bucket: (mediaFile as any).s3Bucket, // Cast to any to bypass type checking
            Key: (mediaFile as any).s3Key,       // Cast to any to bypass type checking
        };
        await s3Client.send(new DeleteObjectCommand(params));

        // TODO: Optionally, add logic here to delete the PROCESSED video files from the optimized bucket.
        // This would involve constructing the processedHlsPath and deleting all segments and manifests.
        // This is more complex and might require listing objects in the processed-videos/filename/ folder.

        await mediaFile.destroy(); // Delete metadata from DB

        return { message: 'Media file deleted successfully.' };
    } catch (error) {
        console.error('Error in deleteMedia service:', error);
        throw error;
    }
};

// NEW: Function to upload multiple files to S3 and save their metadata
export const uploadMultipleMedia = async (files: multer.File[]): Promise<any[]> => {
    const uploadedFilesMetadata: any[] = [];

    for (const file of files) {
        const originalname = file.originalname; // This is correctly 'originalname'
        const mimetype = file.mimetype;
        const buffer = file.buffer;
        const fileSize = file.size;

        const s3Key = `uploads/${Date.now()}_${originalname.replace(/\s/g, '_')}`; // Key for raw file in input bucket

        const params: PutObjectCommandInput = { // Use v3 specific input type
            Bucket: S3_BUCKET_NAME, // Your input S3 bucket
            Key: s3Key,
            Body: buffer,
            ContentType: mimetype,
        };

        try {
            // 1. Upload the raw video
            await s3Client.send(new PutObjectCommand(params));

            // 2. Store metadata for the raw file
            const mediaFileEntry = await MediaFile.create({
                originalName: originalname, // Store originalname in DB
                s3Key: s3Key,
                s3Bucket: S3_BUCKET_NAME,
                s3Region: AWS_REGION,
                fileUrl: `s3://${S3_BUCKET_NAME}/${s3Key}`, // Logical S3 path to raw file
                mimeType: mimetype,
                fileSize: fileSize,
            });

            // 3. Construct the path for the PROCESSED HLS video
            const filenameWithoutExtension = originalname.replace(/\s/g, '_').split('.').slice(0, -1).join('.');
            const processedHlsPath = `/processed-videos/${filenameWithoutExtension}/index.m3u8`; // Ensure this matches your MediaConvert output prefix

            // 4. Generate signed URL for the PROCESSED HLS video
            const signedCloudFrontUrl = await generateCloudFrontSignedUrl(processedHlsPath);

            uploadedFilesMetadata.push({ ...mediaFileEntry.toJSON(), fileUrl: signedCloudFrontUrl });
        } catch (error: any) { // <--- Added ': any' to explicitly type 'error'
            console.error(`Error uploading file ${originalname} in batch:`, error);
            // Corrected 'originalName' to 'originalname' and cast 'error' to 'Error' for .message
            uploadedFilesMetadata.push({ originalname, error: (error as Error).message, status: 'failed' });
        }
    }
    return uploadedFilesMetadata;
};