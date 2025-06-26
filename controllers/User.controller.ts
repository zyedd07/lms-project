import { NextFunction, Request, Response } from "express";
// The User model is NOT imported here. Controllers should not directly access models.
import HttpError from "../utils/httpError";
import {
    createUserService,
    loginUserService,
    updateUserService,
    deleteUserService,
    uploadProfilePictureService,
    getProfileService // Import the new service
} from "../services/User.service";
import { AuthenticatedRequest } from "../middleware/auth";
import multer, { MulterError } from 'multer';

// Multer Configuration for Profile Pictures
const profilePictureUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new HttpError('Only JPEG, PNG, or GIF files are allowed.', 400) as any, false);
        }
    }
});

/**
 * Controller for a logged-in user to fetch their own, up-to-date profile.
 */
export const getLoggedInUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            return next(new HttpError('User not authenticated.', 401));
        }

        // CORRECT: The controller calls the service layer to get the data.
        // This resolves the bug of sending back stale JWT data.
        const userId = req.user.id;
        const freshUser = await getProfileService(userId);

        return res.status(200).json({
            success: true,
            message: 'User profile fetched successfully',
            user: freshUser 
        });
    } catch (error) {
        console.error("Error fetching logged-in user profile:", error);
        next(new HttpError("Internal server error.", 500));
    }
};

/**
 * Controller for a logged-in user to update their own profile.
 */
export const updateMyProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("User not authenticated.", 401);
        }
        const userId = req.user.id;
        const updates = req.body;

        const allowedUpdates: any = {};
        const fieldsToUpdate = [
            'name', 'email', 'phone', 'dateOfBirth', 'address', 'rollNo', 'collegeName', 'university', 'country'
        ];
        fieldsToUpdate.forEach(field => {
            if (updates[field] !== undefined) {
                allowedUpdates[field] = updates[field];
            }
        });

        if (Object.keys(allowedUpdates).length === 0) {
            throw new HttpError("No valid update data provided.", 400);
        }

        const updatedUser = await updateUserService(userId, allowedUpdates);
        
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller for uploading a profile picture.
 */
export const uploadProfilePictureController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Unauthorized: User ID missing.", 401);
        }
        if (!req.file) {
            throw new HttpError("No image file provided.", 400);
        }
        const updatedUser = await uploadProfilePictureService(req.user.id, req.file.buffer, req.file.mimetype, req.file.originalname);
        
        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            user: updatedUser
        });
    } catch (error) {
        if (error instanceof MulterError) {
             return next(new HttpError(`File upload error: ${error.message}`, 400));
        }
        next(error);
    }
};

/**
 * Controller for user login.
 */
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new HttpError("Please provide both email and password", 400);
        }
        const response = await loginUserService({ email, password });
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * Controller for creating a new user.
 */
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newUser = await createUserService(req.body);
        res.status(201).json({
            id: newUser.get('id'),
            name: newUser.get('name'),
            email: newUser.get('email'),
            message: "User created successfully"
        });
    } catch (error) {
        next(error);
    }
};

// ... other admin-level controllers like deleteUser, updateUser can be added here ...

// Export multer instance for use in routes
export { profilePictureUpload };
