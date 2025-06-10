import { NextFunction, Request, Response } from "express";
import HttpError from "../utils/httpError";
import { createUserService, getUsersService, loginUserService, updateUserService, deleteUserService } from "../services/User.service"; // Added updateUserService, deleteUserService
import { AuthenticatedRequest } from "../middleware/auth";

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
export const getLoggedInUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        // req.user is populated by the 'isAuth' middleware from the token payload
        return res.status(200).json({
            message: 'User profile fetched successfully',
            user: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role,
                phone: req.user.phone, // Assuming username is also in your token payload
                // Add any other user properties you want to send to the frontend
            }
        });
    } catch (error) {
        console.error("Error fetching logged-in user profile:", error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

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
}

// Controller to get a single user by email (existing functionality)
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
        // Calling getUsersService without an email parameter fetches all users
        const users = await getUsersService(); 
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        next(new HttpError("Failed to fetch all users", 500)); // Pass error to Express error handler
    }
}

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // Get user ID from URL parameters
        const updates = req.body; // Get update data from request body

        // Basic validation for updates
        if (Object.keys(updates).length === 0) {
            throw new HttpError("No update data provided", 400);
        }

        // Call the update service with the user ID and the updates
        const updatedUser = await updateUserService(id, updates);
        res.status(200).json({ success: true, message: "User updated successfully", data: updatedUser });
    } catch (error) {
        console.error("Error in updateUser:", error);
        next(error); // Pass the error to the Express error handler
    }
}

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // Get user ID from URL parameters

        // Call the delete service with the user ID
        await deleteUserService(id);
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Error in deleteUser:", error);
        next(error); // Pass the error to the Express error handler
    }
}
