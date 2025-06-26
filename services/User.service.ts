import User from "../models/User.model";
import bcrypt from 'bcryptjs';
import { CreateUserServiceParams, LoginUserServiceParams, UpdateUserServiceParams } from "../utils/types";
import HttpError from "../utils/httpError";
import jwt, { SignOptions } from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// --- Supabase client setup using environment variables ---
let supabaseClient;
try {
  console.log("[SUPABASE INIT] Attempting to initialize Supabase client...");
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error("[SUPABASE INIT ERROR] SUPABASE_URL is UNDEFINED. Please check your Codespace environment variables/secrets.");
  } else {
    console.log(`[SUPABASE INIT] SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`);
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
    console.error("[SUPABASE INIT ERROR] Supabase client NOT initialized due to missing environment variables.");
  }
} catch (error) {
  console.error("[SUPABASE INIT ERROR] Unexpected error during Supabase client initialization:", error);
  throw error;
}
const supabase = supabaseClient;

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
        // This is not a fatal error if Jitsi features are optional
        console.warn("Jitsi Private Key is not loaded. Jitsi-related features may not work.");
    }
} catch (error) {
    console.error("[Jitsi Init] Error loading Jitsi Private Key:", error);
}

/**
 * Creates a new user in the database.
 */
export const createUserService = async (params: CreateUserServiceParams) => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(params.password, salt);
    return User.create({
        ...params,
        password: passwordHash,
        role: params.designation,
    });
};

/**
 * Authenticates a user and returns their complete data profile and a JWT.
 */
export const loginUserService = async ({ email, password }: LoginUserServiceParams) => {
    const user = await User.findOne({
        where: { email },
        attributes: [
            'id', 'name', 'email', 'phone', 'role', 'profilePicture', 'password',
            'dateOfBirth', 'address', 'rollNo', 'collegeName', 'university', 'country'
        ]
    });
    if (!user) {
        throw new HttpError("User does not exist", 400);
    }
    const isPasswordMatch = await bcrypt.compare(password, user.get("password") as string);
    if (!isPasswordMatch) {
        throw new HttpError("Invalid password", 400);
    }

    const APP_SECRET_KEY: string = process.env.SECRET_KEY || 'default-secret-key';
    
    // JWT payload should be minimal for security and performance
    const jwtPayload = {
        id: user.get("id"),
        name: user.get("name"),
        email: user.get("email"),
        role: user.get("role"),
    };
    
    const jwtOptions: SignOptions = { expiresIn: '7d' };
    const token = jwt.sign(jwtPayload, APP_SECRET_KEY, jwtOptions);
    
    return { user: user.toJSON(), token };
};

/**
 * --- FIX 1: This new service fetches the fresh profile from the DB ---
 * This is called by the `getLoggedInUser` controller to solve the core bug.
 */
export const getProfileService = async (userId: string) => {
    const user = await User.findByPk(userId, {
        attributes: [
            'id', 'name', 'email', 'phone', 'role', 'profilePicture',
            'dateOfBirth', 'address', 'rollNo', 'collegeName', 'university', 'country'
        ]
    });
    if (!user) {
        throw new HttpError("User not found", 404);
    }
    return user;
};

/**
 * --- FIX 2: This service was accidentally removed and is now restored ---
 * Retrieves one user (if email is provided) or all users from the database.
 */
export const getUsersService = async (email?: string) => {
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
};

/**
 * Updates a user's information.
 */
export const updateUserService = async (id: string, updates: UpdateUserServiceParams) => {
    const user = await User.findByPk(id);
    if (!user) {
        throw new HttpError("User not found", 404);
    }
    Object.assign(user, updates);
    await user.save();
    return user;
};

/**
 * Uploads a profile picture to Supabase Storage and updates the user record.
 */
export const uploadProfilePictureService = async (userId: string, fileBuffer: Buffer, mimetype: string, originalFileName: string) => {
    const PROFILE_PICTURE_BUCKET = 'profile-pictures';
    if (!supabase) {
      throw new HttpError("Storage client is not initialized.", 500);
    }
    const user = await User.findByPk(userId);
    if (!user) {
        throw new HttpError("User not found", 404);
    }
    const oldPicture = user.get('profilePicture') as string | null;
    if (oldPicture) {
        try {
            const oldFilePath = oldPicture.split(`/${PROFILE_PICTURE_BUCKET}/`)[1];
            if (oldFilePath) {
                await supabase.storage.from(PROFILE_PICTURE_BUCKET).remove([oldFilePath]);
            }
        } catch (e) {
            console.error("Failed to delete old profile picture, continuing upload...", e);
        }
    }
    const uniqueFileName = `${uuidv4()}-${originalFileName}`;
    const supabaseFilePath = `${userId}/${uniqueFileName}`;
    const { error: uploadError } = await supabase.storage
        .from(PROFILE_PICTURE_BUCKET)
        .upload(supabaseFilePath, fileBuffer, { contentType: mimetype, upsert: false });
    if (uploadError) {
        throw new HttpError(`Failed to upload profile picture: ${uploadError.message}`, 500);
    }
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
 * Deletes a user.
 */
export const deleteUserService = async (id: string) => {
    const user = await User.findByPk(id);
    if (!user) {
        throw new HttpError("User not found", 404);
    }
    // Add logic to delete profile picture from storage here...
    await user.destroy();
    return true;
};
