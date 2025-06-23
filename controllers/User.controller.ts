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
import { AuthenticatedRequest } from "../middleware/auth";
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
            cb(new HttpError('Only JPEG, PNG, or GIF image files are allowed.', 400) as any, false);
        }
    }
});


/**
 * Controller to handle new user registration with all detailed fields.
 */
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // --- Destructure ALL fields from the request body ---
        const {
            name, email, password, phone,
            dateOfBirth, address, rollNo, collegeName,
            university, country, designation
        } = req.body;

        // --- Expanded validation to include new required fields ---
        if (!name || !email || !password || !phone || !dateOfBirth || !address || !rollNo || !collegeName || !university || !country || !designation) {
            throw new HttpError("Please provide all required fields for registration", 400);
        }
        
        // --- Pass all fields to the service layer ---
        const newUser = await createUserService({
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
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for a logged-in user to update their own profile.
 */
export const updateMyProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new HttpError("User not authenticated.", 401);
        }

        const userId = req.user.id;
        const updates = req.body;

        // --- Whitelist all fields a user is allowed to update ---
        const allowedUpdates: any = {};
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
            throw new HttpError("No valid update data provided for profile.", 400);
        }

        const updatedUser = await updateUserService(userId, allowedUpdates);
        
        // --- FIX: Use .get() to access properties from a Sequelize instance ---
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser // The service now returns a plain object, but using .get() is safer if it returns an instance. For now, returning the instance directly is fine if it's serialized correctly.
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
        const fileBuffer = req.file.buffer;
        const mimetype = req.file.mimetype;
        const originalFileName = req.file.originalname;

        const updatedUser = await uploadProfilePictureService(userId, fileBuffer, mimetype, originalFileName);

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

    } catch (error: unknown) {
        console.error("Error in uploadProfilePictureController:", error);
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
        // req.user contains the full payload from the JWT, which is already a plain object
        return res.status(200).json({
            message: 'User profile fetched successfully',
            user: req.user
        });
    } catch (error) {
        console.error("Error fetching logged-in user profile:", error);
        next(new HttpError("Internal server error.", 500));
    }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        console.log(`[LOGIN CONTROLLER DEBUG] Received login request for email: ${email}`);

        if (!email || !password) {
            throw new HttpError("Please provide both email and password", 400);
        }
        const response = await loginUserService({ email, password });
        console.log(`[LOGIN CONTROLLER DEBUG] Login service returned response for email: ${email}`);
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

/**
 * Controller for an admin to update any user's details.
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // In an admin update, you might allow updating the 'role' as well
        const fieldsToUpdate = [
            'name', 'email', 'phone', 'role', 'profilePicture', 'dateOfBirth', 
            'address', 'rollNo', 'collegeName', 'university', 'country'
        ];
        
        const allowedUpdates: any = {};
        fieldsToUpdate.forEach(field => {
            if (updates[field] !== undefined) {
                allowedUpdates[field] = updates[field];
            }
        });

        if (Object.keys(allowedUpdates).length === 0) {
            throw new HttpError("No update data provided", 400);
        }

        const updatedUser = await updateUserService(id, allowedUpdates);
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
