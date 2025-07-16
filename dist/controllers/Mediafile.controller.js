"use strict";
// controllers/Mediafile.controller.ts
// This file handles request parsing, calls the service, and sends responses.
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
exports.uploadMultipleFiles = exports.deleteFile = exports.listMedia = exports.uploadFile = void 0;
const mediaFileService = __importStar(require("../services/Mediafile.service")); // Import all functions from service
const multer_1 = __importDefault(require("multer")); // Import the default export (the multer function)
// Helper function to handle common error responses
const handleErrorResponse = (res, error, defaultMessage) => {
    console.error(`Error in mediaFile.controller:`, error);
    let statusCode = 500;
    let message = defaultMessage;
    // Check if the error is an instance of multer.MulterError
    if (error instanceof multer_1.default.MulterError) { // <--- Use multer.MulterError from the imported default
        statusCode = 400; // Bad Request for Multer errors like file size limits
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
    else {
        // Generic error
        message = error.message || defaultMessage;
    }
    res.status(statusCode).json({ message });
};
// Controller for handling single file upload requests
const uploadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // req.file is typed by the Express.Request augmentation in multer-shim.d.ts
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        const { originalname, mimetype, buffer, size } = file; // Properties now directly available
        // const adminId = (req as any).user.id; // If you have authentication and want to link to admin user
        const mediaFileEntry = yield mediaFileService.uploadMedia(// Cast to MediaFileEntryResponse
        buffer, originalname, mimetype, size);
        res.status(201).json({
            message: 'File uploaded successfully!',
            fileUrl: mediaFileEntry.fileUrl,
            s3Key: mediaFileEntry.s3Key,
            metadata: mediaFileEntry,
        });
    }
    catch (error) { // Use 'any' for error type or define a custom error interface
        handleErrorResponse(res, error, 'File upload failed.');
    }
});
exports.uploadFile = uploadFile;
// Controller for handling requests to list all media files
const listMedia = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mediaFiles = yield mediaFileService.getAllMedia(); // Cast to array of MediaFileEntryResponse
        res.status(200).json(mediaFiles);
    }
    catch (error) {
        handleErrorResponse(res, error, 'Failed to fetch media list.');
    }
});
exports.listMedia = listMedia;
// Controller for handling requests to delete a media file
const deleteFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params; // Get file ID from URL parameters
        if (!id) {
            return res.status(400).json({ message: 'Media file ID is required.' });
        }
        const result = yield mediaFileService.deleteMedia(id);
        res.status(200).json({ message: result.message });
    }
    catch (error) {
        handleErrorResponse(res, error, 'File deletion failed.');
    }
});
exports.deleteFile = deleteFile;
// NEW: Controller for handling multiple file upload requests
const uploadMultipleFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // req.files is typed by the Express.Request augmentation in multer-shim.d.ts
        // It's already typed as `multer.File[]` or `{ [fieldname: string]: multer.File[] }`
        // So, we can directly use `file as multer.File` or `files as multer.File[]`
        const files = req.files; // <--- Use multer.File from the imported default
        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded.' });
        }
        // const adminId = (req as any).user.id; // If you have authentication and want to link to admin user
        const uploadedFilesMetadata = yield mediaFileService.uploadMultipleMedia(files);
        const successfulUploads = uploadedFilesMetadata.filter(Boolean);
        res.status(201).json({
            message: `${successfulUploads.length} files uploaded successfully!`,
            uploadedFiles: successfulUploads,
        });
    }
    catch (error) {
        handleErrorResponse(res, error, 'Multiple file upload failed.');
    }
});
exports.uploadMultipleFiles = uploadMultipleFiles;
