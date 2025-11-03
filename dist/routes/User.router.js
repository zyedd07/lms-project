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
const express_1 = __importDefault(require("express"));
const UserController = __importStar(require("../controllers/User.controller"));
const auth_1 = __importStar(require("../middleware/auth")); // Ensure authorizeAdmin is imported
const router = express_1.default.Router();
// Public routes (no authentication required)
router.post('/create', UserController.createUser);
router.post('/login', UserController.loginUser);
router.post('/forgot-password', UserController.forgotPassword);
router.post('/reset-password', UserController.resetPassword);
router.post('/google-signin', UserController.googleSignIn); //  --- NEW ROUTE
router.post('/facebook-signin', UserController.facebookSignIn); //  --- NEW ROUTE
// Authenticated user's own profile routes
router.get('/me', auth_1.default, UserController.getLoggedInUser);
router.put('/meupdate', auth_1.default, UserController.updateMyProfile); // For user to update their OWN profile
// --- New route for profile picture upload ---
// This route needs authentication and the multer middleware
// `profilePictureUpload.single('profilePicture')` is the multer middleware
// The string 'profilePicture' must match the key used in formData.append('profilePicture', ...) on the frontend.
router.put('/profile-picture', // Endpoint will be something like /api/user/profile-picture (depending on your app.use setup)
auth_1.default, UserController.profilePictureUpload.single('profilePicture'), // Apply multer middleware
UserController.uploadProfilePictureController // Your controller to handle the upload
);
router.get('/teachers/pending', auth_1.default, auth_1.authorizeAdmin, UserController.getPendingTeachers);
router.put('/teachers/:id/approve', auth_1.default, auth_1.authorizeAdmin, UserController.approveTeacher); // Use PUT for updates
router.put('/teachers/:id/reject', auth_1.default, auth_1.authorizeAdmin, UserController.rejectTeacher); // Use PUT for updates
// Admin-only routes (requires authentication AND admin role)
// IMPORTANT: Apply authorizeAdmin to routes that modify/view other users
router.get('/', auth_1.default, auth_1.authorizeAdmin, UserController.getAllUsers); // Get all users
router.get('/:email', auth_1.default, auth_1.authorizeAdmin, UserController.getUser); // Get a specific user by email (only for admins)
router.put('/:id', auth_1.default, auth_1.authorizeAdmin, UserController.updateUser); // Update any user by ID (only for admins)
router.delete('/:id', auth_1.default, auth_1.authorizeAdmin, UserController.deleteUser); // Delete any user by ID (only for admins)
exports.default = router;
