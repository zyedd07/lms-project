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
exports.profilePictureUpload = exports.deleteUser = exports.updateUser = exports.getAllUsers = exports.getUser = exports.uploadProfilePictureController = exports.updateMyProfile = exports.getLoggedInUser = exports.resetPassword = exports.forgotPassword = exports.facebookSignIn = exports.googleSignIn = exports.loginUser = exports.createUser = void 0;
// The User model is NOT imported here. Controllers should not directly access models.
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_model_1 = __importDefault(require("../models/User.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const User_service_1 = require("../services/User.service");
const multer_1 = __importStar(require("multer"));
// Multer Configuration for Profile Pictures
const profilePictureUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new httpError_1.default('Only JPEG, PNG, or GIF files are allowed.', 400), false);
        }
    }
});
exports.profilePictureUpload = profilePictureUpload;
/**
 * Controller for creating a new user.
 */
const createUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, phone, dateOfBirth, address, rollNo, collegeName, university, country, designation } = req.body;
        if (!name || !email || !password || !phone || !dateOfBirth || !address || !rollNo || !collegeName || !university || !country || !designation) {
            throw new httpError_1.default("Please provide all required fields for registration", 400);
        }
        const newUser = yield (0, User_service_1.createUserService)(req.body);
        res.status(201).json({
            id: newUser.get('id'),
            name: newUser.get('name'),
            email: newUser.get('email'),
            message: "User created successfully"
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createUser = createUser;
/**
 * Controller for user login.
 */
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new httpError_1.default("Please provide both email and password", 400);
        }
        const response = yield (0, User_service_1.loginUserService)({ email, password });
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.loginUser = loginUser;
/**
 * --- NEW CONTROLLER ---
 * Controller to handle Google Sign-In.
 */
const googleSignIn = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.body; // This is the idToken from the client
        if (!token) {
            throw new httpError_1.default("Google token is required.", 400);
        }
        const response = yield (0, User_service_1.googleSignInService)(token);
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.googleSignIn = googleSignIn;
/**
 * --- NEW CONTROLLER ---
 * Controller to handle Facebook Sign-In.
 */
const facebookSignIn = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.body; // This is the accessToken from the client
        console.log("Received Facebook Access Token:", token); // <-- ADD THIS LINE
        if (!token) {
            throw new httpError_1.default("Facebook token is required.", 400);
        }
        const response = yield (0, User_service_1.facebookSignInService)(token);
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.facebookSignIn = facebookSignIn;
/**
 * Controller to handle the "forgot password" request.
 */
const forgotPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            throw new httpError_1.default("Please provide an email address.", 400);
        }
        const response = yield (0, User_service_1.forgotPasswordService)(email);
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.forgotPassword = forgotPassword;
/**
 * Controller to handle the actual password reset with a token.
 */
const resetPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            throw new httpError_1.default("Please provide a token and a new password.", 400);
        }
        const response = yield (0, User_service_1.resetPasswordService)(token, newPassword);
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.resetPassword = resetPassword;
/**
 * Controller for a logged-in user to fetch their own, up-to-date profile.
 */
const getLoggedInUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            return next(new httpError_1.default('User not authenticated.', 401));
        }
        const userId = req.user.id;
        const freshUser = yield (0, User_service_1.getProfileService)(userId);
        return res.status(200).json({
            success: true,
            message: 'User profile fetched successfully',
            user: freshUser
        });
    }
    catch (error) {
        console.error("Error fetching logged-in user profile:", error);
        next(new httpError_1.default("Internal server error.", 500));
    }
});
exports.getLoggedInUser = getLoggedInUser;
/**
 * Controller for a logged-in user to update their own profile.
 */
const updateMyProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("User not authenticated.", 401);
        }
        const userId = req.user.id;
        const updates = Object.assign({}, req.body); // Create a mutable copy of the request body
        const allowedUpdates = {};
        // --- Handle Password Update Separately ---
        const currentPassword = updates.currentPassword;
        const newPassword = updates.newPassword;
        if (currentPassword || newPassword) { // Check if a password update is attempted
            if (!currentPassword || !newPassword) {
                throw new httpError_1.default("Both currentPassword and newPassword are required to change password.", 400);
            }
            // 1. Fetch the user to verify current password using Sequelize's findByPk
            // Ensure 'User' is your Sequelize model instance.
            const user = yield User_model_1.default.findByPk(userId);
            if (!user) {
                throw new httpError_1.default("User not found.", 404);
            }
            // 2. Verify the current password
            // Casting 'user' to 'any' to explicitly allow access to the 'password' property,
            // as Sequelize model types might not always expose it directly without specific type definitions.
            const isMatch = yield bcryptjs_1.default.compare(currentPassword, user.password);
            if (!isMatch) {
                throw new httpError_1.default("Current password incorrect.", 401);
            }
            // 3. Pass the new password (plain text) to the service for hashing
            allowedUpdates.newPassword = newPassword; // Renamed to newPassword to be explicit for the service
            // Remove password fields from the original updates object so they are not processed as regular fields
            delete updates.currentPassword;
            delete updates.newPassword;
        }
        // --- End Password Update Handling ---
        // Define allowed fields for general profile updates
        const fieldsToUpdate = [
            'name', 'email', 'phone', 'dateOfBirth', 'address',
            'rollNo', 'collegeName', 'university', 'country'
        ];
        // Populate allowedUpdates with other profile fields
        fieldsToUpdate.forEach(field => {
            if (updates[field] !== undefined) {
                allowedUpdates[field] = updates[field];
            }
        });
        if (Object.keys(allowedUpdates).length === 0) {
            throw new httpError_1.default("No valid update data provided.", 400);
        }
        // Call the service to update the user with the prepared allowedUpdates.
        // The updateUserService is now responsible for hashing 'newPassword' if it exists.
        const updatedUser = yield (0, User_service_1.updateUserService)(userId, allowedUpdates);
        // Remove sensitive data (like password) before sending the response
        // Sequelize model instances typically have a .toJSON() method.
        const userResponseData = updatedUser.toJSON ? updatedUser.toJSON() : Object.assign({}, updatedUser);
        delete userResponseData.password;
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: userResponseData
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateMyProfile = updateMyProfile;
/**
 * Controller for uploading a profile picture.
 */
const uploadProfilePictureController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("Unauthorized: User ID missing.", 401);
        }
        if (!req.file) {
            throw new httpError_1.default("No image file provided.", 400);
        }
        const updatedUser = yield (0, User_service_1.uploadProfilePictureService)(req.user.id, req.file.buffer, req.file.mimetype, req.file.originalname);
        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            user: updatedUser
        });
    }
    catch (error) {
        if (error instanceof multer_1.MulterError) {
            return next(new httpError_1.default(`File upload error: ${error.message}`, 400));
        }
        next(error);
    }
});
exports.uploadProfilePictureController = uploadProfilePictureController;
/**
 * Controller for an admin to get any user's profile by email.
 */
const getUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.params.email;
        const user = yield (0, User_service_1.getUsersService)(email);
        res.status(200).json(user);
    }
    catch (error) {
        next(error);
    }
});
exports.getUser = getUser;
/**
 * Controller for an admin to get all users.
 */
const getAllUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield (0, User_service_1.getUsersService)();
        res.status(200).json({ success: true, data: users });
    }
    catch (error) {
        next(new httpError_1.default("Failed to fetch all users", 500));
    }
});
exports.getAllUsers = getAllUsers;
/**
 * Controller for an admin to update any user's details by ID.
 */
const updateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedUser = yield (0, User_service_1.updateUserService)(id, updates);
        res.status(200).json({ success: true, message: "User updated successfully", data: updatedUser });
    }
    catch (error) {
        next(error);
    }
});
exports.updateUser = updateUser;
/**
 * Controller for an admin to delete a user by ID.
 */
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield (0, User_service_1.deleteUserService)(id);
        res.status(200).json({ success: true, message: "User deleted successfully" });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteUser = deleteUser;
