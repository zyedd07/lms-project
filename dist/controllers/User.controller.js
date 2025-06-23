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
            cb(new httpError_1.default('Only JPEG, PNG, or GIF image files are allowed.', 400), false);
        }
    }
});
exports.profilePictureUpload = profilePictureUpload;
/**
 * Controller to handle new user registration with all detailed fields.
 */
const createUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // --- Destructure ALL fields from the request body ---
        const { name, email, password, phone, dateOfBirth, address, rollNo, collegeName, university, country, designation } = req.body;
        // --- Expanded validation to include new required fields ---
        if (!name || !email || !password || !phone || !dateOfBirth || !address || !rollNo || !collegeName || !university || !country || !designation) {
            throw new httpError_1.default("Please provide all required fields for registration", 400);
        }
        // --- Pass all fields to the service layer ---
        const newUser = yield (0, User_service_1.createUserService)({
            name, email, password, phone, dateOfBirth,
            address, rollNo, collegeName, university,
            country, designation
        });
        // --- FIX: Use .get() to access properties from a Sequelize instance ---
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
 * Controller for a logged-in user to update their own profile.
 */
const updateMyProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new httpError_1.default("User not authenticated.", 401);
        }
        const userId = req.user.id;
        const updates = req.body;
        // --- Whitelist all fields a user is allowed to update ---
        const allowedUpdates = {};
        const fieldsToUpdate = [
            'name', 'email', 'phone', 'dateOfBirth', 'address',
            'rollNo', 'collegeName', 'university', 'country'
        ];
        fieldsToUpdate.forEach(field => {
            if (updates[field] !== undefined) {
                allowedUpdates[field] = updates[field];
            }
        });
        if (Object.keys(allowedUpdates).length === 0) {
            throw new httpError_1.default("No valid update data provided for profile.", 400);
        }
        const updatedUser = yield (0, User_service_1.updateUserService)(userId, allowedUpdates);
        // --- FIX: Use .get() to access properties from a Sequelize instance ---
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser // The service now returns a plain object, but using .get() is safer if it returns an instance. For now, returning the instance directly is fine if it's serialized correctly.
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
        const fileBuffer = req.file.buffer;
        const mimetype = req.file.mimetype;
        const originalFileName = req.file.originalname;
        const updatedUser = yield (0, User_service_1.uploadProfilePictureService)(userId, fileBuffer, mimetype, originalFileName);
        // --- FIX: Use .get() for consistency and safety ---
        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            user: {
                id: updatedUser.get('id'),
                name: updatedUser.get('name'),
                email: updatedUser.get('email'),
                phone: updatedUser.get('phone'),
                role: updatedUser.get('role'),
                profilePicture: updatedUser.get('profilePicture')
            }
        });
    }
    catch (error) {
        console.error("Error in uploadProfilePictureController:", error);
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
        // req.user contains the full payload from the JWT, which is already a plain object
        return res.status(200).json({
            message: 'User profile fetched successfully',
            user: req.user
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
        console.log(`[LOGIN CONTROLLER DEBUG] Received login request for email: ${email}`);
        if (!email || !password) {
            throw new httpError_1.default("Please provide both email and password", 400);
        }
        const response = yield (0, User_service_1.loginUserService)({ email, password });
        console.log(`[LOGIN CONTROLLER DEBUG] Login service returned response for email: ${email}`);
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
/**
 * Controller for an admin to update any user's details.
 */
const updateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updates = req.body;
        // In an admin update, you might allow updating the 'role' as well
        const fieldsToUpdate = [
            'name', 'email', 'phone', 'role', 'profilePicture', 'dateOfBirth',
            'address', 'rollNo', 'collegeName', 'university', 'country'
        ];
        const allowedUpdates = {};
        fieldsToUpdate.forEach(field => {
            if (updates[field] !== undefined) {
                allowedUpdates[field] = updates[field];
            }
        });
        if (Object.keys(allowedUpdates).length === 0) {
            throw new httpError_1.default("No update data provided", 400);
        }
        const updatedUser = yield (0, User_service_1.updateUserService)(id, allowedUpdates);
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
