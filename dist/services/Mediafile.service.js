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
const aws_1 = require("../config/aws");
const Mediafile_model_1 = __importDefault(require("../models/Mediafile.model"));
// Helper function to generate a CloudFront signed URL
const generateCloudFrontSignedUrl = (s3Key) => __awaiter(void 0, void 0, void 0, function* () {
    const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
    const CLOUDFRONT_PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY;
    const CLOUDFRONT_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID;
    if (!CLOUDFRONT_MEDIA_DOMAIN || !CLOUDFRONT_PRIVATE_KEY || !CLOUDFRONT_KEY_PAIR_ID) {
        throw new Error('CloudFront signing environment variables are not fully set (CLOUDFRONT_MEDIA_DOMAIN, CLOUDFRONT_PRIVATE_KEY, CLOUDFRONT_KEY_PAIR_ID).');
    }
    // The URL that CloudFront will sign. This is the CloudFront distribution domain + S3 Key path.
    const resourceUrl = `https://${CLOUDFRONT_MEDIA_DOMAIN}/${s3Key}`;
    // Set a long expiration time (e.g., 1 year from now)
    // Max expiration is 7 days (604800 seconds) for direct S3 pre-signed URLs.
    // For CloudFront signed URLs, the maximum is 365 days (or 7 days for custom policies, check docs).
    // Let's use 1 year (approx 31,536,000 seconds) for app resources.
    const dateLessThan = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    const signedUrl = (0, cloudfront_signer_1.getSignedUrl)({
        url: resourceUrl,
        keyPairId: CLOUDFRONT_KEY_PAIR_ID,
        privateKey: CLOUDFRONT_PRIVATE_KEY,
        dateLessThan: dateLessThan.toISOString(), // Required format for dateLessThan
    });
    return signedUrl;
});
// Function to upload a file to S3 and save its metadata to the database
const uploadMedia = (fileBuffer, originalname, mimetype, fileSize) => __awaiter(void 0, void 0, void 0, function* () {
    // Generate a unique key for S3 to avoid overwrites
    const s3Key = `uploads/${Date.now()}_${originalname.replace(/\s/g, '_')}`;
    const params = {
        Bucket: aws_1.S3_BUCKET_NAME,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimetype,
        // ACL: 'public-read', // REMOVED: Objects are private by default. Access via signed URLs.
    };
    try {
        yield aws_1.s3Client.send(new client_s3_1.PutObjectCommand(params));
        // Store the S3 Key and Bucket name in the database.
        // The fileUrl in the DB will be a logical S3 path.
        const mediaFileEntry = yield Mediafile_model_1.default.create({
            originalName: originalname,
            s3Key: s3Key,
            s3Bucket: aws_1.S3_BUCKET_NAME,
            s3Region: aws_1.AWS_REGION,
            fileUrl: `s3://${aws_1.S3_BUCKET_NAME}/${s3Key}`, // Store a logical S3 path
            mimeType: mimetype,
            fileSize: fileSize,
            // uploadedByAdminId: adminId, // Uncomment if tracking admin uploads
        });
        // Return the CloudFront signed URL for immediate use in the frontend
        const signedCloudFrontUrl = yield generateCloudFrontSignedUrl(s3Key);
        return Object.assign(Object.assign({}, mediaFileEntry.toJSON()), { fileUrl: signedCloudFrontUrl }); // Override fileUrl with signed URL
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
        // For each media file, generate a CloudFront signed URL
        const mediaFilesWithSignedUrls = yield Promise.all(mediaFiles.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const fileData = file.toJSON();
            // Generate signed URL using the s3Key stored in the DB
            const signedCloudFrontUrl = yield generateCloudFrontSignedUrl(fileData.s3Key);
            return Object.assign(Object.assign({}, fileData), { fileUrl: signedCloudFrontUrl }); // Replace stored fileUrl with signed one
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
        const params = {
            Bucket: mediaFile.s3Bucket, // Cast to any to bypass type checking
            Key: mediaFile.s3Key, // Cast to any to bypass type checking
        };
        yield aws_1.s3Client.send(new client_s3_1.DeleteObjectCommand(params));
        yield mediaFile.destroy();
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
        const params = {
            Bucket: aws_1.S3_BUCKET_NAME,
            Key: s3Key,
            Body: buffer,
            ContentType: mimetype,
            // ACL: 'public-read', // REMOVED: Objects are private by default. Access via signed URLs.
        };
        try {
            yield aws_1.s3Client.send(new client_s3_1.PutObjectCommand(params));
            const signedCloudFrontUrl = yield generateCloudFrontSignedUrl(s3Key); // Generate signed URL for each uploaded file
            const mediaFileEntry = yield Mediafile_model_1.default.create({
                originalName: originalname,
                s3Key: s3Key,
                s3Bucket: aws_1.S3_BUCKET_NAME,
                s3Region: aws_1.AWS_REGION,
                fileUrl: `s3://${aws_1.S3_BUCKET_NAME}/${s3Key}`, // Store logical S3 path
                mimeType: mimetype,
                fileSize: fileSize,
            });
            uploadedFilesMetadata.push(Object.assign(Object.assign({}, mediaFileEntry.toJSON()), { fileUrl: signedCloudFrontUrl }));
        }
        catch (error) {
            console.error(`Error uploading file ${originalname} in batch:`, error);
            // Decide how to handle individual file failures in a batch:
            // - Continue with other files and report partial success
            // - Re-throw immediately to fail the whole batch
            // For now, we'll log and continue.
        }
    }
    return uploadedFilesMetadata;
});
exports.uploadMultipleMedia = uploadMultipleMedia;
