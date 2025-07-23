// services/mediaFile.service.ts
// This file contains the core logic for interacting with AWS S3 and the database.

// Import S3Client and specific commands from AWS SDK v3
import { PutObjectCommand, DeleteObjectCommand, PutObjectCommandInput, DeleteObjectCommandInput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer'; // Import getSignedUrl for CloudFront signing
import { s3Client, S3_BUCKET_NAME, AWS_REGION } from '../config/aws';
import MediaFile from '../models/Mediafile.model';
import * as multer from 'multer'; // Explicitly import multer to make its namespace available for typing

// Helper function to generate a CloudFront signed URL
const generateCloudFrontSignedUrl = async (processedCloudFrontPath: string): Promise<string> => {
  const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
  const CLOUDFRONT_PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY;
  const CLOUDFRONT_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID;

  if (!CLOUDFRONT_MEDIA_DOMAIN || !CLOUDFRONT_PRIVATE_KEY || !CLOUDFRONT_KEY_PAIR_ID) {
    throw new Error('CloudFront signing environment variables are not fully set (CLOUDFRONT_MEDIA_DOMAIN, CLOUDFRONT_PRIVATE_KEY, CLOUDFRONT_KEY_PAIR_ID).');
  }

  // The URL that CloudFront will sign. This is the CloudFront distribution domain + S3 Key path.
    const resourceUrl = `https://${CLOUDFRONT_MEDIA_DOMAIN}${processedCloudFrontPath}`;

  // Set a long expiration time (e.g., 1 year from now)
  // Max expiration is 7 days (604800 seconds) for direct S3 pre-signed URLs.
  // For CloudFront signed URLs, the maximum is 365 days (or 7 days for custom policies, check docs).
  // Let's use 1 year (approx 31,536,000 seconds) for app resources.
  const dateLessThan = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

  const signedUrl = getSignedUrl({
    url: resourceUrl,
    keyPairId: CLOUDFRONT_KEY_PAIR_ID,
    privateKey: CLOUDFRONT_PRIVATE_KEY,
    dateLessThan: dateLessThan.toISOString(), // Required format for dateLessThan
  });

  return signedUrl;
};


// Function to upload a file to S3 and save its metadata to the database
export const uploadMedia = async (fileBuffer: Buffer, originalname: string, mimetype: string, fileSize: number): Promise<any> => {
  // Generate a unique key for S3 to avoid overwrites
  const s3Key = `uploads/${Date.now()}_${originalname.replace(/\s/g, '_')}`;

  const params: PutObjectCommandInput = { // Use v3 specific input type
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: mimetype,
    // ACL: 'public-read', // REMOVED: Objects are private by default. Access via signed URLs.
  };

  try {
    await s3Client.send(new PutObjectCommand(params));

    // Store the S3 Key and Bucket name in the database.
    // The fileUrl in the DB will be a logical S3 path.
    const mediaFileEntry = await MediaFile.create({
      originalName: originalname,
      s3Key: s3Key,
      s3Bucket: S3_BUCKET_NAME,
      s3Region: AWS_REGION,
      fileUrl: `s3://${S3_BUCKET_NAME}/${s3Key}`, // Store a logical S3 path
      mimeType: mimetype,
      fileSize: fileSize,
      // uploadedByAdminId: adminId, // Uncomment if tracking admin uploads
    });

            const filenameWithoutExtension = originalname.replace(/\s/g, '_').split('.').slice(0, -1).join('.');
        const processedHlsPath = `/processed-videos/${filenameWithoutExtension}/index.m3u8`; // Ensure this matches your MediaConvert output prefix


    // Return the CloudFront signed URL for immediate use in the frontend
    const signedCloudFrontUrl = await generateCloudFrontSignedUrl(processedHlsPath);
    return { ...mediaFileEntry.toJSON(), fileUrl: signedCloudFrontUrl }; // Override fileUrl with signed URL
  } catch (error) {
    console.error('Error in uploadMedia service:', error);
    throw error; // Re-throw to be caught by the controller
  }
};
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

    const params: DeleteObjectCommandInput = { // Use v3 specific input type
      Bucket: (mediaFile as any).s3Bucket, // Cast to any to bypass type checking
      Key: (mediaFile as any).s3Key,       // Cast to any to bypass type checking
    };
    await s3Client.send(new DeleteObjectCommand(params));
    await mediaFile.destroy();

    return { message: 'Media file deleted successfully.' };
  } catch (error) {
    console.error('Error in deleteMedia service:', error);
    throw error;
  }
};

// NEW: Function to upload multiple files to S3 and save their metadata
export const uploadMultipleMedia = async (files: multer.File[]): Promise<any[]> => {
  const uploadedFilesMetadata: any[] = [];
  const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
  if (!CLOUDFRONT_MEDIA_DOMAIN) {
    throw new Error('CLOUDFRONT_MEDIA_DOMAIN environment variable is not set.');
  }

  for (const file of files) {
    const originalname = file.originalname;
    const mimetype = file.mimetype;
    const buffer = file.buffer;
    const fileSize = file.size;

    const s3Key = `uploads/${Date.now()}_${originalname.replace(/\s/g, '_')}`;

    const params: PutObjectCommandInput = { // Use v3 specific input type
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: mimetype,
      // ACL: 'public-read', // REMOVED: Objects are private by default. Access via signed URLs.
    };

    try {
      await s3Client.send(new PutObjectCommand(params));

      const mediaFileEntry = await MediaFile.create({
        originalName: originalname,
        s3Key: s3Key,
        s3Bucket: S3_BUCKET_NAME,
        s3Region: AWS_REGION,
        fileUrl: `s3://${S3_BUCKET_NAME}/${s3Key}`, // Store logical S3 path
        mimeType: mimetype,
        fileSize: fileSize,
      });
       const filenameWithoutExtension = originalname.replace(/\s/g, '_').split('.').slice(0, -1).join('.');
            const processedHlsPath = `/processed-videos/${filenameWithoutExtension}/index.m3u8`; // Ensure this matches your MediaConvert output prefix
            const signedCloudFrontUrl = await generateCloudFrontSignedUrl(processedHlsPath);

      uploadedFilesMetadata.push({ ...mediaFileEntry.toJSON(), fileUrl: signedCloudFrontUrl });
    } catch (error) {
      console.error(`Error uploading file ${originalname} in batch:`, error);
      // Decide how to handle individual file failures in a batch:
      // - Continue with other files and report partial success
      // - Re-throw immediately to fail the whole batch
      // For now, we'll log and continue.
    }
  }
  return uploadedFilesMetadata;
};