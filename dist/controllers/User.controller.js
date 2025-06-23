"use strict";
// src/controllers/User.controller.ts
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
exports.profilePictureUpload = exports.deleteUser = exports.updateUser = exports.getAllUsers = exports.getUser = exports.loginUser = exports.getLoggedInUser = exports.uploadProfilePictureController = exports.updateMyProfile = exports.createUser = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const User_service_1 = require("../services/User.service");
// Import MulterError as it's correctly defined in your types/multer-shim.d.ts now
const multer_1 = __importStar(require("multer"));
// --- Multer Configuration for Profile Pictures ---
const profilePictureUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            // Pass false as the second argument when rejecting
            cb(new httpError_1.default('Only JPEG, PNG, or GIF image files are allowed for profile pictures!', 400), false);
        }
    }
});
exports.profilePictureUpload = profilePictureUpload;
const createUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password || !phone) {
            throw new httpError_1.default("Please provide all required fields", 400);
        }
        const newUser = yield (0, User_service_1.createUserService)({ name, email, password, phone });
        res.status(201).json(newUser);
    }
    catch (error) {
        next(error);
    }
});
exports.createUser = createUser;
const updateMyProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new httpError_1.default("User not authenticated.", 401);
        }
        const userId = req.user.id;
        const updates = req.body;
        const allowedUpdates = {};
        if (updates.name !== undefined)
            allowedUpdates.name = updates.name;
        if (updates.email !== undefined)
            allowedUpdates.email = updates.email;
        if (updates.phone !== undefined)
            allowedUpdates.phone = updates.phone;
        if (Object.keys(allowedUpdates).length === 0) {
            throw new httpError_1.default("No valid update data provided for profile.", 400);
        }
        const updatedUser = yield (0, User_service_1.updateUserService)(userId, allowedUpdates);
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                profilePicture: updatedUser.profilePicture
            }
        });
    }
    catch (error) {
        console.error("Error in updateMyProfile:", error);
        next(error);
    }
});
exports.updateMyProfile = updateMyProfile;
// --- Profile Picture Upload Controller (Handles the file upload to Supabase via service) ---
const uploadProfilePictureController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("Unauthorized: User ID missing.", 401);
        }
        if (!req.file) {
            throw new httpError_1.default("No image file provided for profile picture.", 400);
        }
        const userId = req.user.id;
        // Accessing properties without '!' as Multer.File.buffer should now be non-optional in shim
        const fileBuffer = req.file.buffer;
        const mimetype = req.file.mimetype;
        const originalFileName = req.file.originalname;
        const updatedUser = yield (0, User_service_1.uploadProfilePictureService)(userId, fileBuffer, mimetype, originalFileName);
        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                profilePicture: updatedUser.profilePicture
            }
        });
    }
    catch (error) {
        console.error("Error in uploadProfilePictureController:", error);
        // Correctly check for MulterError using instanceof
        if (error instanceof multer_1.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return next(new httpError_1.default('Profile picture file size too large. Max 5MB allowed.', 400));
            }
            return next(new httpError_1.default(`File upload error: ${error.message}`, 400));
        }
        next(error);
    }
});
exports.uploadProfilePictureController = uploadProfilePictureController;
const getLoggedInUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        return res.status(200).json({
            message: 'User profile fetched successfully',
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                phone: req.user.phone,
                // This line now correctly uses the profilePicture from JwtUserPayload
                profilePicture: req.user.profilePicture || null,
            }
        });
    }
    catch (error) {
        console.error("Error fetching logged-in user profile:", error);
        next(new httpError_1.default("Internal server error.", 500));
    }
});
exports.getLoggedInUser = getLoggedInUser;
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // --- ADDED LOGGING FOR DEBUGGING ---
        console.log(`[LOGIN CONTROLLER DEBUG] Received login request for email: ${email}`);
        if (!email || !password) {
            throw new httpError_1.default("Please provide both email and password", 400);
        }
        const response = yield (0, User_service_1.loginUserService)({ email, password });
        console.log(`[LOGIN CONTROLLER DEBUG] Login service returned response for email: ${email}`); // ADDED LOGGING
        res.status(200).json(response);
    }
    catch (error) {
        console.error(`[LOGIN CONTROLLER ERROR] Error in loginUser controller for email: ${req.body.email || 'N/A'}:`, error);
        next(error);
    }
});
exports.loginUser = loginUser;
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
const getAllUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield (0, User_service_1.getUsersService)();
        res.status(200).json({ success: true, data: users });
    }
    catch (error) {
        console.error("Error in getAllUsers:", error);
        next(new httpError_1.default("Failed to fetch all users", 500));
    }
});
exports.getAllUsers = getAllUsers;
const updateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, email, phone, role, profilePicture } = req.body;
        const updates = {};
        if (name !== undefined)
            updates.name = name;
        if (email !== undefined)
            updates.email = email;
        if (phone !== undefined)
            updates.phone = phone;
        if (role !== undefined)
            updates.role = role;
        if (profilePicture !== undefined)
            updates.profilePicture = profilePicture;
        if (Object.keys(updates).length === 0) {
            throw new httpError_1.default("No update data provided", 400);
        }
        const updatedUser = yield (0, User_service_1.updateUserService)(id, updates);
        res.status(200).json({ success: true, message: "User updated successfully", data: updatedUser });
    }
    catch (error) {
        console.error("Error in updateUser:", error);
        next(error);
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield (0, User_service_1.deleteUserService)(id);
        res.status(200).json({ success: true, message: "User deleted successfully" });
    }
    catch (error) {
        console.error("Error in deleteUser:", error);
        next(error);
    }
});
exports.deleteUser = deleteUser;
