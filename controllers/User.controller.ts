// src/controllers/User.controller.ts

import { NextFunction, Request, Response } from "express";
import HttpError from "../utils/httpError";
import {
    createUserService,
    getUsersService,
    loginUserService,
    updateUserService,
    deleteUserService,
    uploadProfilePictureService
} from "../services/User.service";
// Importing AuthenticatedRequest from middleware/auth is correct if auth.ts re-exports it
// Ensure middleware/auth.ts correctly imports JwtUserPayload from utils/types
import { AuthenticatedRequest } from "../middleware/auth";
// Import MulterError as it's correctly defined in your types/multer-shim.d.ts now
import multer, { MulterError } from 'multer';

// --- Multer Configuration for Profile Pictures ---
const profilePictureUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            // Pass false as the second argument when rejecting
            cb(new HttpError('Only JPEG, PNG, or GIF image files are allowed for profile pictures!', 400), false);
        }
    }
});


export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password || !phone) {
            throw new HttpError("Please provide all required fields", 400);
        }
        const newUser = await createUserService({ name, email, password, phone });
        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
}

export const updateMyProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new HttpError("User not authenticated.", 401);
        }

        const userId = req.user.id;
        const updates = req.body;

        const allowedUpdates: { name?: string; email?: string; phone?: string; } = {};
        if (updates.name !== undefined) allowedUpdates.name = updates.name;
        if (updates.email !== undefined) allowedUpdates.email = updates.email;
        if (updates.phone !== undefined) allowedUpdates.phone = updates.phone;

        if (Object.keys(allowedUpdates).length === 0) {
            throw new HttpError("No valid update data provided for profile.", 400);
        }

        const updatedUser = await updateUserService(userId, allowedUpdates);
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
    } catch (error) {
        console.error("Error in updateMyProfile:", error);
        next(error);
    }
};

// --- Profile Picture Upload Controller (Handles the file upload to Supabase via service) ---
export const uploadProfilePictureController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Unauthorized: User ID missing.", 401);
        }
        if (!req.file) {
            throw new HttpError("No image file provided for profile picture.", 400);
        }

        const userId = req.user.id;
        // Accessing properties without '!' as Multer.File.buffer should now be non-optional in shim
        const fileBuffer = req.file.buffer;
        const mimetype = req.file.mimetype;
        const originalFileName = req.file.originalname;

        const updatedUser = await uploadProfilePictureService(userId, fileBuffer, mimetype, originalFileName);

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

    } catch (error: unknown) {
        console.error("Error in uploadProfilePictureController:", error);
        // Correctly check for MulterError using instanceof
        if (error instanceof MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return next(new HttpError('Profile picture file size too large. Max 5MB allowed.', 400));
            }
            return next(new HttpError(`File upload error: ${error.message}`, 400));
        }
        next(error);
    }
};


export const getLoggedInUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    } catch (error) {
        console.error("Error fetching logged-in user profile:", error);
        next(new HttpError("Internal server error.", 500));
    }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        // --- ADDED LOGGING FOR DEBUGGING ---
        console.log(`[LOGIN CONTROLLER DEBUG] Received login request for email: ${email}`);

        if (!email || !password) {
            throw new HttpError("Please provide both email and password", 400);
        }
        const response = await loginUserService({ email, password });
        console.log(`[LOGIN CONTROLLER DEBUG] Login service returned response for email: ${email}`); // ADDED LOGGING
        res.status(200).json(response);
    } catch (error) {
        console.error(`[LOGIN CONTROLLER ERROR] Error in loginUser controller for email: ${req.body.email || 'N/A'}:`, error);
        next(error);
    }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = req.params.email;
        const user = await getUsersService(email);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await getUsersService();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        next(new HttpError("Failed to fetch all users", 500));
    }
}

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role, profilePicture } = req.body;
        const updates: { name?: string; email?: string; phone?: string; role?: string; profilePicture?: string; } = {};

        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (phone !== undefined) updates.phone = phone;
        if (role !== undefined) updates.role = role;
        if (profilePicture !== undefined) updates.profilePicture = profilePicture;

        if (Object.keys(updates).length === 0) {
            throw new HttpError("No update data provided", 400);
        }

        const updatedUser = await updateUserService(id, updates);
        res.status(200).json({ success: true, message: "User updated successfully", data: updatedUser });
    } catch (error) {
        console.error("Error in updateUser:", error);
        next(error);
    }
}

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await deleteUserService(id);
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Error in deleteUser:", error);
        next(error);
    }
}

// Export the multer instance so it can be used in your routes
export { profilePictureUpload };