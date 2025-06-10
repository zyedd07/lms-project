import User from "../models/User.model";
import bcrypt from 'bcryptjs';
import { CreateUserServiceParams, LoginUserServiceParams } from "../utils/types"; // Assuming types.ts defines these
import HttpError from "../utils/httpError";
import jwt from 'jsonwebtoken';

// Assuming you have a User model with Sequelize-like methods like .update(), .destroy()

// It's good practice to define an interface for update parameters.
// You might want to add this to your utils/types.ts or similar.
export interface UpdateUserServiceParams {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    // password could also be here if you want to allow password changes via admin panel
}

export const createUserService = async ({ name, email, phone, password }: CreateUserServiceParams) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newUser = await User.create({
            name,
            email,
            password: passwordHash,
            phone,
            role: 'student', // Default role for new sign-ups
        });
        return newUser;
    } catch (error) {
        throw error;
    }
}

export const loginUserService = async ({ email, password }: LoginUserServiceParams) => {
    try {
        const user = await User.findOne({
            where: { email },
        });
        if (!user) {
            throw new HttpError("User does not exist", 400);
        }
        const isPasswordMatch = await bcrypt.compare(password, user.get("password") as unknown as string);
        if (!isPasswordMatch) {
            throw new HttpError("Invalid password", 400);
        }
        const SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
        
        const userRole = user.get("role") as string;
        
        const userSessionData = {
            id: user.get("id"),
            name: user.get("name"),
            email: user.get("email"),
            role: userRole,
        };

        const token = jwt.sign(userSessionData, SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        return {
            user: userSessionData,
            token,
        };
    } catch (error) {
        throw error;
    }
};

export const getUsersService = async (email?: string) => {
    try {
        if (email) {
            const user = await User.findOne({
                where: { email },
            });
            if (!user) {
                throw new HttpError("User does not exist", 400);
            }
            return user;
        } else {
            const users = await User.findAll(); // This fetches all users
            return users;
        }
    } catch (error) {
        throw error;
    }
}

// --- New Service Functions for User Management ---

/**
 * Updates a user's profile based on their ID.
 * @param id The ID of the user to update.
 * @param updates An object containing the fields to update (e.g., name, email, phone, role).
 * @returns The updated user object.
 * @throws HttpError if the user is not found or if there's a validation error.
 */
export const updateUserService = async (id: string, updates: UpdateUserServiceParams) => {
    try {
        const user = await User.findByPk(id); // Find user by primary key (ID)
        if (!user) {
            throw new HttpError("User not found", 404);
        }

        // Apply updates
        // Note: For sensitive fields like 'password', you'd typically have a separate
        // dedicated service/endpoint with proper password hashing.
        if (updates.name !== undefined) user.name = updates.name;
        if (updates.email !== undefined) user.email = updates.email;
        if (updates.phone !== undefined) user.phone = updates.phone;
        if (updates.role !== undefined) user.role = updates.role;

        await user.save(); // Save the updated user to the database
        return user;
    } catch (error) {
        console.error("Error in updateUserService:", error);
        throw error; // Re-throw to be caught by the controller
    }
};

/**
 * Deletes a user from the database by their ID.
 * @param id The ID of the user to delete.
 * @returns true if the user was successfully deleted.
 * @throws HttpError if the user is not found.
 */
export const deleteUserService = async (id: string) => {
    try {
        const result = await User.destroy({
            where: { id },
        });

        if (result === 0) {
            throw new HttpError("User not found", 404);
        }
        return true; // Indicate successful deletion
    } catch (error) {
        console.error("Error in deleteUserService:", error);
        throw error; // Re-throw to be caught by the controller
    }
};
