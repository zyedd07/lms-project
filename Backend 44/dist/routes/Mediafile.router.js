"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); // Import Router from Express
const multer_1 = __importDefault(require("multer")); // Import multer
const mediaFileController = __importStar(require("../controllers/Mediafile.controller"));
// Assuming you have an authentication middleware (e.g., from your previous backend setup)
const authMiddleware = __importStar(require("../middleware/auth")); // Adjust path as needed
const router = (0, express_1.Router)(); // Use Router from express
// Configure Multer for in-memory storage.
// This stores the file in memory as a Buffer, which is then passed to the service.
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// POST /api/media/upload
// Endpoint for uploading a single media file.
// Requires authentication and uses multer to handle a single file named 'file'.
router.post('/upload', authMiddleware.isAuth, upload.single('file'), mediaFileController.uploadFile);
// POST /api/media/upload-multiple
// Endpoint for uploading multiple media files in a batch.
// Requires authentication and uses multer to handle an array of files named 'files'.
router.post('/upload-multiple', authMiddleware.isAuth, upload.array('files'), mediaFileController.uploadMultipleFiles);
// GET /api/media/list
// Endpoint for listing all media files.
// Requires authentication to retrieve the list.
router.get('/list', authMiddleware.isAuth, mediaFileController.listMedia);
// DELETE /api/media/delete/:id
// Endpoint for deleting a specific media file by its ID.
// Requires authentication to perform deletion.
router.delete('/delete/:id', authMiddleware.isAuth, mediaFileController.deleteFile);
// POST /api/media/test-cloudfront
// Endpoint for testing CloudFront access and signed URL generation for a given path.
// Requires authentication. Expects 'processedPath' in the request body.
router.post('/test-cloudfront', authMiddleware.isAuth, mediaFileController.testCloudFrontAccess);
// GET /api/media/validate-env
// Endpoint for validating critical CloudFront and S3 environment variables.
// Requires authentication.
router.get('/validate-env', authMiddleware.isAuth, mediaFileController.validateEnvironment);
// GET /api/media/by-filename/:filename
// Endpoint for retrieving media file details by its original filename.
// Requires authentication. Expects the filename as a URL parameter.
router.get('/by-filename/:filename', authMiddleware.isAuth, mediaFileController.getMediaByFilename);
exports.default = router; // Use default export for the router
