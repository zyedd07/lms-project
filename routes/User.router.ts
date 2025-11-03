import express from 'express';
import * as UserController from '../controllers/User.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth'; // Ensure authorizeAdmin is imported
import { refreshTokenController } from '../middleware/auth';

const router = express.Router();

// Public routes (no authentication required)
router.post('/create', UserController.createUser);
router.post('/login', UserController.loginUser);
router.post('/forgot-password', UserController.forgotPassword); 
router.post('/reset-password', UserController.resetPassword);
router.post('/google-signin', UserController.googleSignIn);     //  --- NEW ROUTE
router.post('/facebook-signin', UserController.facebookSignIn); //  --- NEW ROUTE

// Authenticated user's own profile routes
router.get('/me', isAuth, UserController.getLoggedInUser);
router.put('/meupdate', isAuth, UserController.updateMyProfile); // For user to update their OWN profile
router.post('/refresh-token',refreshTokenController);

// --- New route for profile picture upload ---
// This route needs authentication and the multer middleware
// `profilePictureUpload.single('profilePicture')` is the multer middleware
// The string 'profilePicture' must match the key used in formData.append('profilePicture', ...) on the frontend.
router.put(
    '/profile-picture', // Endpoint will be something like /api/user/profile-picture (depending on your app.use setup)
    isAuth,
    UserController.profilePictureUpload.single('profilePicture'), // Apply multer middleware
    UserController.uploadProfilePictureController // Your controller to handle the upload
);
router.get('/teachers/pending',isAuth, authorizeAdmin, UserController.getPendingTeachers);
router.put('/teachers/:id/approve',isAuth,authorizeAdmin, UserController.approveTeacher); // Use PUT for updates
router.put('/teachers/:id/reject',isAuth,authorizeAdmin, UserController.rejectTeacher);   // Use PUT for updates


// Admin-only routes (requires authentication AND admin role)
// IMPORTANT: Apply authorizeAdmin to routes that modify/view other users
router.get('/', isAuth, authorizeAdmin, UserController.getAllUsers); // Get all users
router.get('/:email', isAuth, authorizeAdmin, UserController.getUser); // Get a specific user by email (only for admins)
router.put('/:id', isAuth, authorizeAdmin, UserController.updateUser); // Update any user by ID (only for admins)
router.delete('/:id', isAuth, authorizeAdmin, UserController.deleteUser); // Delete any user by ID (only for admins)

export default router;
