"use strict";
// services/mediaFile.service.ts
// This file contains the core logic for interacting with AWS S3 and the database.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleMedia = exports.deleteMedia = exports.getAllMedia = exports.uploadMedia = void 0;
// Import S3Client and specific commands from AWS SDK v3
const client_s3_1 = require("@aws-sdk/client-s3");
const cloudfront_signer_1 = require("@aws-sdk/cloudfront-signer"); // Import getSignedUrl for CloudFront signing
const aws_1 = require("../config/aws"); // S3_BUCKET_NAME is your input bucket
const Mediafile_model_1 = __importDefault(require("../models/Mediafile.model"));
// Helper function to generate a CloudFront signed URL for the PROCESSED HLS video
// This function now expects the *path* within the CloudFront distribution for the processed file.
const generateCloudFrontSignedUrl = (processedCloudFrontPath) => __awaiter(void 0, void 0, void 0, function* () {
    // This environment variable MUST point to your NEW CloudFront distribution domain
    // (e.g., dy7qsaivtb43z.cloudfront.net)
    const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
    const CLOUDFRONT_PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY;
    const CLOUDFRONT_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID;
    if (!CLOUDFRONT_MEDIA_DOMAIN || !CLOUDFRONT_PRIVATE_KEY || !CLOUDFRONT_KEY_PAIR_ID) {
        throw new Error('CloudFront signing environment variables are not fully set (CLOUDFRONT_MEDIA_DOMAIN, CLOUDFRONT_PRIVATE_KEY, CLOUDFRONT_KEY_PAIR_ID).');
    }
    // The full URL that CloudFront will sign.
    // It's the CloudFront distribution domain + the specific path to the HLS master manifest.
    const resourceUrl = `https://${CLOUDFRONT_MEDIA_DOMAIN}${processedCloudFrontPath}`;
    // Set a long expiration time (e.g., 1 year from now)
    const dateLessThan = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    const signedUrl = (0, cloudfront_signer_1.getSignedUrl)({
        url: resourceUrl,
        keyPairId: CLOUDFRONT_KEY_PAIR_ID,
        privateKey: CLOUDFRONT_PRIVATE_KEY,
        dateLessThan: dateLessThan.toISOString(), // Required format for dateLessThan
    });
    return signedUrl;
});
// Function to upload a file to S3 (raw bucket) and save its metadata to the database
const uploadMedia = (fileBuffer, originalname, mimetype, fileSize) => __awaiter(void 0, void 0, void 0, function* () {
    // Generate a unique key for S3 to avoid overwrites in the RAW uploads bucket
    const s3Key = `uploads/${Date.now()}_${originalname.replace(/\s/g, '_')}`;
    const params = {
        Bucket: aws_1.S3_BUCKET_NAME, // This is your input S3 bucket (e.g., admin-media-library)
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimetype,
    };
    try {
        // 1. Upload the raw video to the input S3 bucket
        yield aws_1.s3Client.send(new client_s3_1.PutObjectCommand(params));
        // 2. Store the original S3 Key and other metadata in the database.
        // The s3Key stored here refers to the RAW file in the input bucket.
        // The Lambda will use this s3Key to find the file for processing.
        const mediaFileEntry = yield Mediafile_model_1.default.create({
            originalName: originalname,
            s3Key: s3Key, // Store the raw S3 key
            s3Bucket: aws_1.S3_BUCKET_NAME, // Store the raw S3 bucket name
            s3Region: aws_1.AWS_REGION,
            fileUrl: `s3://${aws_1.S3_BUCKET_NAME}/${s3Key}`, // Store a logical S3 path to the raw file
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
        const signedCloudFrontUrl = yield generateCloudFrontSignedUrl(processedHlsPath);
        // Return the metadata including the signed URL for the processed video
        return Object.assign(Object.assign({}, mediaFileEntry.toJSON()), { fileUrl: signedCloudFrontUrl }); // Override fileUrl with signed URL of processed video
    }
    catch (error) {
        console.error('Error in uploadMedia service:', error);
        throw error; // Re-throw to be caught by the controller
    }
});
exports.uploadMedia = uploadMedia;
// Function to get all media file metadata from the database
const getAllMedia = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mediaFiles = yield Mediafile_model_1.default.findAll({
            order: [['createdAt', 'DESC']], // Order by most recent first
        });
        // For each media file, generate a CloudFront signed URL for its PROCESSED version
        const mediaFilesWithSignedUrls = yield Promise.all(mediaFiles.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const fileData = file.toJSON();
            // We need the original filename to derive the processed HLS path.
            // Assuming `originalName` is reliably stored in the DB.
            const originalFilename = fileData.originalName;
            if (!originalFilename) {
                console.warn(`Original filename not found for s3Key: ${fileData.s3Key}. Skipping signed URL generation.`);
                return Object.assign(Object.assign({}, fileData), { fileUrl: null }); // Or handle as an error
            }
            const filenameWithoutExtension = originalFilename.replace(/\s/g, '_').split('.').slice(0, -1).join('.');
            const processedHlsPath = `/processed-videos/${filenameWithoutExtension}/index.m3u8`; // Ensure this matches your MediaConvert output prefix
            try {
                const signedCloudFrontUrl = yield generateCloudFrontSignedUrl(processedHlsPath);
                return Object.assign(Object.assign({}, fileData), { fileUrl: signedCloudFrontUrl }); // Replace stored fileUrl with signed one
            }
            catch (signingError) {
                console.error(`Error generating signed URL for ${fileData.s3Key}:`, signingError);
                return Object.assign(Object.assign({}, fileData), { fileUrl: null }); // Return null or a fallback URL if signing fails
            }
        })));
        return mediaFilesWithSignedUrls;
    }
    catch (error) {
        console.error('Error in getAllMedia service:', error);
        throw error;
    }
});
exports.getAllMedia = getAllMedia;
// Function to delete a media file from S3 and its metadata from the database
const deleteMedia = (fileId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mediaFile = yield Mediafile_model_1.default.findByPk(fileId);
        if (!mediaFile) {
            const error = new Error('Media file not found.');
            error.statusCode = 404; // Custom status code for controller
            throw error;
        }
        // Delete the raw file from the input S3 bucket
        const params = {
            Bucket: mediaFile.s3Bucket, // Cast to any to bypass type checking
            Key: mediaFile.s3Key, // Cast to any to bypass type checking
        };
        yield aws_1.s3Client.send(new client_s3_1.DeleteObjectCommand(params));
        // TODO: Optionally, add logic here to delete the PROCESSED video files from the optimized bucket.
        // This would involve constructing the processedHlsPath and deleting all segments and manifests.
        // This is more complex and might require listing objects in the processed-videos/filename/ folder.
        yield mediaFile.destroy(); // Delete metadata from DB
        return { message: 'Media file deleted successfully.' };
    }
    catch (error) {
        console.error('Error in deleteMedia service:', error);
        throw error;
    }
});
exports.deleteMedia = deleteMedia;
// NEW: Function to upload multiple files to S3 and save their metadata
const uploadMultipleMedia = (files) => __awaiter(void 0, void 0, void 0, function* () {
    const uploadedFilesMetadata = [];
    for (const file of files) {
        const originalname = file.originalname; // This is correctly 'originalname'
        const mimetype = file.mimetype;
        const buffer = file.buffer;
        const fileSize = file.size;
        const s3Key = `uploads/${Date.now()}_${originalname.replace(/\s/g, '_')}`; // Key for raw file in input bucket
        const params = {
            Bucket: aws_1.S3_BUCKET_NAME, // Your input S3 bucket
            Key: s3Key,
            Body: buffer,
            ContentType: mimetype,
        };
        try {
            // 1. Upload the raw video
            yield aws_1.s3Client.send(new client_s3_1.PutObjectCommand(params));
            // 2. Store metadata for the raw file
            const mediaFileEntry = yield Mediafile_model_1.default.create({
                originalName: originalname, // Store originalname in DB
                s3Key: s3Key,
                s3Bucket: aws_1.S3_BUCKET_NAME,
                s3Region: aws_1.AWS_REGION,
                fileUrl: `s3://${aws_1.S3_BUCKET_NAME}/${s3Key}`, // Logical S3 path to raw file
                mimeType: mimetype,
                fileSize: fileSize,
            });
            // 3. Construct the path for the PROCESSED HLS video
            const filenameWithoutExtension = originalname.replace(/\s/g, '_').split('.').slice(0, -1).join('.');
            const processedHlsPath = `/processed-videos/${filenameWithoutExtension}/index.m3u8`; // Ensure this matches your MediaConvert output prefix
            // 4. Generate signed URL for the PROCESSED HLS video
            const signedCloudFrontUrl = yield generateCloudFrontSignedUrl(processedHlsPath);
            uploadedFilesMetadata.push(Object.assign(Object.assign({}, mediaFileEntry.toJSON()), { fileUrl: signedCloudFrontUrl }));
        }
        catch (error) { // <--- Added ': any' to explicitly type 'error'
            console.error(`Error uploading file ${originalname} in batch:`, error);
            // Corrected 'originalName' to 'originalname' and cast 'error' to 'Error' for .message
            uploadedFilesMetadata.push({ originalname, error: error.message, status: 'failed' });
        }
    }
    return uploadedFilesMetadata;
});
exports.uploadMultipleMedia = uploadMultipleMedia;
