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
const generateDeviceToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
const getDeviceInfo = (req: any): string => {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const platform = req.headers['x-platform'] || 'Unknown';
  const deviceModel = req.headers['x-device-model'] || 'Unknown';
  return `${platform} - ${deviceModel} - ${userAgent.substring(0, 100)}`;
};
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

    // Determine the role, defaulting to 'student' if not provided or invalid
    let userRole = params.designation; // Assuming 'designation' from form maps to 'role'
    if (!userRole || (userRole !== 'teacher' && userRole !== 'student' && userRole !== 'admin')) {
        userRole = 'student'; // Default role
    }

    // Determine initial status based on role
    let initialStatus: 'pending' | 'approved' | 'rejected';
    if (userRole === 'teacher') {
        initialStatus = 'pending'; // Teachers require approval
    } else {
        initialStatus = 'approved'; // Students and Admins are approved by default
    }

    const newUser = await User.create({
        ...params,
        password: passwordHash,
        role: userRole, // Use the determined role
        status: initialStatus, // Set the initial status
    });

    // Removed: Email notification for pending status

    // Return a subset of user data, excluding sensitive info
    const userResponse = newUser.toJSON();
    delete userResponse.password; // Remove password hash
    delete userResponse.passwordResetToken;
    delete userResponse.passwordResetExpires;

    return {
        user: userResponse,
        message: initialStatus === 'pending'
            ? 'Account created successfully. Your teacher account is awaiting admin approval.'
            : 'Account created successfully. You can now log in.'
    };
};

/**
 * Authenticates a user and returns their complete data profile and a JWT.
 */
export const loginUserService = async (
  { email, password }: LoginUserServiceParams,
  req?: any // Pass the request object to get device info
) => {
  const user = await User.findOne({
    where: { email },
    attributes: [
      'id', 'name', 'email', 'phone', 'role', 'profilePicture', 'password', 'status',
      'dateOfBirth', 'address', 'rollNo', 'collegeName', 'university', 'country',
      // 🚨 FIX: Must include device fields to ensure update works properly
      'deviceToken', 
      'deviceId' 
    ]
  });

  if (!user) {
    throw new HttpError("User does not exist", 400);
  }

  const isPasswordMatch = await bcrypt.compare(password, user.get("password") as string);
  if (!isPasswordMatch) {
    throw new HttpError("Invalid password", 400);
  }

  // Check user status
  const userStatus = user.get('status');
  if (userStatus === 'pending') {
    throw new HttpError("Your account is awaiting admin approval. Please check back later.", 403);
  }
  if (userStatus === 'rejected') {
    throw new HttpError("Your account has been rejected. Please contact support.", 403);
  }

  // === GENERATE NEW DEVICE TOKEN ===
  const newDeviceToken = generateDeviceToken();
  const deviceId = req?.headers['x-device-id'] as string | undefined;
  const deviceInfo = req ? getDeviceInfo(req) : 'Unknown Device';

  // Update user with new device token (invalidates old sessions)
  // This update should now successfully write the data to the DB
  await user.update({
    deviceToken: newDeviceToken,
    deviceId: deviceId || null,
    lastLoginAt: new Date(),
    lastLoginDevice: deviceInfo
  });

  console.log(`User ${email} logged in. New device token issued. Old sessions invalidated.`);

  // Generate JWT
  const APP_SECRET_KEY: string = process.env.SECRET_KEY || 'default-secret-key';
  const jwtPayload = {
    id: user.get("id"),
    name: user.get("name"),
    email: user.get("email"),
    role: user.get("role"),
    status: user.get("status"),
  };
  const jwtOptions: SignOptions = { expiresIn: '7d' };
  const token = jwt.sign(jwtPayload, APP_SECRET_KEY, jwtOptions);

  // Prepare user response
  const userResponse = user.toJSON();
  delete userResponse.password;
  delete userResponse.passwordResetToken;
  delete userResponse.passwordResetExpires;

  return {
    user: userResponse,
    token,
    deviceToken: newDeviceToken // Send device token to client
  };
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
    
    // ✅ USE WEB URL (not deep link)
    const resetUrl = `${process.env.BACKEND_URL}/user/reset-password?token=${resetToken}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .button { 
                  display: inline-block;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white !important;
                  padding: 14px 28px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  margin: 20px 0;
              }
              .footer { font-size: 12px; color: #666; margin-top: 30px; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Password Reset Request</h1>
              <p>Hi there,</p>
              <p>You requested to reset your password for your ProfVet account.</p>
              <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
              
              <a href="${resetUrl}" class="button">Reset My Password</a>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
                  ${resetUrl}
              </p>
              
              <div class="footer">
                  <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                  <p>This link will expire in 1 hour for security reasons.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    try {
        await sendEmail({
            to: user.get("email") as string,
            subject: 'Reset Your ProfVet Password',
            html: emailHtml,
        });
    } catch (error) {
        console.error(`[PASS RESET] Failed to send email to ${email}. Error:`, error);
    }

    return { message: "If a user with that email exists, a password reset link has been sent." };
};
export const resetPasswordService = async (token: string, newPassword: string) => {
    // Hash the token to match database
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Find user with matching token
    const user = await User.findOne({
        where: {
            passwordResetToken: hashedToken,
        }
    });
    
    // Check if token exists and hasn't expired
    const now = new Date();
    if (!user) {
        throw new HttpError(
            "Password reset token is invalid.", 
            400
        );
    }
    
    if ((user as any).passwordResetExpires < now) {
        // Clear expired token
        (user as any).passwordResetToken = null;
        (user as any).passwordResetExpires = null;
        await user.save();
        
        throw new HttpError(
            "Password reset token has expired. Please request a new one.", 
            400
        );
    }
    
    // Validate new password strength
    if (newPassword.length < 8) {
        throw new HttpError("Password must be at least 8 characters long.", 400);
    }
    
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        throw new HttpError(
            "Password must contain uppercase, lowercase, and numbers.", 
            400
        );
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update user password and clear reset token
    user.set('password', passwordHash);
    user.set('passwordResetToken', null);
    user.set('passwordResetExpires', null);
    
    await user.save();

    console.log(`[PASS RESET] Password successfully reset for user: ${user.get('email')}`);

    // Optional: Send confirmation email
    try {
        await sendEmail({
            to: user.get("email") as string,
            subject: ' Your ProfVet Password Has Been Changed',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Changed Successfully</h2>
                    <p>Your ProfVet account password was just changed.</p>
                    <p>If you did not make this change, please contact support immediately.</p>
                    <p style="margin-top: 30px; color: #666; font-size: 12px;">
                        This is an automated message. Please do not reply.
                    </p>
                </div>
            `,
        });
    } catch (emailError) {
        console.error('[PASS RESET] Failed to send confirmation email:', emailError);
        // Don't throw error - password was already reset successfully
    }

    return { 
        message: "Password has been successfully reset. You can now login with your new password." 
    };
};


/**
 * Fetches a user's profile from the database.
 */
export const getProfileService = async (userId: string) => {
    const user = await User.findByPk(userId, {
        attributes: [
            'id', 'name', 'email', 'phone', 'role', 'profilePicture', 'status', // Include status
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
        'id', 'name', 'email', 'phone', 'role', 'profilePicture', 'status', // Include status
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
export const updateUserService = async (id: string, updates: UpdateUserServiceParams) => {
    const user = await User.findByPk(id);
    if (!user) {
        throw new HttpError("User not found", 404);
    }

    // If a new password is being provided, hash it
    if (updates.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(updates.password, salt);
    }

    // IMPORTANT: Direct role/status changes via this general update service should be carefully considered.
    // Ideally, role and especially status changes (like approval) should have dedicated admin-only services.
    // If `updates.role` is provided, ensure it's a valid role ('student', 'teacher', 'admin')
    // and if the role is changed to 'teacher', consider setting status to 'pending'
    if (updates.role && !['student', 'teacher', 'admin'].includes(updates.role)) {
        throw new HttpError("Invalid role provided for update.", 400);
    }

    // If role is updated to 'teacher' and user is not already pending/approved, set to pending.
    // This is a safety net; the primary registration logic handles initial status.
    if (updates.role === 'teacher' && user.get('status') === 'approved' && user.get('role') !== 'teacher') {
         // If a student is being updated to a teacher, they should go into pending.
         // This assumes student->teacher changes require re-approval.
         // Adjust this logic based on your specific business rules.
        (updates as any).status = 'pending';
    }


    Object.assign(user, updates);
    await user.save();

    // Ensure password is not returned in the user object
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.passwordResetToken;
    delete userResponse.passwordResetExpires;

    return userResponse;
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
export const googleSignInService = async (idToken: string, req?: any) => {
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
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(randomPassword, salt);

        const initialRole = 'student';
        const initialStatus = 'approved';

        user = await User.create({
            name,
            email,
            password: passwordHash,
            profilePicture: picture,
            role: initialRole,
            status: initialStatus,
            phone: null,
            dateOfBirth: null,
            address: '',
            rollNo: '',
            collegeName: '',
            university: '',
            country: '',
        });
    } else {
        // Update existing user
        if (picture && user.get('profilePicture') !== picture) {
            user.set('profilePicture', picture);
        }
        if (user.get('status') !== 'approved') {
            user.set('status', 'approved');
        }
        await user.save();
    }

    // === GENERATE DEVICE TOKEN FOR GOOGLE LOGIN ===
    const newDeviceToken = generateDeviceToken();
    const deviceId = req?.headers['x-device-id'] as string | undefined;
    const deviceInfo = req ? getDeviceInfo(req) : 'Unknown Device (Google Login)';

    await user.update({
        deviceToken: newDeviceToken,
        deviceId: deviceId || null,
        lastLoginAt: new Date(),
        lastLoginDevice: deviceInfo
    });

    console.log(`User ${email} logged in via Google. Device token issued.`);

    // Generate JWT
    const APP_SECRET_KEY: string = process.env.SECRET_KEY || 'default-secret-key';
    const jwtPayload = {
        id: user.get("id"),
        name: user.get("name"),
        email: user.get("email"),
        role: user.get("role"),
        status: user.get("status"),
    };
    const jwtOptions: SignOptions = { expiresIn: '7d' };
    const token = jwt.sign(jwtPayload, APP_SECRET_KEY, jwtOptions);

    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.passwordResetToken;
    delete userResponse.passwordResetExpires;

    return { 
        user: userResponse, 
        token,
        deviceToken: newDeviceToken // Send device token to client
    };
};


/**
 * --- NEW SERVICE ---
 * Handles user sign-in or registration via a Facebook Access Token.
 * @param accessToken The access token received from the Facebook Login flow on the client.
 */
export const facebookSignInService = async (accessToken: string, req?: any) => {
    let facebookUserData;
    try {
        const { data } = await axios.get(
            `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
        );
        facebookUserData = data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Axios Error calling Facebook Graph API:", JSON.stringify(error.response?.data, null, 2));
            const fbError = error.response?.data?.error;
            const errorMessage = fbError?.message || "Failed to validate Facebook token with Graph API.";
            throw new HttpError(errorMessage, 400);
        } else {
            console.error("Non-Axios Error in facebookSignInService:", error);
            throw new HttpError("An unexpected server error occurred during Facebook validation.", 500);
        }
    }

    if (!facebookUserData || !facebookUserData.email) {
        throw new HttpError("Invalid Facebook token or email permission was not granted.", 401);
    }

    const { email, name } = facebookUserData;
    const picture = facebookUserData.picture?.data?.url;

    let user = await User.findOne({ where: { email } });

    if (!user) {
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(randomPassword, salt);

        const initialRole = 'student';
        const initialStatus = 'approved';

        user = await User.create({
            name,
            email,
            password: passwordHash,
            profilePicture: picture,
            role: initialRole,
            status: initialStatus,
            phone: null,
            dateOfBirth: null,
            address: '',
            rollNo: '',
            collegeName: '',
            university: '',
            country: '',
        });
    } else {
        if (picture && user.get('profilePicture') !== picture) {
            user.set('profilePicture', picture);
        }
        if (user.get('status') !== 'approved') {
            user.set('status', 'approved');
        }
        await user.save();
    }

    // === GENERATE DEVICE TOKEN FOR FACEBOOK LOGIN ===
    const newDeviceToken = generateDeviceToken();
    const deviceId = req?.headers['x-device-id'] as string | undefined;
    const deviceInfo = req ? getDeviceInfo(req) : 'Unknown Device (Facebook Login)';

    await user.update({
        deviceToken: newDeviceToken,
        deviceId: deviceId || null,
        lastLoginAt: new Date(),
        lastLoginDevice: deviceInfo
    });

    console.log(`User ${email} logged in via Facebook. Device token issued.`);

    // Generate JWT
    const APP_SECRET_KEY: string = process.env.SECRET_KEY || 'default-secret-key';
    const jwtPayload = {
        id: user.get("id"),
        name: user.get("name"),
        email: user.get("email"),
        role: user.get("role"),
        status: user.get("status"),
    };
    const jwtOptions: SignOptions = { expiresIn: '7d' };
    const token = jwt.sign(jwtPayload, APP_SECRET_KEY, jwtOptions);

    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.passwordResetToken;
    delete userResponse.passwordResetExpires;

    return { 
        user: userResponse, 
        token,
        deviceToken: newDeviceToken // Send device token to client
    };
};

export const getPendingTeachersService = async () => {
    // You should have middleware in your route to ensure only admins can call this.
    const pendingTeachers = await User.findAll({
        where: {
            role: 'teacher',
            status: 'pending'
        },
        attributes: [
            'id', 'name', 'email', 'phone', 'role', 'status',
            'dateOfBirth', 'address', 'rollNo', 'collegeName', 'university', 'country',
            'createdAt' // Useful for admins to see when the application was submitted
        ],
        order: [['createdAt', 'ASC']] // Order by creation date, oldest first
    });
    return pendingTeachers;
};

/**
 * Approves a teacher's account.
 * This should only be accessible by users with the 'admin' role.
 */
export const approveTeacherService = async (teacherId: string) => {
    const teacher = await User.findByPk(teacherId);

    if (!teacher) {
        throw new HttpError("Teacher not found.", 404);
    }

    if (teacher.get('role') !== 'teacher') {
        throw new HttpError("User is not a teacher.", 400);
    }

    if (teacher.get('status') === 'approved') {
        throw new HttpError("Teacher account is already approved.", 400);
    }

    await teacher.update({ status: 'approved' });

    // Removed: Send Approval Email

    return teacher; // Return the updated teacher object
};

/**
 * Rejects a teacher's account.
 * This should only be accessible by users with the 'admin' role.
 */
export const rejectTeacherService = async (teacherId: string, reason?: string) => {
    const teacher = await User.findByPk(teacherId);

    if (!teacher) {
        throw new HttpError("Teacher not found.", 404);
    }

    if (teacher.get('role') !== 'teacher') {
        throw new HttpError("User is not a teacher.", 400);
    }

    if (teacher.get('status') === 'rejected') {
        throw new HttpError("Teacher account is already rejected.", 400);
    }

    await teacher.update({ status: 'rejected' });

    // Removed: Send Rejection Email

    return teacher; // Return the updated teacher object
};