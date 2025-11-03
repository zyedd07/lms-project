"use strict";
// controllers/Mediafile.controller.ts
// Updated to match the enhanced service with better error handling and batch processing,
// and to support multi-type media handling (videos and static assets).
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getMediaByFilename = exports.validateEnvironment = exports.testCloudFrontAccess = exports.uploadMultipleFiles = exports.deleteFile = exports.listMedia = exports.uploadFile = void 0;
const mediaFileService = __importStar(require("../services/Mediafile.service"));
const multer_1 = __importDefault(require("multer"));
/**
 * Helper function to handle common error responses with enhanced error categorization.
 * Provides more specific HTTP status codes and messages based on the error type.
 *
 * @param res The Express response object.
 * @param error The error object caught.
 * @param defaultMessage A default message to use if a more specific one cannot be determined.
 */
const handleErrorResponse = (res, error, defaultMessage) => {
    console.error(`Error in mediaFile.controller:`, error);
    let statusCode = 500; // Default to Internal Server Error
    let message = defaultMessage;
    // Check if the error is an instance of multer.MulterError (file upload specific errors)
    if (error instanceof multer_1.default.MulterError) {
        statusCode = 400; // Bad Request for Multer errors
        message = `File upload error: ${error.message}`;
        if (error.code) {
            message += ` (Code: ${error.code})`;
        }
    }
    else if (error.statusCode) {
        // Handle custom errors from service (e.g., MediaFileNotFoundError with a custom statusCode)
        statusCode = error.statusCode;
        message = error.message;
    }
    else if (error.message) {
        // Enhanced error message handling for specific AWS/CloudFront errors
        if (error.message.includes('CloudFront')) {
            statusCode = 502; // Bad Gateway for CloudFront configuration/runtime issues
            message = `CDN Configuration Error: ${error.message}`;
        }
        else if (error.message.includes('S3 bucket') || error.message.includes('NoSuchBucket')) {
            statusCode = 502; // Bad Gateway for S3 bucket configuration issues
            message = `Storage Configuration Error: ${error.message}`;
        }
        else if (error.message.includes('AccessDenied')) {
            statusCode = 502; // Bad Gateway for AWS permission issues
            message = `Storage Permission Error: ${error.message}`;
        }
        else if (error.message.includes('URL signing')) {
            statusCode = 502; // Bad Gateway for issues during signed URL generation
            message = `URL Generation Error: ${error.message}`;
        }
        else {
            // Fallback for other errors with a message
            message = error.message;
        }
    }
    // Send a structured error response
    res.status(statusCode).json({
        message,
        error: true,
        timestamp: new Date().toISOString() // Include timestamp for debugging
    });
};
/**
 * Controller for handling single file uploads.
 * Expects a single file in `req.file` from `multer` middleware.
 *
 * @param req The Express request object.
 * @param res The Express response object.
 */
const uploadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        // Validate if a file was actually uploaded
        if (!file) {
            return res.status(400).json({
                message: 'No file uploaded. Please ensure you are sending a file.',
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        const { originalname, mimetype, buffer, size } = file;
        console.log(`📤 Controller: Starting upload for ${originalname} (Size: ${(size / (1024 * 1024)).toFixed(2)} MB, MIME: ${mimetype})`);
        // Call the enhanced service method to handle S3 upload, DB entry, and URL generation
        const mediaFileEntry = yield mediaFileService.uploadMedia(buffer, originalname, mimetype, size);
        console.log(`✅ Controller: Upload completed successfully for ${originalname} (ID: ${mediaFileEntry.id})`);
        // Respond with success status and relevant file metadata
        res.status(201).json({
            message: 'File uploaded successfully!',
            fileUrl: mediaFileEntry.fileUrl, // This is the generated URL (signed for video, public for static)
            s3Key: mediaFileEntry.s3Key, // S3 key of the original uploaded file
            s3Bucket: mediaFileEntry.s3Bucket, // The bucket where it was stored
            processedPath: mediaFileEntry.processedPath, // Only for videos
            metadata: {
                id: mediaFileEntry.id,
                originalName: mediaFileEntry.originalName,
                mimeType: mediaFileEntry.mimeType,
                fileSize: mediaFileEntry.fileSize,
                status: mediaFileEntry.status,
                createdAt: mediaFileEntry.createdAt
            },
            success: true,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error(`❌ Controller: Upload failed -`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        handleErrorResponse(res, error, 'File upload failed due to an unexpected error.');
    }
});
exports.uploadFile = uploadFile;
/**
 * Controller for listing all media files.
 * Retrieves all media entries from the database and generates appropriate URLs for them.
 * Provides a summary of file statuses (ready, error, processing).
 *
 * @param req The Express request object.
 * @param res The Express response object.
 */
const listMedia = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`📋 Controller: Fetching media list...`);
        // Call the service method to get all media files with their generated URLs
        const mediaFiles = yield mediaFileService.getAllMedia();
        // Calculate a summary of file statuses for a quick overview
        const statusSummary = {
            total: mediaFiles.length,
            ready: mediaFiles.filter(f => f.status === 'ready').length,
            error: mediaFiles.filter(f => f.status === 'error').length,
            processing: mediaFiles.filter(f => f.status === 'processing').length
        };
        console.log(`✅ Controller: Retrieved ${mediaFiles.length} media files. Status summary:`, statusSummary);
        // Respond with the list of media files and the status summary
        res.status(200).json({
            data: mediaFiles,
            summary: statusSummary,
            success: true,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error(`❌ Controller: Failed to fetch media list -`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        handleErrorResponse(res, error, 'Failed to retrieve media list due to an unexpected error.');
    }
});
exports.listMedia = listMedia;
/**
 * Controller for deleting a single media file.
 * Expects the media file's ID in `req.params.id`.
 *
 * @param req The Express request object.
 * @param res The Express response object.
 */
const deleteFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Validate if an ID was provided
        if (!id) {
            return res.status(400).json({
                message: 'Media file ID is required for deletion.',
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        // Basic ID format validation (e.g., for UUIDs or numeric IDs)
        if (!/^[0-9a-fA-F-]+$/.test(id)) { // Generic check for alphanumeric and hyphens
            return res.status(400).json({
                message: 'Invalid media file ID format. Please provide a valid ID.',
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        console.log(`🗑️ Controller: Deleting media file with ID: ${id}`);
        // Call the service method to delete the media file from S3 and the database
        const result = yield mediaFileService.deleteMedia(id);
        console.log(`✅ Controller: Successfully deleted media file: ${id}`);
        // Respond with a success message
        res.status(200).json({
            message: result.message,
            success: true,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error(`❌ Controller: Deletion failed for ID ${req.params.id} -`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        handleErrorResponse(res, error, 'File deletion failed due to an unexpected error.');
    }
});
exports.deleteFile = deleteFile;
/**
 * Controller for handling multiple file uploads in a batch.
 * Expects an array of files in `req.files` from `multer` middleware.
 * Provides a detailed summary of each file's upload status.
 *
 * @param req The Express request object.
 * @param res The Express response object.
 */
const uploadMultipleFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files; // Cast to multer.File[] for type safety
        // Validate if any files were uploaded
        if (!files || files.length === 0) {
            return res.status(400).json({
                message: 'No files uploaded. Please ensure you are sending files.',
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        // Optional: Implement a maximum file count per batch to prevent abuse or overload
        const MAX_FILES_PER_BATCH = 10; // Example limit
        if (files.length > MAX_FILES_PER_BATCH) {
            return res.status(400).json({
                message: `Too many files. Maximum ${MAX_FILES_PER_BATCH} files allowed per batch upload.`,
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        console.log(`📤 Controller: Starting batch upload of ${files.length} files.`);
        // Log details of each file in the batch
        files.forEach((file, index) => {
            console.log(`  [${index + 1}] Filename: ${file.originalname}, Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
        });
        // Call the enhanced batch upload service method
        const batchResult = yield mediaFileService.uploadMultipleMedia(files);
        console.log(`✅ Controller: Batch upload completed. Summary: ${batchResult.summary.successful}/${batchResult.summary.total} successful (${batchResult.summary.successRate}%)`);
        // Determine the appropriate HTTP status code based on the batch results
        let statusCode = 201; // Default to Created if at least one file was successful
        if (batchResult.summary.successful === 0) {
            statusCode = 400; // Bad Request if all files failed
        }
        else if (batchResult.summary.failed > 0) {
            statusCode = 207; // Multi-Status (WebDAV) if there was partial success
        }
        // Respond with a detailed summary of the batch upload
        res.status(statusCode).json({
            message: `Batch upload completed: ${batchResult.summary.successful}/${batchResult.summary.total} files uploaded successfully.`,
            summary: batchResult.summary,
            successful: batchResult.successful,
            failed: batchResult.failed,
            success: batchResult.summary.successful > 0, // True if at least one file succeeded
            partialSuccess: batchResult.summary.successful > 0 && batchResult.summary.failed > 0, // True if some succeeded and some failed
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error(`❌ Controller: Batch upload failed -`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        handleErrorResponse(res, error, 'Multiple file upload failed due to an unexpected error.');
    }
});
exports.uploadMultipleFiles = uploadMultipleFiles;
/**
 * NEW: Controller for testing CloudFront access.
 * This endpoint allows you to provide a `processedPath` and get a report on whether
 * a signed URL can be generated and if the corresponding file exists in S3.
 * Useful for debugging CloudFront 403 errors.
 *
 * @param req The Express request object (expects `processedPath` in body).
 * @param res The Express response object.
 */
const testCloudFrontAccess = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { processedPath } = req.body;
        if (!processedPath) {
            return res.status(400).json({
                message: '`processedPath` is required in the request body to test CloudFront access.',
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        console.log(`🧪 Controller: Testing CloudFront access for path: ${processedPath}`);
        // Call the service utility function for CloudFront access testing
        const testResult = yield mediaFileService.testCloudFrontAccess(processedPath);
        // Respond with the test results
        res.status(200).json(Object.assign(Object.assign({}, testResult), { timestamp: new Date().toISOString() }));
    }
    catch (error) {
        console.error(`❌ Controller: CloudFront access test failed -`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        handleErrorResponse(res, error, 'CloudFront access test failed due to an unexpected error.');
    }
});
exports.testCloudFrontAccess = testCloudFrontAccess;
/**
 * NEW: Controller for validating CloudFront and S3 environment variables.
 * Provides a quick health check of the necessary environment configurations.
 *
 * @param req The Express request object.
 * @param res The Express response object.
 */
const validateEnvironment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`🔧 Controller: Validating environment variables...`);
        // Call the service utility function for environment variable validation
        const validation = mediaFileService.validateEnvironmentVariables();
        // Determine response status code based on validation result
        const statusCode = validation.valid ? 200 : 500; // 200 OK if valid, 500 Internal Server Error if invalid
        // Respond with the validation results
        res.status(statusCode).json(Object.assign(Object.assign({}, validation), { message: validation.valid ? 'Environment validation passed successfully.' : 'Environment validation failed. Please check missing variables and warnings.', timestamp: new Date().toISOString() }));
    }
    catch (error) {
        console.error(`❌ Controller: Environment validation failed -`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        handleErrorResponse(res, error, 'Environment validation failed due to an unexpected error.');
    }
});
exports.validateEnvironment = validateEnvironment;
/**
 * NEW: Controller for retrieving a single media file by its original filename.
 * This can be useful for debugging specific files without needing their database ID.
 *
 * @param req The Express request object (expects `filename` in params).
 * @param res The Express response object.
 */
const getMediaByFilename = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filename } = req.params;
        if (!filename) {
            return res.status(400).json({
                message: 'Filename parameter is required to retrieve media file.',
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        console.log(`🔍 Controller: Attempting to retrieve media by filename: ${filename}`);
        // Call the service utility function to get media by filename
        const mediaFile = yield mediaFileService.getMediaByFilename(filename);
        // Respond with the found media file data
        res.status(200).json({
            data: mediaFile,
            success: true,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error(`❌ Controller: Get media by filename failed -`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        // Handle specific "not found" errors from the service
        if (error.message && error.message.includes('not found')) {
            return res.status(404).json({
                message: error.message,
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        handleErrorResponse(res, error, 'Failed to retrieve media file by filename due to an unexpected error.');
    }
});
exports.getMediaByFilename = getMediaByFilename;
