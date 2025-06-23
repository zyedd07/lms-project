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
import { AuthenticatedRequest } from "../middleware/auth"; // Your AuthenticatedRequest definition
// Re-import MulterError if it was removed in previous attempts
import multer, { MulterError } from 'multer'; // <-- Ensure MulterError is imported here


const profilePictureUpload = multer({
    storage: multer.memoryStorage(), // This ensures 'buffer' is populated
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new HttpError('Only JPEG, PNG, or GIF image files are allowed for profile pictures!', 400), false);
        }
    }
});


export const createUser = async (req: Request, res: Response, next: NextFunction) => { /* ... */ }
export const updateMyProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => { /* ... */ }


// --- Profile Picture Upload Controller ---
export const uploadProfilePictureController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Unauthorized: User ID missing.", 401);
        }
        if (!req.file) { // <-- This check is still necessary to handle case where no file was sent
            throw new HttpError("No image file provided for profile picture.", 400);
        }

        const userId = req.user.id;
        // With 'buffer: Buffer;' in your shim, you no longer strictly need '!' here
        // as TypeScript will know req.file.buffer is guaranteed to be a Buffer
        // after the 'if (!req.file)' check. However, keeping '!' is harmless.
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
        // This check should now correctly use MulterError imported from 'multer'
        if (error instanceof MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return next(new HttpError('Profile picture file size too large. Max 5MB allowed.', 400));
            }
            // Handle other specific MulterError codes if needed
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
                // --- THIS STILL DEPENDS ON src/utils/types.ts ---
                profilePicture: req.user.profilePicture || null,
            }
        });
    } catch (error) {
        console.error("Error fetching logged-in user profile:", error);
        next(new HttpError("Internal server error.", 500));
    }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => { /* ... */ }
export const getUser = async (req: Request, res: Response, next: NextFunction) => { /* ... */ }
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => { /* ... */ }
export const updateUser = async (req: Request, res: Response, next: NextFunction) => { /* ... */ }
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => { /* ... */ }

export { profilePictureUpload };