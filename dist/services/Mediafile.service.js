"use strict";
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
exports.deleteMedia = exports.getAllMedia = exports.uploadMedia = void 0;
const aws_1 = require("../config/aws"); // AWS S3 configuration
const Mediafile_model_1 = __importDefault(require("../models/Mediafile.model")); // Import the MediaFile model
// Function to upload a file to S3 and save its metadata to the database
const uploadMedia = (fileBuffer, originalname, mimetype, fileSize) => __awaiter(void 0, void 0, void 0, function* () {
    // Generate a unique key for S3 to avoid overwrites
    const s3Key = `uploads/${Date.now()}_${originalname.replace(/\s/g, '_')}`;
    const params = {
        Bucket: aws_1.S3_BUCKET_NAME,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimetype,
        ACL: 'public-read', // Make the object publicly readable via CloudFront
    };
    try {
        // Upload file to S3
        const s3UploadResult = yield aws_1.s3.upload(params).promise();
        // Construct the public URL using the CloudFront domain
        const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
        if (!CLOUDFRONT_MEDIA_DOMAIN) {
            throw new Error('CLOUDFRONT_MEDIA_DOMAIN environment variable is not set.');
        }
        const fileUrl = `https://${CLOUDFRONT_MEDIA_DOMAIN}/${s3UploadResult.Key}`;
        // Save metadata to the RDS database
        const mediaFileEntry = yield Mediafile_model_1.default.create({
            originalName: originalname,
            s3Key: s3Key,
            s3Bucket: aws_1.S3_BUCKET_NAME,
            s3Region: aws_1.AWS_REGION,
            fileUrl: fileUrl,
            mimeType: mimetype,
            fileSize: fileSize,
            // uploadedByAdminId: adminId, // Uncomment if tracking admin uploads
        });
        return mediaFileEntry.toJSON(); // Return plain object (type will be 'any')
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
        return mediaFiles.map(file => file.toJSON()); // Convert instances to plain objects (types will be 'any')
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
        const mediaFile = yield Mediafile_model_1.default.findByPk(fileId); // This returns a MediaFile instance or null
        if (!mediaFile) {
            const error = new Error('Media file not found.');
            error.statusCode = 404; // Custom status code for controller
            throw error;
        }
        // Access properties directly from the Sequelize model instance
        const params = {
            Bucket: mediaFile.s3Bucket, // Cast to any to bypass type checking
            Key: mediaFile.s3Key, // Cast to any to bypass type checking
        };
        yield aws_1.s3.deleteObject(params).promise();
        // Delete from DB
        yield mediaFile.destroy();
        return { message: 'Media file deleted successfully.' };
    }
    catch (error) {
        console.error('Error in deleteMedia service:', error);
        throw error;
    }
});
exports.deleteMedia = deleteMedia;
