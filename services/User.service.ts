// src/services/User.service.ts

import User from "../models/User.model";
import bcrypt from 'bcryptjs';
import { CreateUserServiceParams, LoginUserServiceParams, UpdateUserServiceParams } from "../utils/types"; // This file should be updated as per the artifact
import HttpError from "../utils/httpError";
import jwt, { SignOptions } from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js'; // Import createClient
import { v4 as uuidv4 } from 'uuid'; // Import uuid


// --- Supabase client setup using environment variables ---
let supabaseClient; // Declare a mutable variable for the client

try {
  console.log("[SUPABASE INIT] Attempting to initialize Supabase client...");
  const supabaseUrl = process.env.SUPABASE_URL; // Get URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Get Service Role Key

  if (!supabaseUrl) {
    console.error("[SUPABASE INIT ERROR] SUPABASE_URL is UNDEFINED. Please check your Codespace environment variables/secrets.");
  } else {
    console.log(`[SUPABASE INIT] SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`); // Log partial URL for safety
  }

  if (!supabaseKey) {
    console.error("[SUPABASE INIT ERROR] SUPABASE_SERVICE_ROLE_KEY is UNDEFINED. Please check your Codespace environment variables/secrets.");
  } else {
    console.log("[SUPABASE INIT] SUPABASE_SERVICE_ROLE_KEY is present.");
  }

  if (supabaseUrl && supabaseKey) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
    console.log("[SUPABASE INIT] Supabase client initialized SUCCESSFULLY.");
  } else {
    console.error("[SUPABASE INIT ERROR] Supabase client NOT initialized due to missing environment variables. Supabase-dependent features (like profile picture upload/deletion) will fail.");
  }
} catch (error) {
  console.error("[SUPABASE INIT ERROR] Unexpected error during Supabase client initialization:", error);
  throw error;
}

const supabase = supabaseClient; // Use this const for consistency


// --- Jitsi Private Key Setup ---
const JITSI_PRIVATE_KEY_FILE_PATH = process.env.NODE_ENV === 'production'
    ? '/etc/secrets/jitsi_private_key.pem' // Render's path for Secret Files
    : path.join(__dirname, '..', '..', 'jitsi_private_key.pem'); // Local dev path

let jitsiPrivateKey: string;

try {
    if (!fs.existsSync(JITSI_PRIVATE_KEY_FILE_PATH)) {
        jitsiPrivateKey = process.env.JITSI_PRIVATE_KEY || '';
        if (!jitsiPrivateKey) {
            console.warn(`[Jitsi Init] Jitsi private key file not found at ${JITSI_PRIVATE_KEY_FILE_PATH} and JITSI_PRIVATE_KEY env var is empty.`);
        } else {
            console.log("[Jitsi Init] Jitsi Private Key loaded from environment variable.");
        }
    } else {
        jitsiPrivateKey = fs.readFileSync(JITSI_PRIVATE_KEY_FILE_PATH, 'utf8');
        console.log("[Jitsi Init] Jitsi Private Key loaded successfully from secret file.");
    }
    if (!jitsiPrivateKey) {
        throw new Error("Jitsi Private Key is not loaded. Configure it in Render's Secret Files or as an environment variable.");
    }
} catch (error) {
    console.error("[Jitsi Init] Error loading Jitsi Private Key:", error);
    throw error;
}

/**
 * Creates a new user in the database with all fields from the registration form.
 */
export const createUserService = async ({
    name,
    email,
    phone,
    password,
    dateOfBirth,
    address,
    rollNo,
    collegeName,
    university,
    country,
    designation,
}: CreateUserServiceParams) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newUser = await User.create({
            name,
            email,
            password: passwordHash,
            phone,
            role: designation, // Map designation from form to the role field
            dateOfBirth,
            address,
            rollNo,
            collegeName,
            university,
            country,
        });
        return newUser;
    } catch (error) {
        throw error;
    }
}

/**
 * Authenticates a user and returns their complete data profile and a JWT.
 */
export const loginUserService = async ({ email, password }: LoginUserServiceParams) => {
    try {
        console.log(`[LOGIN SERVICE DEBUG] Starting login attempt for email: ${email}`);

        const user = await User.findOne({
            where: { email },
            // Ensure all new and existing attributes are fetched
            attributes: [
                'id', 'name', 'email', 'phone', 'role', 'profilePicture', 'password',
                'dateOfBirth', 'address', 'rollNo', 'collegeName', 'university', 'country'
            ]
        });

        if (!user) {
            console.log(`[LOGIN SERVICE DEBUG] User not found for email: ${email}`);
            throw new HttpError("User does not exist", 400);
        }

        const isPasswordMatch = await bcrypt.compare(password, user.get("password") as string);

        if (!isPasswordMatch) {
            console.log(`[LOGIN SERVICE DEBUG] Password mismatch for email: ${user.get("email")}`);
            throw new HttpError("Invalid password", 400);
        }

        const APP_SECRET_KEY: string = process.env.SECRET_KEY || 'cleanclean';
        
        // Prepare the complete user data object for the session and response
        const userSessionData = {
            id: user.get("id"),
            name: user.get("name"),
            email: user.get("email"),
            phone: user.get("phone"),
            role: user.get("role"),
            profilePicture: user.get("profilePicture"),
            dateOfBirth: user.get("dateOfBirth"),
            address: user.get("address"),
            rollNo: user.get("rollNo"),
            collegeName: user.get("collegeName"),
            university: user.get("university"),
            country: user.get("country"),
        };

        const jwtOptions: SignOptions = {
            expiresIn: 604800 // 7 days
        };

        const token = jwt.sign(userSessionData, APP_SECRET_KEY, jwtOptions);
        return { user: userSessionData, token };
    } catch (error) {
        console.error(`[LOGIN SERVICE ERROR] Failed login for email: ${email}. Error:`, error);
        throw error;
    }
};

/**
 * Retrieves one or all users from the database, including all detailed fields.
 */
export const getUsersService = async (email?: string) => {
    try {
        const attributes = [
            'id', 'name', 'email', 'phone', 'role', 'profilePicture',
            'dateOfBirth', 'address', 'rollNo', 'collegeName', 'university', 'country'
        ];
        if (email) {
            const user = await User.findOne({ where: { email }, attributes });
            if (!user) {
                throw new HttpError("User does not exist", 404);
            }
            return user;
        } else {
            return await User.findAll({ attributes });
        }
    } catch (error) {
        throw error;
    }
}


/**
 * Updates a user's information.
 */
export const updateUserService = async (id: string, updates: UpdateUserServiceParams) => {
    try {
        const user = await User.findByPk(id);
        if (!user) {
            throw new HttpError("User not found", 404);
        }
        // Dynamically assign updates to the user model instance
        Object.assign(user, updates);
        await user.save();
        return user;
    } catch (error) {
        throw error;
    }
};

/**
 * Uploads a profile picture to Supabase Storage and updates the user record.
 */
export const uploadProfilePictureService = async (userId: string, fileBuffer: Buffer, mimetype: string, originalFileName: string) => {
    const PROFILE_PICTURE_BUCKET = 'profile-pictures';

    if (!supabase) {
      throw new HttpError("Supabase client is not initialized. Cannot upload profile picture.", 500);
    }

    const user = await User.findByPk(userId);
    if (!user) {
        throw new HttpError("User not found", 404);
    }

    // Delete old picture if it exists
    const oldPicture = user.get('profilePicture') as string | null;
    if (oldPicture) {
        try {
            const urlParts = oldPicture.split('/');
            const oldFilePath = urlParts.slice(urlParts.indexOf(PROFILE_PICTURE_BUCKET) + 1).join('/');
            if (oldFilePath) {
                await supabase.storage.from(PROFILE_PICTURE_BUCKET).remove([oldFilePath]);
            }
        } catch (e) {
            console.error("Failed to delete old profile picture, continuing upload...", e);
        }
    }

    // Upload new picture
    const uniqueFileName = `${uuidv4()}-${originalFileName}`;
    const supabaseFilePath = `${userId}/${uniqueFileName}`;
    const { error: uploadError } = await supabase.storage
        .from(PROFILE_PICTURE_BUCKET)
        .upload(supabaseFilePath, fileBuffer, { contentType: mimetype, upsert: false });

    if (uploadError) {
        throw new HttpError(`Failed to upload profile picture: ${uploadError.message}`, 500);
    }

    // Get public URL and update user record
    const { data: publicUrlData } = supabase.storage.from(PROFILE_PICTURE_BUCKET).getPublicUrl(supabaseFilePath);
    const newProfilePictureUrl = publicUrlData?.publicUrl;

    if (!newProfilePictureUrl) {
        throw new HttpError("Failed to get public URL for the new profile picture.", 500);
    }

    (user as any).profilePicture = newProfilePictureUrl;
    await user.save();
    return user;
};


/**
 * Deletes a user and their profile picture from Supabase Storage.
 */
export const deleteUserService = async (id: string) => {
    const PROFILE_PICTURE_BUCKET = 'profile-pictures';

    const user = await User.findByPk(id);
    if (!user) {
        throw new HttpError("User not found", 404);
    }

    // Delete profile picture from Supabase if it exists and the client is available
    const pictureToDelete = user.get('profilePicture') as string | null;
    if (pictureToDelete && supabase) {
        try {
            const urlParts = pictureToDelete.split('/');
            const filePath = urlParts.slice(urlParts.indexOf(PROFILE_PICTURE_BUCKET) + 1).join('/');
            if (filePath) {
               await supabase.storage.from(PROFILE_PICTURE_BUCKET).remove([filePath]);
            }
        } catch(e) {
            console.error("Failed to delete profile picture from storage, continuing user deletion...", e);
        }
    }

    const result = await User.destroy({ where: { id } });
    if (result === 0) {
        throw new HttpError("User not found during deletion", 404);
    }
    return true;
};
