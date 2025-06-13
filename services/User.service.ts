import User from "../models/User.model"; // Ensure correct import path and type definition for User model
import bcrypt from 'bcryptjs';
import { CreateUserServiceParams, LoginUserServiceParams } from "../utils/types"; // Assuming types.ts defines these
import HttpError from "../utils/httpError";
import jwt, { SignOptions } from 'jsonwebtoken'; // FIX: Import SignOptions

// Assuming you have a User model with Sequelize-like methods like .update(), .destroy()

// Removed UpdateUserServiceParams interface definition as per request.
// Type assertion will handle property checks for 'user' object in updateUserService.

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
        // Casting user.get("password") to string as bcrypt.compare expects string
        const isPasswordMatch = await bcrypt.compare(password, user.get("password") as string);
        if (!isPasswordMatch) {
            throw new HttpError("Invalid password", 400);
        }
        const SECRET_KEY: string = process.env.SECRET_KEY || 'cleanclean'; // Ensure SECRET_KEY is always a string
        
        const userRole: string = user.get("role") as string; // Ensure userRole is typed correctly
        
        const userSessionData = {
            id: user.get("id"),
            name: user.get("name"), // Assuming User model has a 'name' field
            email: user.get("email"),
            role: userRole,
        };

        // FIX: Explicitly type the options object as SignOptions
      const jwtOptions: SignOptions = {
    // Calculate 7 days in seconds. You can adjust this value as needed.
    expiresIn: 604800 // 7 days in seconds (7 * 24 * 60 * 60)
};

        const token = jwt.sign(userSessionData, SECRET_KEY, jwtOptions); // FIX: Pass jwtOptions here
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
export const updateUserService = async (id: string, updates: { name?: string; email?: string; phone?: string; role?: string; }) => {
    try {
        // Explicitly assert the type of the user to include its expected properties
        // IMPORTANT: This casting to `InstanceType<typeof User> & { ... }` will likely cause issues
        // if your User.model.ts is not correctly typed. It's better to fix the User model itself.
        const user = await User.findByPk(id) as any; // Temporary 'any' until User.model.ts is fixed
        
        if (!user) {
            throw new HttpError("User not found", 404);
        }

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