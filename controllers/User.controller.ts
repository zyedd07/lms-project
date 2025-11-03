import { NextFunction, Request, Response } from "express";
// The User model is NOT imported here. Controllers should not directly access models.
import bcrypt from 'bcryptjs';
import User from "../models/User.model";

import HttpError from "../utils/httpError";
import {
    createUserService,
    loginUserService,
    updateUserService,
    deleteUserService,
    uploadProfilePictureService,
    getProfileService,
    getUsersService,
    forgotPasswordService,
    resetPasswordService,
    googleSignInService,   //  --- IMPORT
    facebookSignInService, //  --- IMPORT
    getPendingTeachersService,
    approveTeacherService,
    rejectTeacherService,
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
 * Controller for creating a new user.
 */
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, phone, dateOfBirth, address, rollNo, collegeName, university, country, designation } = req.body;
        if (!name || !email || !password || !phone || !dateOfBirth || !address || !rollNo || !collegeName || !university || !country || !designation) {
            throw new HttpError("Please provide all required fields for registration", 400);
        }
        const serviceResponse  = await createUserService(req.body);
        res.status(201).json({
             id: serviceResponse.user.id,    // Accessing 'id' from the nested 'user' object
            name: serviceResponse.user.name,  // Accessing 'name' from the nested 'user' object
            email: serviceResponse.user.email, // Accessing 'email' from the nested 'user' object
            message: serviceResponse.message 
        });
    } catch (error) {
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
 * --- NEW CONTROLLER ---
 * Controller to handle Google Sign-In.
 */
export const googleSignIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.body; // This is the idToken from the client
        if (!token) {
            throw new HttpError("Google token is required.", 400);
        }
        const response = await googleSignInService(token);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * --- NEW CONTROLLER ---
 * Controller to handle Facebook Sign-In.
 */
export const facebookSignIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.body; // This is the accessToken from the client
        console.log("Received Facebook Access Token:", token); // <-- ADD THIS LINE

        if (!token) {
            throw new HttpError("Facebook token is required.", 400);
        }
        const response = await facebookSignInService(token);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};


/**
 * Controller to handle the "forgot password" request.
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        if (!email) {
            throw new HttpError("Please provide an email address.", 400);
        }
        const response = await forgotPasswordService(email);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to handle the actual password reset with a token.
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            throw new HttpError("Please provide a token and a new password.", 400);
        }
        const response = await resetPasswordService(token, newPassword);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};


/**
 * Controller for a logged-in user to fetch their own, up-to-date profile.
 */
export const getLoggedInUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            return next(new HttpError('User not authenticated.', 401));
        }
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
        const updates = { ...req.body }; // Create a mutable copy of the request body

        const allowedUpdates: any = {};

        // --- Handle Password Update Separately ---
        const currentPassword = updates.currentPassword;
        // FIX: Use updates.newPassword as sent from the frontend
        const newPasswordValue = updates.newPassword;

        if (currentPassword || newPasswordValue) { // Check if a password update is attempted
            if (!currentPassword || !newPasswordValue) {
                throw new HttpError("Both currentPassword and newPassword are required to change password.", 400);
            }

            // 1. Fetch the user to verify current password using Sequelize's findByPk
            const user = await User.findByPk(userId);
            if (!user) {
                throw new HttpError("User not found.", 404);
            }

            // 2. Verify the current password
            const isMatch = await bcrypt.compare(currentPassword, (user as any).password);
            if (!isMatch) {
                throw new HttpError("Current password incorrect.", 401);
            }

            // 3. Pass the new password (plain text) to the service for hashing
            // FIX: Assign newPasswordValue to 'password' for the service, as the service expects 'updates.password'
            allowedUpdates.password = newPasswordValue;

            // Remove password fields from the original updates object so they are not processed as regular fields
            delete updates.currentPassword;
            delete updates.newPassword; // FIX: Delete newPassword, not 'password'
        }
        // --- End Password Update Handling ---

        // Define allowed fields for general profile updates
        const fieldsToUpdate = [
            'name', 'email', 'phone', 'dateOfBirth', 'address',
            'rollNo', 'collegeName', 'university', 'country','status' 
            // FIX: Removed 'password' from this list, as it's handled separately
        ];

        // Populate allowedUpdates with other profile fields
        fieldsToUpdate.forEach(field => {
            if (updates[field] !== undefined) {
                allowedUpdates[field] = updates[field];
            }
        });

        if (Object.keys(allowedUpdates).length === 0) {
            throw new HttpError("No valid update data provided.", 400);
        }

        // Call the service to update the user with the prepared allowedUpdates.
        // The updateUserService is now responsible for hashing 'password' if it exists.
        const updatedUser = await updateUserService(userId, allowedUpdates);

        // Remove sensitive data (like password) before sending the response
        const userResponseData = (updatedUser as any).toJSON ? (updatedUser as any).toJSON() : { ...updatedUser };
        delete userResponseData.password;

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: userResponseData
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
 * Controller for an admin to get any user's profile by email.
 */
export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = req.params.email;
        const user = await getUsersService(email);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

/**
 * Controller for an admin to get all users.
 */
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await getUsersService();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(new HttpError("Failed to fetch all users", 500));
    }
};

/**
 * Controller for an admin to update any user's details by ID.
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedUser = await updateUserService(id, updates);
        res.status(200).json({ success: true, message: "User updated successfully", data: updatedUser });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller for an admin to delete a user by ID.
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await deleteUserService(id);
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// Export multer instance for use in routes
export { profilePictureUpload };

export const getPendingTeachers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // Authorization check: Ensure only admins can access this route.
        // This is typically handled by middleware (e.g., `isAdmin` middleware),
        // but can be done here if no specific middleware is desired.
        // For robustness, a dedicated middleware is highly recommended for role-based access.
        if (req.user?.role !== 'admin') {
            throw new HttpError("Forbidden: Only administrators can view pending teachers.", 403);
        }

        const pendingTeachers = await getPendingTeachersService();
        res.status(200).json({
            success: true,
            message: "Pending teacher accounts fetched successfully.",
            data: pendingTeachers
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to approve a teacher's account.
 * Accessible only by 'admin' role.
 */
export const approveTeacher = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== 'admin') {
            throw new HttpError("Forbidden: Only administrators can approve teacher accounts.", 403);
        }

        const { id } = req.params; // Expecting teacher ID in URL parameter
        if (!id) {
            throw new HttpError("Teacher ID is required.", 400);
        }

        const approvedTeacher = await approveTeacherService(id);
        res.status(200).json({
            success: true,
            message: "Teacher account approved successfully.",
            data: approvedTeacher
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to reject a teacher's account.
 * Accessible only by 'admin' role.
 */
export const rejectTeacher = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== 'admin') {
            throw new HttpError("Forbidden: Only administrators can reject teacher accounts.", 403);
        }

        const { id } = req.params; // Expecting teacher ID in URL parameter
        const { reason } = req.body; // Optional: reason for rejection from request body

        if (!id) {
            throw new HttpError("Teacher ID is required.", 400);
        }

        const rejectedTeacher = await rejectTeacherService(id, reason);
        res.status(200).json({
            success: true,
            message: "Teacher account rejected successfully.",
            data: rejectedTeacher
        });
    } catch (error) {
        next(error);
    }
};
