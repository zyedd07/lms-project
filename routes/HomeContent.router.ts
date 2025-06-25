import express from 'express';
import * as homeContentController from '../controllers/HomeContent.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth'; // Assuming auth middleware exists
import { upload } from '../controllers/HomeContent.controller'; // Import the multer upload instance

const router = express.Router();

// --- Public Route ---
/**
 * @route   GET /api/home-content
 * @desc    Get the dynamic content for the home screen
 * @access  Public
 */
router.get('/', homeContentController.getHomeContent);


// --- Admin-only Routes ---
/**
 * @route   PUT /api/home-content/update
 * @desc    Update text-based fields (QOTD, About Us, Custom Sections)
 * @access  Private (Admin)
 */
router.put(
    '/update',
    isAuth,
    authorizeAdmin,
    homeContentController.updateHomeContent
);

/**
 * @route   POST /api/home-content/slider-images
 * @desc    Upload and replace all slider images
 * @access  Private (Admin)
 */
router.post(
    '/slider-images',
    isAuth,
    authorizeAdmin,
    upload.array('sliderImages', 5), // 'sliderImages' must match the key in FormData, max 5 files
    homeContentController.uploadSliderImages
);

export default router;
