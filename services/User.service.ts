// src/services/User.service.ts

import User from "../models/User.model";
import bcrypt from 'bcryptjs';
import { CreateUserServiceParams, LoginUserServiceParams } from "../utils/types";
import HttpError from "../utils/httpError";
import jwt, { SignOptions } from 'jsonwebtoken';
import * as fs from 'fs'; // Import Node.js File System module
import * as path from 'path'; // Import Node.js Path module

// Define the path to your Jitsi private key file.
// In production on Render, it will be in /etc/secrets/.
// For local development, you might place it in your project root or configure it via .env.
const JITSI_PRIVATE_KEY_FILE_PATH = process.env.NODE_ENV === 'production'
    ? '/etc/secrets/jitsi_private_key.pem' // Render's path for Secret Files
    : path.join(__dirname, '..', '..', 'jitsi_private_key.pem'); // Common local dev path (e.g., if .pem is in project root)

let jitsiPrivateKey: string;

// Load the Jitsi Private Key once when the service file is imported
try {
    if (!fs.existsSync(JITSI_PRIVATE_KEY_FILE_PATH)) {
        // Fallback for local development if the file isn't present,
        // or if you want to use a direct environment variable for it locally.
        jitsiPrivateKey = process.env.JITSI_PRIVATE_KEY || ''; // Use a specific env var for Jitsi if needed locally
        if (!jitsiPrivateKey) {
            console.warn(`[Jitsi Init] Jitsi private key file not found at ${JITSI_PRIVATE_KEY_FILE_PATH} and JITSI_PRIVATE_KEY env var is empty.`);
        } else {
            console.log("[Jitsi Init] Jitsi Private Key loaded from environment variable (fallback).");
        }
    } else {
        jitsiPrivateKey = fs.readFileSync(JITSI_PRIVATE_KEY_FILE_PATH, 'utf8');
        console.log("[Jitsi Init] Jitsi Private Key loaded successfully from secret file.");
    }
    if (!jitsiPrivateKey) {
        // Only throw error if the key is absolutely critical for this service.
        // For services that *always* need to sign Jitsi JWTs, this is appropriate.
        throw new Error("Jitsi Private Key is not loaded. Ensure it's configured in Render's Secret Files or as an environment variable.");
    }
} catch (error) {
    console.error("[Jitsi Init] Error loading Jitsi Private Key:", error);
    throw error;
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
        // Casting user.get("password") to string as bcrypt.compare expects string
        const isPasswordMatch = await bcrypt.compare(password, user.get("password") as string);
        if (!isPasswordMatch) {
            throw new HttpError("Invalid password", 400);
        }
        // Assuming SECRET_KEY is for *your app's* JWTs, and `jitsiPrivateKey` is for *Jitsi's* JWTs.
        // If this token is *only* for Jitsi authentication, you would use `jitsiPrivateKey` here.
        const APP_SECRET_KEY: string = process.env.SECRET_KEY || 'cleanclean'; 
        
        const userRole: string = user.get("role") as string; 
        
        const userSessionData = {
            id: user.get("id"),
            name: user.get("name"),
            email: user.get("email"),
            phone: user.get("phone"),
            role: userRole,
        };

        const jwtOptions: SignOptions = {
            expiresIn: 604800 // 7 days in seconds (7 * 24 * 60 * 60)
        };

        const token = jwt.sign(userSessionData, APP_SECRET_KEY, jwtOptions); // Use APP_SECRET_KEY for app-internal JWT
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

/**
 * Updates a user's profile based on their ID.
 * @param id The ID of the user to update.
 * @param updates An object containing the fields to update (e.g., name, email, phone, role).
 * @returns The updated user object.
 * @throws HttpError if the user is not found or if there's a validation error.
 */
export const updateUserService = async (id: string, updates: { name?: string; email?: string; phone?: string; role?: string; }) => {
    try {
        // User.findByPk(id) as any; // Temporary 'any' until User.model.ts is fixed
        // Once User.model.ts is updated to extend Model<any, any>, you might not need this casting.
        const user = await User.findByPk(id) as any; // Assuming User.model.ts extends Model<any, any> now
        
        if (!user) {
            throw new HttpError("User not found", 404);
        }

        if (updates.name !== undefined) user.name = updates.name;
        if (updates.email !== undefined) user.email = updates.email;
        if (updates.phone !== undefined) user.phone = updates.phone;
        if (updates.role !== undefined) user.role = updates.role;

        await user.save();
        return user;
    } catch (error) {
        console.error("Error in updateUserService:", error);
        throw error;
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
        return true;
    } catch (error) {
        console.error("Error in deleteUserService:", error);
        throw error;
    }
};