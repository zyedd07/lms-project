"use strict";
// controllers/Mediafile.controller.ts
// Updated to match the enhanced service with better error handling and batch processing
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
// Helper function to handle common error responses with enhanced error categorization
const handleErrorResponse = (res, error, defaultMessage) => {
    console.error(`Error in mediaFile.controller:`, error);
    let statusCode = 500;
    let message = defaultMessage;
    // Check if the error is an instance of multer.MulterError
    if (error instanceof multer_1.default.MulterError) {
        statusCode = 400;
        message = `File upload error: ${error.message}`;
        if (error.code) {
            message += ` (Code: ${error.code})`;
        }
    }
    else if (error.statusCode) {
        // Handle custom errors from service (e.g., MediaFileNotFoundError)
        statusCode = error.statusCode;
        message = error.message;
    }
    else if (error.message) {
        // Enhanced error message handling for specific AWS/CloudFront errors
        if (error.message.includes('CloudFront')) {
            statusCode = 502; // Bad Gateway for CloudFront issues
            message = `CDN Configuration Error: ${error.message}`;
        }
        else if (error.message.includes('S3 bucket') || error.message.includes('NoSuchBucket')) {
            statusCode = 502; // Bad Gateway for S3 configuration issues
            message = `Storage Configuration Error: ${error.message}`;
        }
        else if (error.message.includes('AccessDenied')) {
            statusCode = 502; // Bad Gateway for permission issues
            message = `Storage Permission Error: ${error.message}`;
        }
        else if (error.message.includes('URL signing')) {
            statusCode = 502; // Bad Gateway for signing issues
            message = `URL Generation Error: ${error.message}`;
        }
        else {
            message = error.message;
        }
    }
    res.status(statusCode).json({
        message,
        error: true,
        timestamp: new Date().toISOString()
    });
};
// Enhanced single file upload controller with better logging and response structure
const uploadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                message: 'No file uploaded.',
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        const { originalname, mimetype, buffer, size } = file;
        console.log(`📤 Controller: Starting upload for ${originalname} (${(size / 1024 / 1024).toFixed(2)} MB)`);
        // Call the enhanced service method
        const mediaFileEntry = yield mediaFileService.uploadMedia(buffer, originalname, mimetype, size);
        console.log(`✅ Controller: Upload completed successfully for ${originalname}`);
        res.status(201).json({
            message: 'File uploaded successfully!',
            fileUrl: mediaFileEntry.fileUrl,
            s3Key: mediaFileEntry.s3Key,
            processedPath: mediaFileEntry.processedPath,
            metadata: {
                id: mediaFileEntry.id,
                originalName: mediaFileEntry.originalName,
                mimeType: mediaFileEntry.mimeType,
                fileSize: mediaFileEntry.fileSize,
                status: mediaFileEntry.status || 'processing',
                createdAt: mediaFileEntry.createdAt
            },
            success: true,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error(`❌ Controller: Upload failed -`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        handleErrorResponse(res, error, 'File upload failed.');
    }
});
exports.uploadFile = uploadFile;
// Enhanced list media controller with better error handling and status reporting
const listMedia = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`📋 Controller: Fetching media list...`);
        const mediaFiles = yield mediaFileService.getAllMedia();
        // Calculate status summary
        const statusSummary = {
            total: mediaFiles.length,
            ready: mediaFiles.filter(f => f.status === 'ready').length,
            error: mediaFiles.filter(f => f.status === 'error').length,
            processing: mediaFiles.filter(f => f.status === 'processing' || !f.status).length
        };
        console.log(`✅ Controller: Retrieved ${mediaFiles.length} media files`);
        console.log(`📊 Status summary:`, statusSummary);
        res.status(200).json({
            data: mediaFiles,
            summary: statusSummary,
            success: true,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error(`❌ Controller: Failed to fetch media list -`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        handleErrorResponse(res, error, 'Failed to fetch media list.');
    }
});
exports.listMedia = listMedia;
// Enhanced delete file controller with better validation
const deleteFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: 'Media file ID is required.',
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        // Validate ID format (assuming it's a number or UUID)
        if (!/^[0-9a-fA-F-]+$/.test(id)) {
            return res.status(400).json({
                message: 'Invalid media file ID format.',
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        console.log(`🗑️  Controller: Deleting media file with ID: ${id}`);
        const result = yield mediaFileService.deleteMedia(id);
        console.log(`✅ Controller: Successfully deleted media file: ${id}`);
        res.status(200).json({
            message: result.message,
            success: true,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error(`❌ Controller: Deletion failed for ID ${req.params.id} -`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        handleErrorResponse(res, error, 'File deletion failed.');
    }
});
exports.deleteFile = deleteFile;
// Enhanced multiple file upload controller with detailed batch processing results
const uploadMultipleFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({
                message: 'No files uploaded.',
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        // Validate file count (optional - set reasonable limits)
        const MAX_FILES_PER_BATCH = 10;
        if (files.length > MAX_FILES_PER_BATCH) {
            return res.status(400).json({
                message: `Too many files. Maximum ${MAX_FILES_PER_BATCH} files allowed per batch.`,
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        console.log(`📤 Controller: Starting batch upload of ${files.length} files`);
        // Log file details
        files.forEach((file, index) => {
            console.log(`  [${index + 1}] ${file.originalname} - ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        });
        // Call the enhanced batch upload service
        const batchResult = yield mediaFileService.uploadMultipleMedia(files);
        console.log(`✅ Controller: Batch upload completed`);
        console.log(`📊 Final summary: ${batchResult.summary.successful}/${batchResult.summary.total} successful (${batchResult.summary.successRate}%)`);
        // Determine response status based on results
        let statusCode = 201; // Created
        if (batchResult.summary.successful === 0) {
            statusCode = 400; // Bad Request - all failed
        }
        else if (batchResult.summary.failed > 0) {
            statusCode = 207; // Multi-Status - partial success
        }
        res.status(statusCode).json({
            message: `Batch upload completed: ${batchResult.summary.successful}/${batchResult.summary.total} files uploaded successfully`,
            summary: batchResult.summary,
            successful: batchResult.successful,
            failed: batchResult.failed,
            success: batchResult.summary.successful > 0,
            partialSuccess: batchResult.summary.successful > 0 && batchResult.summary.failed > 0,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error(`❌ Controller: Batch upload failed -`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        handleErrorResponse(res, error, 'Multiple file upload failed.');
    }
});
exports.uploadMultipleFiles = uploadMultipleFiles;
// NEW: Controller for testing CloudFront access (useful for debugging)
const testCloudFrontAccess = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { processedPath } = req.body;
        if (!processedPath) {
            return res.status(400).json({
                message: 'processedPath is required in request body',
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        console.log(`🧪 Controller: Testing CloudFront access for: ${processedPath}`);
        const testResult = yield mediaFileService.testCloudFrontAccess(processedPath);
        res.status(200).json(Object.assign(Object.assign({}, testResult), { timestamp: new Date().toISOString() }));
    }
    catch (error) {
        console.error(`❌ Controller: CloudFront test failed -`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        handleErrorResponse(res, error, 'CloudFront access test failed.');
    }
});
exports.testCloudFrontAccess = testCloudFrontAccess;
// NEW: Controller for validating environment variables
const validateEnvironment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`🔧 Controller: Validating environment variables...`);
        const validation = mediaFileService.validateEnvironmentVariables();
        const statusCode = validation.valid ? 200 : 500;
        res.status(statusCode).json(Object.assign(Object.assign({}, validation), { message: validation.valid ? 'Environment validation passed' : 'Environment validation failed', timestamp: new Date().toISOString() }));
    }
    catch (error) {
        console.error(`❌ Controller: Environment validation failed -`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        handleErrorResponse(res, error, 'Environment validation failed.');
    }
});
exports.validateEnvironment = validateEnvironment;
// NEW: Controller for getting media by filename (useful for debugging specific files)
const getMediaByFilename = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filename } = req.params;
        if (!filename) {
            return res.status(400).json({
                message: 'Filename parameter is required',
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        console.log(`🔍 Controller: Getting media by filename: ${filename}`);
        const mediaFile = yield mediaFileService.getMediaByFilename(filename);
        res.status(200).json({
            data: mediaFile,
            success: true,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error(`❌ Controller: Get media by filename failed -`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        // Handle specific "not found" errors
        if (error.message && error.message.includes('not found')) {
            return res.status(404).json({
                message: error.message,
                error: true,
                timestamp: new Date().toISOString()
            });
        }
        handleErrorResponse(res, error, 'Failed to retrieve media file.');
    }
});
exports.getMediaByFilename = getMediaByFilename;
