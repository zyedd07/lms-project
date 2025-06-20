// src/controllers/User.controller.ts

import { NextFunction, Request, Response } from "express";
import HttpError from "../utils/httpError";
import { createUserService, getUsersService, loginUserService, updateUserService, deleteUserService } from "../services/User.service";
import { AuthenticatedRequest } from "../middleware/auth"; // Assuming this is where AuthenticatedRequest is defined

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password || !phone) {
            throw new HttpError("Please provide all required fields", 400);
        }
        const newUser = await createUserService({ name, email, password, phone });
        // The newUser object returned by createUserService already contains name and phone
        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
}

export const updateMyProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new HttpError("User not authenticated.", 401); // Should be caught by isAuth, but good practice
        }

        const userId = req.user.id; // Get ID from the authenticated user's token
        const updates = req.body; // Get update data from request body

        // Optional: Filter allowed fields for self-update (e.g., prevent role change)
        const allowedUpdates: { name?: string; email?: string; phone?: string; } = {};
        if (updates.name !== undefined) allowedUpdates.name = updates.name;
        if (updates.email !== undefined) allowedUpdates.email = updates.email;
        if (updates.phone !== undefined) allowedUpdates.phone = updates.phone;
        // Do NOT allow 'role' to be updated by a user themselves

        if (Object.keys(allowedUpdates).length === 0) {
            throw new HttpError("No valid update data provided for profile.", 400);
        }

        const updatedUser = await updateUserService(userId, allowedUpdates);
        res.status(200).json({ success: true, message: "Profile updated successfully", data: updatedUser });
    } catch (error) {
        console.error("Error in updateMyProfile:", error);
        next(error);
    }
};
export const getLoggedInUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => { // Added next: NextFunction for consistency
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        // req.user is populated by the 'isAuth' middleware from the token payload.
        // It now includes 'phone' as well due to the change in loginUserService.
        return res.status(200).json({
            message: 'User profile fetched successfully',
            user: {
                id: req.user.id,
                name: req.user.name, // <--- Ensure name is returned
                email: req.user.email,
                role: req.user.role,
                phone: req.user.phone, // <--- Ensure phone is returned
            }
        });
    } catch (error) {
        console.error("Error fetching logged-in user profile:", error);
        // Use next(error) for consistency with other controllers
        next(new HttpError("Internal server error.", 500));
    }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new HttpError("Please provide both email and password", 400);
        }
        const response = await loginUserService({ email, password });
        // The response.user object returned by loginUserService now explicitly includes name and phone
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = req.params.email;
        const user = await getUsersService(email);
        // The 'user' object already contains 'name' and 'phone' from the service layer
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await getUsersService();
        // Each user object in the 'users' array already contains 'name' and 'phone'
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        next(new HttpError("Failed to fetch all users", 500));
    }
}

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role } = req.body; // Destructure specific fields for clarity
        const updates: { name?: string; email?: string; phone?: string; role?: string; } = {};

        // Only add to updates if they are provided in the request body
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (phone !== undefined) updates.phone = phone;
        if (role !== undefined) updates.role = role;

        if (Object.keys(updates).length === 0) {
            throw new HttpError("No update data provided", 400);
        }

        const updatedUser = await updateUserService(id, updates);
        // The updatedUser object returned by the service already contains name and phone
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