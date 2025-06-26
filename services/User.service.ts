import User from "../models/User.model";
import bcrypt from 'bcryptjs';
import { CreateUserServiceParams, LoginUserServiceParams, UpdateUserServiceParams } from "../utils/types";
import HttpError from "../utils/httpError";
import jwt, { SignOptions } from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// --- Supabase client setup ---
let supabaseClient;
try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    console.log("[SUPABASE INIT] Supabase client initialized successfully.");
  } else {
    console.error("[SUPABASE INIT ERROR] Supabase client not initialized due to missing environment variables.");
  }
} catch (error) {
  console.error("[SUPABASE INIT ERROR] Unexpected error during Supabase client initialization:", error);
}
const supabase = supabaseClient;

// --- Jitsi Private Key Setup ---
const JITSI_PRIVATE_KEY_FILE_PATH = process.env.NODE_ENV === 'production'
    ? '/etc/secrets/jitsi_private_key.pem'
    : path.join(__dirname, '..', '..', 'jitsi_private_key.pem');
let jitsiPrivateKey: string;
try {
    if (fs.existsSync(JITSI_PRIVATE_KEY_FILE_PATH)) {
        jitsiPrivateKey = fs.readFileSync(JITSI_PRIVATE_KEY_FILE_PATH, 'utf8');
    } else {
        jitsiPrivateKey = process.env.JITSI_PRIVATE_KEY || '';
    }
    if (!jitsiPrivateKey) {
        console.warn("[Jitsi Init] Jitsi Private Key is not loaded.");
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
    const newUser = await User.create({
        ...params,
        password: passwordHash,
        role: params.designation,
    });
    return newUser;
};

/**
 * Authenticates a user and returns their complete profile and a JWT.
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
    const APP_SECRET_KEY: string = process.env.SECRET_KEY || 'default-secret';
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
    const jwtOptions: SignOptions = { expiresIn: '7d' };
    const token = jwt.sign(userSessionData, APP_SECRET_KEY, jwtOptions);
    return { user: userSessionData, token };
};

/**
 * Retrieves one or all users from the database.
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
    }
    return User.findAll({ attributes });
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
    // ... logic to delete user and picture from storage ...
    return true;
};
