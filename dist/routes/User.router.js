"use strict";
// routes/user.routes.ts
// Complete user routes with proper authentication and device token verification
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
const express_1 = __importDefault(require("express"));
const UserController = __importStar(require("../controllers/User.controller"));
const auth_1 = __importStar(require("../middleware/auth"));
const router = express_1.default.Router();
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
router.post('/refresh-token', auth_1.refreshTokenController);
/**
 * User Logout
 * POST /api/user/logout
 * Clears device token from database
 * Note: This uses isAuth which includes device check
 */
router.post('/logout', auth_1.default, UserController.logoutUser);
/**
 * Get Logged-In User Profile
 * GET /api/user/me
 * Returns: { success, message, user }
 */
router.get('/me', auth_1.default, UserController.getLoggedInUser);
/**
 * Update Own Profile
 * PUT /api/user/meupdate
 * Body: { name, email, phone, etc. }
 * For password change: { currentPassword, newPassword }
 */
router.put('/meupdate', auth_1.default, UserController.updateMyProfile);
/**
 * Upload Profile Picture
 * PUT /api/user/profile-picture
 * Content-Type: multipart/form-data
 * Body: profilePicture (file)
 */
router.put('/profile-picture', auth_1.default, UserController.profilePictureUpload.single('profilePicture'), UserController.uploadProfilePictureController);
// ========================================
// ADMIN-ONLY ROUTES
// Require both authentication AND admin role
// ========================================
/**
 * Get All Pending Teachers
 * GET /api/user/teachers/pending
 * Admin only
 */
router.get('/teachers/pending', auth_1.default, auth_1.authorizeAdmin, UserController.getPendingTeachers);
/**
 * Approve Teacher Account
 * PUT /api/user/teachers/:id/approve
 * Admin only
 */
router.put('/teachers/:id/approve', auth_1.default, auth_1.authorizeAdmin, UserController.approveTeacher);
/**
 * Reject Teacher Account
 * PUT /api/user/teachers/:id/reject
 * Admin only
 * Body: { reason?: string }
 */
router.put('/teachers/:id/reject', auth_1.default, auth_1.authorizeAdmin, UserController.rejectTeacher);
/**
 * Get All Users
 * GET /api/user/
 * Admin only
 */
router.get('/', auth_1.default, auth_1.authorizeAdmin, UserController.getAllUsers);
/**
 * Get User by Email
 * GET /api/user/:email
 * Admin only
 */
router.get('/:email', auth_1.default, auth_1.authorizeAdmin, UserController.getUser);
/**
 * Update Any User
 * PUT /api/user/:id
 * Admin only
 */
router.put('/:id', auth_1.default, auth_1.authorizeAdmin, UserController.updateUser);
/**
 * Delete User
 * DELETE /api/user/:id
 * Admin only
 */
router.delete('/:id', auth_1.default, auth_1.authorizeAdmin, UserController.deleteUser);
exports.default = router;
