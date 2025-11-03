// routes/user.routes.ts
// Complete user routes with proper authentication and device token verification

import express from 'express';
import * as UserController from '../controllers/User.controller';
import isAuth, { authorizeAdmin, authorizeTeacher, refreshTokenController } from '../middleware/auth';

const router = express.Router();

// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

/**
 * User Registration
 * POST /api/user/create
 */
router.post('/create', UserController.createUser);

/**
 * User Login
 * POST /api/user/login
 * Headers Required: X-Device-Id
 * Returns: { user, token, deviceToken }
 */
router.post('/login', UserController.loginUser);

/**
 * Google Sign-In
 * POST /api/user/google-signin
 * Headers Required: X-Device-Id
 * Body: { token: googleIdToken }
 * Returns: { user, token, deviceToken }
 */
router.post('/google-signin', UserController.googleSignIn);

/**
 * Facebook Sign-In
 * POST /api/user/facebook-signin
 * Headers Required: X-Device-Id
 * Body: { token: facebookAccessToken }
 * Returns: { user, token, deviceToken }
 */
router.post('/facebook-signin', UserController.facebookSignIn);

/**
 * Forgot Password
 * POST /api/user/forgot-password
 * Body: { email }
 */
router.post('/forgot-password', UserController.forgotPassword);

/**
 * Reset Password
 * POST /api/user/reset-password
 * Body: { token, newPassword }
 */
router.post('/reset-password', UserController.resetPassword);

// ========================================
// AUTHENTICATED ROUTES
// All routes below require:
// - Authorization: Bearer <jwt-token>
// - X-Device-Token: <device-token>
// - X-Device-Id: <device-id>
// ========================================

/**
 * Token Refresh (Sliding Window)
 * POST /api/user/refresh-token
 * Headers Required: Authorization, X-Device-Token, X-Device-Id
 * Body: { token }
 * Returns: { success, token, user }
 * 
 * This extends the session by another 30 days
 */
router.post('/refresh-token', refreshTokenController);

/**
 * User Logout
 * POST /api/user/logout
 * Clears device token from database
 * Note: This uses isAuth which includes device check
 */
router.post('/logout', isAuth, UserController.logoutUser);

/**
 * Get Logged-In User Profile
 * GET /api/user/me
 * Returns: { success, message, user }
 */
router.get('/me', isAuth, UserController.getLoggedInUser);

/**
 * Update Own Profile
 * PUT /api/user/meupdate
 * Body: { name, email, phone, etc. }
 * For password change: { currentPassword, newPassword }
 */
router.put('/meupdate', isAuth, UserController.updateMyProfile);

/**
 * Upload Profile Picture
 * PUT /api/user/profile-picture
 * Content-Type: multipart/form-data
 * Body: profilePicture (file)
 */
router.put(
    '/profile-picture',
    isAuth,
    UserController.profilePictureUpload.single('profilePicture'),
    UserController.uploadProfilePictureController
);

// ========================================
// ADMIN-ONLY ROUTES
// Require both authentication AND admin role
// ========================================

/**
 * Get All Pending Teachers
 * GET /api/user/teachers/pending
 * Admin only
 */
router.get(
    '/teachers/pending',
    isAuth,
    authorizeAdmin,
    UserController.getPendingTeachers
);

/**
 * Approve Teacher Account
 * PUT /api/user/teachers/:id/approve
 * Admin only
 */
router.put(
    '/teachers/:id/approve',
    isAuth,
    authorizeAdmin,
    UserController.approveTeacher
);

/**
 * Reject Teacher Account
 * PUT /api/user/teachers/:id/reject
 * Admin only
 * Body: { reason?: string }
 */
router.put(
    '/teachers/:id/reject',
    isAuth,
    authorizeAdmin,
    UserController.rejectTeacher
);

/**
 * Get All Users
 * GET /api/user/
 * Admin only
 */
router.get(
    '/',
    isAuth,
    authorizeAdmin,
    UserController.getAllUsers
);

/**
 * Get User by Email
 * GET /api/user/:email
 * Admin only
 */
router.get(
    '/:email',
    isAuth,
    authorizeAdmin,
    UserController.getUser
);

/**
 * Update Any User
 * PUT /api/user/:id
 * Admin only
 */
router.put(
    '/:id',
    isAuth,
    authorizeAdmin,
    UserController.updateUser
);

/**
 * Delete User
 * DELETE /api/user/:id
 * Admin only
 */
router.delete(
    '/:id',
    isAuth,
    authorizeAdmin,
    UserController.deleteUser
);

export default router;