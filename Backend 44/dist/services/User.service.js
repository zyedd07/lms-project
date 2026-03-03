"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectTeacherService = exports.approveTeacherService = exports.getPendingTeachersService = exports.facebookSignInService = exports.googleSignInService = exports.deleteUserService = exports.uploadProfilePictureService = exports.updateUserService = exports.getUsersService = exports.getProfileService = exports.resetPasswordService = exports.forgotPasswordService = exports.loginUserService = exports.createUserService = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const supabase_js_1 = require("@supabase/supabase-js");
const uuid_1 = require("uuid");
const crypto = __importStar(require("crypto"));
const email_1 = require("../utils/email"); //  --- IMPORT THE EMAIL SERVICE
const google_auth_library_1 = require("google-auth-library"); //  --- FIX: Import OAuth2Client
const axios_1 = __importDefault(require("axios"));
// --- Supabase client setup using environment variables ---
let supabaseClient;
try {
    console.log("[SUPABASE INIT] Attempting to initialize Supabase client...");
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl) {
        console.error("[SUPABASE INIT ERROR] SUPABASE_URL is UNDEFINED. Please check your Codespace environment variables/secrets.");
    }
    else {
        console.log(`[SUPABASE INIT] SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`);
    }
    if (!supabaseKey) {
        console.error("[SUPABASE INIT ERROR] SUPABASE_SERVICE_ROLE_KEY is UNDEFINED. Please check your Codespace environment variables/secrets.");
    }
    else {
        console.log("[SUPABASE INIT] SUPABASE_SERVICE_ROLE_KEY is present.");
    }
    if (supabaseUrl && supabaseKey) {
        supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
            },
        });
        console.log("[SUPABASE INIT] Supabase client initialized SUCCESSFULLY.");
    }
    else {
        console.error("[SUPABASE INIT ERROR] Supabase client NOT initialized due to missing environment variables.");
    }
}
catch (error) {
    console.error("[SUPABASE INIT ERROR] Unexpected error during Supabase client initialization:", error);
    throw error;
}
const supabase = supabaseClient;
const generateDeviceToken = () => {
    return crypto.randomBytes(32).toString('hex');
};
const getDeviceInfo = (req) => {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const platform = req.headers['x-platform'] || 'Unknown';
    const deviceModel = req.headers['x-device-model'] || 'Unknown';
    return `${platform} - ${deviceModel} - ${userAgent.substring(0, 100)}`;
};
// --- Jitsi Private Key Setup ---
const JITSI_PRIVATE_KEY_FILE_PATH = process.env.NODE_ENV === 'production'
    ? '/etc/secrets/jitsi_private_key.pem' // Render's path for Secret Files
    : path.join(__dirname, '..', '..', 'jitsi_private_key.pem'); // Local dev path
let jitsiPrivateKey;
try {
    if (!fs.existsSync(JITSI_PRIVATE_KEY_FILE_PATH)) {
        jitsiPrivateKey = process.env.JITSI_PRIVATE_KEY || '';
        if (!jitsiPrivateKey) {
            console.warn(`[Jitsi Init] Jitsi private key file not found at ${JITSI_PRIVATE_KEY_FILE_PATH} and JITSI_PRIVATE_KEY env var is empty.`);
        }
        else {
            console.log("[Jitsi Init] Jitsi Private Key loaded from environment variable.");
        }
    }
    else {
        jitsiPrivateKey = fs.readFileSync(JITSI_PRIVATE_KEY_FILE_PATH, 'utf8');
        console.log("[Jitsi Init] Jitsi Private Key loaded successfully from secret file.");
    }
    if (!jitsiPrivateKey) {
        // This is not a fatal error if Jitsi features are optional
        console.warn("Jitsi Private Key is not loaded. Jitsi-related features may not work.");
    }
}
catch (error) {
    console.error("[Jitsi Init] Error loading Jitsi Private Key:", error);
}
/**
 * Creates a new user in the database.
 */
const createUserService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const salt = yield bcryptjs_1.default.genSalt(10);
    const passwordHash = yield bcryptjs_1.default.hash(params.password, salt);
    // Determine the role, defaulting to 'student' if not provided or invalid
    let userRole = params.designation; // Assuming 'designation' from form maps to 'role'
    if (!userRole || (userRole !== 'teacher' && userRole !== 'student' && userRole !== 'admin')) {
        userRole = 'student'; // Default role
    }
    // Determine initial status based on role
    let initialStatus;
    if (userRole === 'teacher') {
        initialStatus = 'pending'; // Teachers require approval
    }
    else {
        initialStatus = 'approved'; // Students and Admins are approved by default
    }
    const newUser = yield User_model_1.default.create(Object.assign(Object.assign({}, params), { password: passwordHash, role: userRole, status: initialStatus }));
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
});
exports.createUserService = createUserService;
/**
 * Authenticates a user and returns their complete data profile and a JWT.
 */
const loginUserService = (_a, req_1) => __awaiter(void 0, [_a, req_1], void 0, function* ({ email, password }, req // Pass the request object to get device info
) {
    const user = yield User_model_1.default.findOne({
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
        throw new httpError_1.default("User does not exist", 400);
    }
    const isPasswordMatch = yield bcryptjs_1.default.compare(password, user.get("password"));
    if (!isPasswordMatch) {
        throw new httpError_1.default("Invalid password", 400);
    }
    // Check user status
    const userStatus = user.get('status');
    if (userStatus === 'pending') {
        throw new httpError_1.default("Your account is awaiting admin approval. Please check back later.", 403);
    }
    if (userStatus === 'rejected') {
        throw new httpError_1.default("Your account has been rejected. Please contact support.", 403);
    }
    // === GENERATE NEW DEVICE TOKEN ===
    const newDeviceToken = generateDeviceToken();
    const deviceId = req === null || req === void 0 ? void 0 : req.headers['x-device-id'];
    const deviceInfo = req ? getDeviceInfo(req) : 'Unknown Device';
    // Update user with new device token (invalidates old sessions)
    // This update should now successfully write the data to the DB
    yield user.update({
        deviceToken: newDeviceToken,
        deviceId: deviceId || null,
        lastLoginAt: new Date(),
        lastLoginDevice: deviceInfo
    });
    console.log(`User ${email} logged in. New device token issued. Old sessions invalidated.`);
    // Generate JWT
    const APP_SECRET_KEY = process.env.SECRET_KEY || 'default-secret-key';
    const jwtPayload = {
        id: user.get("id"),
        name: user.get("name"),
        email: user.get("email"),
        role: user.get("role"),
        status: user.get("status"),
    };
    const jwtOptions = { expiresIn: '7d' };
    const token = jsonwebtoken_1.default.sign(jwtPayload, APP_SECRET_KEY, jwtOptions);
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
});
exports.loginUserService = loginUserService;
/**
 * --- UPDATED SERVICE ---
 * Generates a password reset token and sends it to the user's email via SendGrid.
 */
const forgotPasswordService = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_model_1.default.findOne({ where: { email } });
    if (!user) {
        console.log(`[PASS RESET] Request for non-existent user: ${email}`);
        return { message: "If a user with that email exists, a password reset link has been sent." };
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;
    yield user.save();
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
        yield (0, email_1.sendEmail)({
            to: user.get("email"),
            subject: 'Reset Your ProfVet Password',
            html: emailHtml,
        });
    }
    catch (error) {
        console.error(`[PASS RESET] Failed to send email to ${email}. Error:`, error);
    }
    return { message: "If a user with that email exists, a password reset link has been sent." };
});
exports.forgotPasswordService = forgotPasswordService;
const resetPasswordService = (token, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    // Hash the token to match database
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    // Find user with matching token
    const user = yield User_model_1.default.findOne({
        where: {
            passwordResetToken: hashedToken,
        }
    });
    // Check if token exists and hasn't expired
    const now = new Date();
    if (!user) {
        throw new httpError_1.default("Password reset token is invalid.", 400);
    }
    if (user.passwordResetExpires < now) {
        // Clear expired token
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        yield user.save();
        throw new httpError_1.default("Password reset token has expired. Please request a new one.", 400);
    }
    // Validate new password strength
    if (newPassword.length < 8) {
        throw new httpError_1.default("Password must be at least 8 characters long.", 400);
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        throw new httpError_1.default("Password must contain uppercase, lowercase, and numbers.", 400);
    }
    // Hash new password
    const salt = yield bcryptjs_1.default.genSalt(10);
    const passwordHash = yield bcryptjs_1.default.hash(newPassword, salt);
    // Update user password and clear reset token
    user.set('password', passwordHash);
    user.set('passwordResetToken', null);
    user.set('passwordResetExpires', null);
    yield user.save();
    console.log(`[PASS RESET] Password successfully reset for user: ${user.get('email')}`);
    // Optional: Send confirmation email
    try {
        yield (0, email_1.sendEmail)({
            to: user.get("email"),
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
    }
    catch (emailError) {
        console.error('[PASS RESET] Failed to send confirmation email:', emailError);
        // Don't throw error - password was already reset successfully
    }
    return {
        message: "Password has been successfully reset. You can now login with your new password."
    };
});
exports.resetPasswordService = resetPasswordService;
/**
 * Fetches a user's profile from the database.
 */
const getProfileService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_model_1.default.findByPk(userId, {
        attributes: [
            'id', 'name', 'email', 'phone', 'role', 'profilePicture', 'status', // Include status
            'dateOfBirth', 'address', 'rollNo', 'collegeName', 'university', 'country'
        ]
    });
    if (!user) {
        throw new httpError_1.default("User not found", 404);
    }
    return user;
});
exports.getProfileService = getProfileService;
/**
 * Retrieves one user (if email is provided) or all users from the database.
 */
const getUsersService = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const attributes = [
        'id', 'name', 'email', 'phone', 'role', 'profilePicture', 'status', // Include status
        'dateOfBirth', 'address', 'rollNo', 'collegeName', 'university', 'country'
    ];
    if (email) {
        const user = yield User_model_1.default.findOne({ where: { email }, attributes });
        if (!user) {
            throw new httpError_1.default("User does not exist", 404);
        }
        return user;
    }
    else {
        return yield User_model_1.default.findAll({ attributes });
    }
});
exports.getUsersService = getUsersService;
const updateUserService = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_model_1.default.findByPk(id);
    if (!user) {
        throw new httpError_1.default("User not found", 404);
    }
    // If a new password is being provided, hash it
    if (updates.password) {
        const salt = yield bcryptjs_1.default.genSalt(10);
        updates.password = yield bcryptjs_1.default.hash(updates.password, salt);
    }
    // IMPORTANT: Direct role/status changes via this general update service should be carefully considered.
    // Ideally, role and especially status changes (like approval) should have dedicated admin-only services.
    // If `updates.role` is provided, ensure it's a valid role ('student', 'teacher', 'admin')
    // and if the role is changed to 'teacher', consider setting status to 'pending'
    if (updates.role && !['student', 'teacher', 'admin'].includes(updates.role)) {
        throw new httpError_1.default("Invalid role provided for update.", 400);
    }
    // If role is updated to 'teacher' and user is not already pending/approved, set to pending.
    // This is a safety net; the primary registration logic handles initial status.
    if (updates.role === 'teacher' && user.get('status') === 'approved' && user.get('role') !== 'teacher') {
        // If a student is being updated to a teacher, they should go into pending.
        // This assumes student->teacher changes require re-approval.
        // Adjust this logic based on your specific business rules.
        updates.status = 'pending';
    }
    Object.assign(user, updates);
    yield user.save();
    // Ensure password is not returned in the user object
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.passwordResetToken;
    delete userResponse.passwordResetExpires;
    return userResponse;
});
exports.updateUserService = updateUserService;
/**
 * Uploads a profile picture to Supabase Storage and updates the user record.
 */
const uploadProfilePictureService = (userId, fileBuffer, mimetype, originalFileName) => __awaiter(void 0, void 0, void 0, function* () {
    const PROFILE_PICTURE_BUCKET = 'profile-pictures';
    if (!supabase) {
        throw new httpError_1.default("Storage client is not initialized.", 500);
    }
    const user = yield User_model_1.default.findByPk(userId);
    if (!user) {
        throw new httpError_1.default("User not found", 404);
    }
    const oldPicture = user.get('profilePicture');
    if (oldPicture) {
        try {
            const oldFilePath = oldPicture.split(`/${PROFILE_PICTURE_BUCKET}/`)[1];
            if (oldFilePath) {
                yield supabase.storage.from(PROFILE_PICTURE_BUCKET).remove([oldFilePath]);
            }
        }
        catch (e) {
            console.error("Failed to delete old profile picture, continuing upload...", e);
        }
    }
    const uniqueFileName = `${(0, uuid_1.v4)()}-${originalFileName}`;
    const supabaseFilePath = `${userId}/${uniqueFileName}`;
    const { error: uploadError } = yield supabase.storage
        .from(PROFILE_PICTURE_BUCKET)
        .upload(supabaseFilePath, fileBuffer, { contentType: mimetype, upsert: false });
    if (uploadError) {
        throw new httpError_1.default(`Failed to upload profile picture: ${uploadError.message}`, 500);
    }
    const { data: publicUrlData } = supabase.storage.from(PROFILE_PICTURE_BUCKET).getPublicUrl(supabaseFilePath);
    const newProfilePictureUrl = publicUrlData === null || publicUrlData === void 0 ? void 0 : publicUrlData.publicUrl;
    if (!newProfilePictureUrl) {
        throw new httpError_1.default("Failed to get public URL for the new profile picture.", 500);
    }
    user.profilePicture = newProfilePictureUrl;
    yield user.save();
    return user;
});
exports.uploadProfilePictureService = uploadProfilePictureService;
/**
 * Deletes a user.
 */
const deleteUserService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_model_1.default.findByPk(id);
    if (!user) {
        throw new httpError_1.default("User not found", 404);
    }
    // Add logic to delete profile picture from storage here...
    yield user.destroy();
    return true;
});
exports.deleteUserService = deleteUserService;
const googleSignInService = (idToken, req) => __awaiter(void 0, void 0, void 0, function* () {
    const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = yield client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
        throw new httpError_1.default("Invalid Google token or email missing.", 401);
    }
    const { email, name, picture } = payload;
    // Check if user already exists
    let user = yield User_model_1.default.findOne({ where: { email } });
    if (!user) {
        // User doesn't exist, create a new one
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const salt = yield bcryptjs_1.default.genSalt(10);
        const passwordHash = yield bcryptjs_1.default.hash(randomPassword, salt);
        const initialRole = 'student';
        const initialStatus = 'approved';
        user = yield User_model_1.default.create({
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
    }
    else {
        // Update existing user
        if (picture && user.get('profilePicture') !== picture) {
            user.set('profilePicture', picture);
        }
        if (user.get('status') !== 'approved') {
            user.set('status', 'approved');
        }
        yield user.save();
    }
    // === GENERATE DEVICE TOKEN FOR GOOGLE LOGIN ===
    const newDeviceToken = generateDeviceToken();
    const deviceId = req === null || req === void 0 ? void 0 : req.headers['x-device-id'];
    const deviceInfo = req ? getDeviceInfo(req) : 'Unknown Device (Google Login)';
    yield user.update({
        deviceToken: newDeviceToken,
        deviceId: deviceId || null,
        lastLoginAt: new Date(),
        lastLoginDevice: deviceInfo
    });
    console.log(`User ${email} logged in via Google. Device token issued.`);
    // Generate JWT
    const APP_SECRET_KEY = process.env.SECRET_KEY || 'default-secret-key';
    const jwtPayload = {
        id: user.get("id"),
        name: user.get("name"),
        email: user.get("email"),
        role: user.get("role"),
        status: user.get("status"),
    };
    const jwtOptions = { expiresIn: '7d' };
    const token = jsonwebtoken_1.default.sign(jwtPayload, APP_SECRET_KEY, jwtOptions);
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.passwordResetToken;
    delete userResponse.passwordResetExpires;
    return {
        user: userResponse,
        token,
        deviceToken: newDeviceToken // Send device token to client
    };
});
exports.googleSignInService = googleSignInService;
/**
 * --- NEW SERVICE ---
 * Handles user sign-in or registration via a Facebook Access Token.
 * @param accessToken The access token received from the Facebook Login flow on the client.
 */
const facebookSignInService = (accessToken, req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    let facebookUserData;
    try {
        const { data } = yield axios_1.default.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);
        facebookUserData = data;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            console.error("Axios Error calling Facebook Graph API:", JSON.stringify((_a = error.response) === null || _a === void 0 ? void 0 : _a.data, null, 2));
            const fbError = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error;
            const errorMessage = (fbError === null || fbError === void 0 ? void 0 : fbError.message) || "Failed to validate Facebook token with Graph API.";
            throw new httpError_1.default(errorMessage, 400);
        }
        else {
            console.error("Non-Axios Error in facebookSignInService:", error);
            throw new httpError_1.default("An unexpected server error occurred during Facebook validation.", 500);
        }
    }
    if (!facebookUserData || !facebookUserData.email) {
        throw new httpError_1.default("Invalid Facebook token or email permission was not granted.", 401);
    }
    const { email, name } = facebookUserData;
    const picture = (_e = (_d = facebookUserData.picture) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.url;
    let user = yield User_model_1.default.findOne({ where: { email } });
    if (!user) {
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const salt = yield bcryptjs_1.default.genSalt(10);
        const passwordHash = yield bcryptjs_1.default.hash(randomPassword, salt);
        const initialRole = 'student';
        const initialStatus = 'approved';
        user = yield User_model_1.default.create({
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
    }
    else {
        if (picture && user.get('profilePicture') !== picture) {
            user.set('profilePicture', picture);
        }
        if (user.get('status') !== 'approved') {
            user.set('status', 'approved');
        }
        yield user.save();
    }
    // === GENERATE DEVICE TOKEN FOR FACEBOOK LOGIN ===
    const newDeviceToken = generateDeviceToken();
    const deviceId = req === null || req === void 0 ? void 0 : req.headers['x-device-id'];
    const deviceInfo = req ? getDeviceInfo(req) : 'Unknown Device (Facebook Login)';
    yield user.update({
        deviceToken: newDeviceToken,
        deviceId: deviceId || null,
        lastLoginAt: new Date(),
        lastLoginDevice: deviceInfo
    });
    console.log(`User ${email} logged in via Facebook. Device token issued.`);
    // Generate JWT
    const APP_SECRET_KEY = process.env.SECRET_KEY || 'default-secret-key';
    const jwtPayload = {
        id: user.get("id"),
        name: user.get("name"),
        email: user.get("email"),
        role: user.get("role"),
        status: user.get("status"),
    };
    const jwtOptions = { expiresIn: '7d' };
    const token = jsonwebtoken_1.default.sign(jwtPayload, APP_SECRET_KEY, jwtOptions);
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.passwordResetToken;
    delete userResponse.passwordResetExpires;
    return {
        user: userResponse,
        token,
        deviceToken: newDeviceToken // Send device token to client
    };
});
exports.facebookSignInService = facebookSignInService;
const getPendingTeachersService = () => __awaiter(void 0, void 0, void 0, function* () {
    // You should have middleware in your route to ensure only admins can call this.
    const pendingTeachers = yield User_model_1.default.findAll({
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
});
exports.getPendingTeachersService = getPendingTeachersService;
/**
 * Approves a teacher's account.
 * This should only be accessible by users with the 'admin' role.
 */
const approveTeacherService = (teacherId) => __awaiter(void 0, void 0, void 0, function* () {
    const teacher = yield User_model_1.default.findByPk(teacherId);
    if (!teacher) {
        throw new httpError_1.default("Teacher not found.", 404);
    }
    if (teacher.get('role') !== 'teacher') {
        throw new httpError_1.default("User is not a teacher.", 400);
    }
    if (teacher.get('status') === 'approved') {
        throw new httpError_1.default("Teacher account is already approved.", 400);
    }
    yield teacher.update({ status: 'approved' });
    // Removed: Send Approval Email
    return teacher; // Return the updated teacher object
});
exports.approveTeacherService = approveTeacherService;
/**
 * Rejects a teacher's account.
 * This should only be accessible by users with the 'admin' role.
 */
const rejectTeacherService = (teacherId, reason) => __awaiter(void 0, void 0, void 0, function* () {
    const teacher = yield User_model_1.default.findByPk(teacherId);
    if (!teacher) {
        throw new httpError_1.default("Teacher not found.", 404);
    }
    if (teacher.get('role') !== 'teacher') {
        throw new httpError_1.default("User is not a teacher.", 400);
    }
    if (teacher.get('status') === 'rejected') {
        throw new httpError_1.default("Teacher account is already rejected.", 400);
    }
    yield teacher.update({ status: 'rejected' });
    // Removed: Send Rejection Email
    return teacher; // Return the updated teacher object
});
exports.rejectTeacherService = rejectTeacherService;
