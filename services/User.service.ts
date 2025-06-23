// src/services/User.service.ts

import User from "../models/User.model";
import bcrypt from 'bcryptjs';
import { CreateUserServiceParams, LoginUserServiceParams } from "../utils/types";
import HttpError from "../utils/httpError";
import jwt, { SignOptions } from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js'; // Import createClient directly

// --- Supabase client setup using environment variables ---
// This block is moved here from a separate config file or directly used in controllers/services.
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Using SERVICE_ROLE_KEY for server-side

if (!supabaseUrl || !supabaseKey) {
  console.error('Environment variables SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined.');
  // In a real application, you might want to throw an error or exit the process if these are critical
  // For now, we'll proceed, but operations requiring Supabase will fail.
}
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // No need for session persistence on the server
  },
});
console.log("Supabase client initialized directly in User.service.ts");


import { v4 as uuidv4 } from 'uuid'; // To generate unique filenames


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
            role: 'student',
            // profilePicture will default to null/undefined if not provided, which is fine
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
            attributes: ['id', 'name', 'email', 'phone', 'role', 'profilePicture', 'password']
        });
        if (!user) {
            throw new HttpError("User does not exist", 400);
        }
        const isPasswordMatch = await bcrypt.compare(password, user.get("password") as string);
        if (!isPasswordMatch) {
            throw new HttpError("Invalid password", 400);
        }

        const APP_SECRET_KEY: string = process.env.SECRET_KEY || 'cleanclean';

        const userRole: string = user.get("role") as string;
        const profilePictureUrl: string | null = user.get("profilePicture") as string | null;

        const userSessionData = {
            id: user.get("id"),
            name: user.get("name"),
            email: user.get("email"),
            phone: user.get("phone"),
            role: userRole,
            profilePicture: profilePictureUrl,
        };

        const jwtOptions: SignOptions = {
            expiresIn: 604800
        };

        const token = jwt.sign(userSessionData, APP_SECRET_KEY, jwtOptions);
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
                attributes: ['id', 'name', 'email', 'phone', 'role', 'profilePicture']
            });
            if (!user) {
                throw new HttpError("User does not exist", 400);
            }
            return user;
        } else {
            const users = await User.findAll({
                attributes: ['id', 'name', 'email', 'phone', 'role', 'profilePicture']
            });
            return users;
        }
    } catch (error) {
        throw error;
    }
}

export const updateUserService = async (id: string, updates: { name?: string; email?: string; phone?: string; role?: string; profilePicture?: string; }) => {
    try {
        const user = await User.findByPk(id) as any;

        if (!user) {
            throw new HttpError("User not found", 404);
        }

        if (updates.name !== undefined) user.name = updates.name;
        if (updates.email !== undefined) user.email = updates.email;
        if (updates.phone !== undefined) user.phone = updates.phone;
        if (updates.role !== undefined) user.role = updates.role;
        // profilePicture will be handled by uploadProfilePictureService,
        // but keeping this here for flexibility if other controllers use it
        if (updates.profilePicture !== undefined) user.profilePicture = updates.profilePicture;

        await user.save();
        return user;
    } catch (error) {
        console.error("Error in updateUserService:", error);
        throw error;
    }
};

/**
 * Service to upload a profile picture to Supabase Storage and update the user's record.
 * @param userId The ID of the user.
 * @param fileBuffer The buffer of the image file.
 * @param mimetype The MIME type of the file (e.g., 'image/jpeg').
 * @param originalFileName The original name of the file.
 * @returns The updated user object with the new profile picture URL.
 * @throws HttpError if the user is not found or upload/deletion fails.
 */
export const uploadProfilePictureService = async (
    userId: string,
    fileBuffer: Buffer, // File buffer from multer
    mimetype: string,   // File mimetype from multer
    originalFileName: string // Original file name from multer
) => {
    const PROFILE_PICTURE_BUCKET = 'profile-pictures'; // Define your Supabase bucket name for profile pictures

    try {
        const user = await User.findByPk(userId) as any;

        if (!user) {
            throw new HttpError("User not found", 404);
        }

        // --- Step 1: Delete old profile picture from Supabase Storage (if exists) ---
        if (user.profilePicture) {
            // Extract the path within the bucket from the full public URL
            // This relies on the structure: .../public/<bucket_name>/<path_in_bucket>
            const urlParts = user.profilePicture.split('/');
            const publicIndex = urlParts.indexOf('public');

            if (publicIndex !== -1 && urlParts.length > publicIndex + 1) {
                const bucketNameInUrl = urlParts[publicIndex - 1]; // Should be 'profile-pictures'
                const oldFilePathInBucket = urlParts.slice(publicIndex + 1).join('/');

                if (bucketNameInUrl === PROFILE_PICTURE_BUCKET) {
                    console.log(`Attempting to delete old profile picture: ${oldFilePathInBucket} from bucket: ${bucketNameInUrl}`);
                    const { error: deleteError } = await supabase.storage
                        .from(PROFILE_PICTURE_BUCKET)
                        .remove([oldFilePathInBucket]);

                    if (deleteError) {
                        console.error(`Supabase Delete Old Profile Picture Error for ${oldFilePathInBucket}:`, deleteError);
                        throw new HttpError(`Failed to delete old profile picture from storage: ${deleteError.message}`, 500);
                    }
                    console.log(`Successfully deleted old profile picture: ${oldFilePathInBucket}`);
                } else {
                    console.warn(`Old profile picture URL's bucket '${bucketNameInUrl}' does not match expected bucket '${PROFILE_PICTURE_BUCKET}'. Skipping deletion: ${user.profilePicture}`);
                }
            } else {
                console.warn(`Could not parse old profile picture URL for deletion: ${user.profilePicture}`);
            }
        }

        // --- Step 2: Upload the new profile picture to Supabase Storage ---
        // Create a unique file name to avoid collisions
        const uniqueFileName = `${uuidv4()}-${originalFileName}`;
        // Define the path within your Supabase bucket (e.g., profile-pictures/user-id/unique-file-name.jpg)
        const supabaseFilePath = `${userId}/${uniqueFileName}`; // Store directly under user ID in the bucket

        console.log(`Attempting to upload new profile picture to ${PROFILE_PICTURE_BUCKET}/${supabaseFilePath}`);
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(PROFILE_PICTURE_BUCKET)
            .upload(supabaseFilePath, fileBuffer, {
                contentType: mimetype,
                upsert: false, // Prevents accidental overwrites if a file with exact same name is uploaded
            });

        if (uploadError) {
            console.error("Supabase Upload Profile Picture Error:", uploadError);
            throw new HttpError(`Failed to upload profile picture to storage: ${uploadError.message}`, 500);
        }
        console.log(`Successfully uploaded new profile picture to ${PROFILE_PICTURE_BUCKET}/${supabaseFilePath}`);


        // --- Step 3: Get the public URL for the newly uploaded file ---
        const { data: publicUrlData } = supabase.storage
            .from(PROFILE_PICTURE_BUCKET)
            .getPublicUrl(supabaseFilePath);

        const newProfilePictureUrl = publicUrlData?.publicUrl;

        if (!newProfilePictureUrl) {
            throw new HttpError("Failed to get public URL for new profile picture.", 500);
        }
        console.log(`New profile picture public URL: ${newProfilePictureUrl}`);

        // --- Step 4: Update the user's profilePicture field in the database ---
        user.profilePicture = newProfilePictureUrl;
        await user.save();
        console.log(`User ${userId} profile picture updated in DB to: ${newProfilePictureUrl}`);

        return user;
    } catch (error) {
        console.error("Error in uploadProfilePictureService:", error);
        throw error;
    }
};


/**
 * Deletes a user from the database by their ID.
 * Also deletes their associated profile picture from Supabase Storage.
 * @param id The ID of the user to delete.
 * @returns true if the user was successfully deleted.
 * @throws HttpError if the user is not found.
 */
export const deleteUserService = async (id: string) => {
    const PROFILE_PICTURE_BUCKET = 'profile-pictures'; // Define your Supabase bucket name

    try {
        const user = await User.findByPk(id) as any;
        if (!user) {
            throw new HttpError("User not found", 404);
        }

        // --- Delete profile picture from Supabase Storage upon user deletion ---
        if (user.profilePicture) {
            const urlParts = user.profilePicture.split('/');
            const publicIndex = urlParts.indexOf('public');

            if (publicIndex !== -1 && urlParts.length > publicIndex + 1) {
                const bucketNameInUrl = urlParts[publicIndex - 1];
                const filePathInBucket = urlParts.slice(publicIndex + 1).join('/');

                if (bucketNameInUrl === PROFILE_PICTURE_BUCKET) {
                    console.log(`Attempting to delete user ${id}'s profile picture: ${filePathInBucket}`);
                    const { error: deleteError } = await supabase.storage
                        .from(PROFILE_PICTURE_BUCKET)
                        .remove([filePathInBucket]);

                    if (deleteError) {
                        console.error(`Supabase Delete User Profile Picture Error for ${filePathInBucket}:`, deleteError);
                        // Log the error but don't prevent user deletion if storage delete fails
                        // You might want a more robust error handling strategy here (e.g., retry, dead-letter queue)
                    } else {
                        console.log(`Successfully deleted user ${id}'s profile picture: ${filePathInBucket}`);
                    }
                } else {
                    console.warn(`User ${id}'s profile picture URL's bucket '${bucketNameInUrl}' does not match expected bucket '${PROFILE_PICTURE_BUCKET}'. Skipping deletion: ${user.profilePicture}`);
                }
            } else {
                console.warn(`Could not parse user ${id}'s old profile picture URL for deletion: ${user.profilePicture}`);
            }
        }

        const result = await User.destroy({
            where: { id },
        });

        if (result === 0) {
            // This case should ideally be caught by findByPk check above, but as a fallback
            throw new HttpError("User not found", 404);
        }
        return true;
    } catch (error) {
        console.error("Error in deleteUserService:", error);
        throw error;
    }
};