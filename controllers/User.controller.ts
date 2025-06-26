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

const profilePictureUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimeTypes.includes(file.mimetype)) {
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

        // --- !! THE FIX !! ---
        // Use the ID from the token to fetch the LATEST user data from the database.
        // Do NOT return req.user directly, as it is stale data from the moment of login.
        const userId = req.user.id;
        const freshUser = await User.findByPk(userId, {
             // Ensure all attributes are fetched
            attributes: [
                'id', 'name', 'email', 'phone', 'role', 'profilePicture',
                'dateOfBirth', 'address', 'rollNo', 'collegeName', 'university', 'country'
            ]
        });

        if (!freshUser) {
            return next(new HttpError('User not found in database.', 404));
        }
        
        return res.status(200).json({
            success: true,
            message: 'User profile fetched successfully',
            // Note: We now send back the `freshUser` object. In your frontend,
            // the code that looks for `response.data` or `response.user` will need to handle this.
            // Let's standardize to `user` for this route to match your login response.
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
            // The frontend is expecting the updated user object under a 'data' key here.
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
        
        // Let's standardize this response to match the login/getLoggedInUser response.
        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            user: updatedUser
        });
    } catch (error) {
        next(error);
    }
};


// --- Other controllers remain the same ---
export const createUser = async (req: Request, res: Response, next: NextFunction) => { /* ... unchanged ... */ };
export const loginUser = async (req: Request, res: Response, next: NextFunction) => { /* ... unchanged ... */ };
export const getUser = async (req: Request, res: Response, next: NextFunction) => { /* ... unchanged ... */ };
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => { /* ... unchanged ... */ };
export const updateUser = async (req: Request, res: Response, next: NextFunction) => { /* ... unchanged ... */ };
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => { /* ... unchanged ... */ };

// Export multer instance
export { profilePictureUpload };
