import User from "../models/User.model";
import bcrypt from 'bcryptjs';
import { CreateUserServiceParams, LoginUserServiceParams, UpdateUserServiceParams } from "../utils/types";
import HttpError from "../utils/httpError";
import jwt, { SignOptions } from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { sendEmail } from '../utils/email'; //  --- IMPORT THE EMAIL SERVICE
import { OAuth2Client } from 'google-auth-library'; //  --- FIX: Import OAuth2Client
import axios from 'axios'; 

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
 * --- UPDATED SERVICE ---
 * Generates a password reset token and sends it to the user's email via SendGrid.
 */
export const forgotPasswordService = async (email: string) => {
    const user = await User.findOne({ where: { email } });

    if (!user) {
        console.log(`[PASS RESET] Request for non-existent user: ${email}`);
        return { message: "If a user with that email exists, a password reset link has been sent." };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

    (user as any).passwordResetToken = passwordResetToken;
    (user as any).passwordResetExpires = passwordResetExpires;
    await user.save();
    
    // --- 📧 SEND THE EMAIL ---
    // This URL should point to the page in your frontend application where users can enter their new password.
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const emailHtml = `
      <h1>You requested a password reset</h1>
      <p>Click the link below to set a new password. This link will expire in 1 hour.</p>
      <a href="${resetUrl}" target="_blank" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Reset Your Password</a>
      <p>If you did not request a password reset, please ignore this email.</p>
    `;

    try {
        await sendEmail({
            to: user.get("email") as string,
            subject: 'Your Password Reset Request',
            html: emailHtml,
        });
    } catch (error) {
        console.error(`[PASS RESET] Failed to send email to ${email}. Error:`, error);
        // Do not throw an error to the client to avoid leaking user information.
    }

    return { message: "If a user with that email exists, a password reset link has been sent." };
};

/**
 * Resets a user's password using a valid reset token.
 */
export const resetPasswordService = async (token: string, newPassword: string) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        where: {
            passwordResetToken: hashedToken,
        }
    });
    
    const now = new Date();
    if (!user || (user as any).passwordResetExpires < now) {
        throw new HttpError("Password reset token is invalid or has expired.", 400);
    }
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    user.set('password', passwordHash);
    user.set('passwordResetToken', null);
    user.set('passwordResetExpires', null);
    
    await user.save();

    return { message: "Password has been successfully reset." };
};


/**
 * Fetches a user's profile from the database.
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

export const googleSignInService = async (idToken: string) => {
    // You must add your Google Client ID to your environment variables
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
        throw new HttpError("Invalid Google token or email missing.", 401);
    }

    const { email, name, picture } = payload;

    // Check if user already exists
    let user = await User.findOne({ where: { email } });

    if (!user) {
        // User doesn't exist, create a new one
        // Note: A random password is created because the field is required in your model,
        // but it won't be used for login since they'll use Google Sign-In.
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(randomPassword, salt);

        user = await User.create({
            name,
            email,
            password: passwordHash,
            profilePicture: picture,
            role: 'Student', // Assign a default role
            // Fill other required fields with defaults or leave them null if your DB allows
            phone: '',
            dateOfBirth: new Date(),
            address: '',
            rollNo: '',
            collegeName: '',
            university: '',
            country: '',
            designation: 'Student', // Ensure all required fields are present
        });
    }

    // User exists or was just created, now issue our app's JWT
    const APP_SECRET_KEY: string = process.env.SECRET_KEY || 'default-secret-key';
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
 * --- NEW SERVICE ---
 * Handles user sign-in or registration via a Facebook Access Token.
 * @param accessToken The access token received from the Facebook Login flow on the client.
 */
export const facebookSignInService = async (accessToken: string) => {
    const { data } = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
    );

    if (!data || !data.email) {
        throw new HttpError("Invalid Facebook token or email missing.", 401);
    }

    const { email, name } = data;
    const picture = data.picture?.data?.url;

    // Check if user already exists
    let user = await User.findOne({ where: { email } });

    if (!user) {
        // User doesn't exist, create a new one
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(randomPassword, salt);

        user = await User.create({
            name,
            email,
            password: passwordHash,
            profilePicture: picture,
            role: 'Student', // Assign a default role
            phone: '',
            dateOfBirth: new Date(),
            address: '',
            rollNo: '',
            collegeName: '',
            university: '',
            country: '',
            designation: 'Student', // Ensure all required fields are present
        });
    }

    // User exists or was just created, issue our app's JWT
    const APP_SECRET_KEY: string = process.env.SECRET_KEY || 'default-secret-key';
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