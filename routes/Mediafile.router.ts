
import { Router } from 'express'; // Import Router from Express
import multer from 'multer'; // Import multer
import * as mediaFileController from '../controllers/Mediafile.controller'; 
// Assuming you have an authentication middleware (e.g., from your previous backend setup)
import * as authMiddleware from '../middleware/auth'; // Adjust path as needed

const router = Router(); // Use Router from express

// Configure Multer for in-memory storage.
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/media/upload
// Requires authentication (authMiddleware.isAuth) and file processing (upload.single)
router.post('/upload', authMiddleware.isAuth, upload.single('file'), mediaFileController.uploadFile);

// GET /api/media/list
// Requires authentication to list media
router.get('/list', authMiddleware.isAuth, mediaFileController.listMedia);

// DELETE /api/media/delete/:id
// Requires authentication to delete media
router.delete('/delete/:id', authMiddleware.isAuth, mediaFileController.deleteFile);

export default router; // Use default export for the router