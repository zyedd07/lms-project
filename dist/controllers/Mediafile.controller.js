"use strict";
// controllers/mediaFile.controller.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.listMedia = exports.uploadMultipleFiles = exports.uploadFile = void 0;
const mediaFileService = __importStar(require("../services/Mediafile.service"));
// Controller for handling single file upload requests
const uploadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Multer adds 'file' to the request object.
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        const { originalname, mimetype, buffer, size } = file;
        // Optional: Get adminId if you have authentication middleware
        // const adminId = (req as any).user.id;
        const mediaFileEntry = yield mediaFileService.uploadMedia(buffer, originalname, mimetype, size);
        res.status(201).json({
            message: 'File uploaded successfully!',
            fileUrl: mediaFileEntry.fileUrl,
            s3Key: mediaFileEntry.s3Key,
            metadata: mediaFileEntry, // Returns all stored metadata including the signed URL
        });
    }
    catch (error) { // Catching as 'any' to access custom properties like 'statusCode'
        console.error('Error in mediaFile.controller.uploadFile:', error);
        const statusCode = error.statusCode || 500; // Use custom status code if available from service
        res.status(statusCode).json({ message: error.message || 'File upload failed.' });
    }
});
exports.uploadFile = uploadFile;
// NEW: Controller for handling multiple file upload requests
const uploadMultipleFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Multer adds 'files' to the request object for array uploads.
        // Ensure your router configuration uses `upload.array('fieldName')` or `upload.fields([...])`
        const files = req.files; // Explicitly cast to array of Multer.File
        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded.' });
        }
        // Optional: Get adminId if you have authentication middleware
        // const adminId = (req as any).user.id;
        const uploadedFilesMetadata = yield mediaFileService.uploadMultipleMedia(files);
        // Filter out any potential null/undefined entries if your service's Promise.allSettled
        // design returns them for failed individual uploads
        const successfulUploads = uploadedFilesMetadata.filter(Boolean);
        res.status(201).json({
            message: `${successfulUploads.length} files uploaded successfully!`,
            uploadedFiles: successfulUploads,
            // You might also want to include a count of failed uploads if the service tracks them.
        });
    }
    catch (error) {
        console.error('Error in mediaFile.controller.uploadMultipleFiles:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ message: error.message || 'Multiple file upload failed.' });
    }
});
exports.uploadMultipleFiles = uploadMultipleFiles;
// Controller for handling requests to list all media files
const listMedia = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mediaFiles = yield mediaFileService.getAllMedia();
        res.status(200).json(mediaFiles);
    }
    catch (error) {
        console.error('Error in mediaFile.controller.listMedia:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ message: error.message || 'Failed to fetch media list.' });
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
        console.error('Error in mediaFile.controller.deleteFile:', error);
        const statusCode = error.statusCode || 500; // Propagate custom status code from service
        res.status(statusCode).json({ message: error.message || 'File deletion failed.' });
    }
});
exports.deleteFile = deleteFile;
