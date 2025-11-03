import { Router } from 'express'; // Import Router from Express
import multer from 'multer'; // Import multer
import * as mediaFileController from '../controllers/Mediafile.controller';
// Assuming you have an authentication middleware (e.g., from your previous backend setup)
import * as authMiddleware from '../middleware/auth'; // Adjust path as needed

const router = Router(); // Use Router from express

// Configure Multer for in-memory storage.
// This stores the file in memory as a Buffer, which is then passed to the service.
const upload = multer({ storage: multer.memoryStorage() });

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

export default router; // Use default export for the router
