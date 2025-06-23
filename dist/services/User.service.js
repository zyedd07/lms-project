"use strict";
// src/services/User.service.ts
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
exports.deleteUserService = exports.uploadProfilePictureService = exports.updateUserService = exports.getUsersService = exports.loginUserService = exports.createUserService = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const supabase_js_1 = require("@supabase/supabase-js"); // Import createClient
const uuid_1 = require("uuid"); // Import uuid
// --- Supabase client setup using environment variables ---
let supabaseClient; // Declare a mutable variable for the client
try {
    console.log("[SUPABASE INIT] Attempting to initialize Supabase client...");
    const supabaseUrl = process.env.SUPABASE_URL; // Get URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Get Service Role Key
    if (!supabaseUrl) {
        console.error("[SUPABASE INIT ERROR] SUPABASE_URL is UNDEFINED. Please check your Codespace environment variables/secrets.");
    }
    else {
        console.log(`[SUPABASE INIT] SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`); // Log partial URL for safety
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
        console.error("[SUPABASE INIT ERROR] Supabase client NOT initialized due to missing environment variables. Supabase-dependent features (like profile picture upload/deletion) will fail.");
    }
}
catch (error) {
    console.error("[SUPABASE INIT ERROR] Unexpected error during Supabase client initialization:", error);
    throw error;
}
const supabase = supabaseClient; // Use this const for consistency
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
        throw new Error("Jitsi Private Key is not loaded. Configure it in Render's Secret Files or as an environment variable.");
    }
}
catch (error) {
    console.error("[Jitsi Init] Error loading Jitsi Private Key:", error);
    throw error;
}
/**
 * Creates a new user in the database with all fields from the registration form.
 */
const createUserService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ name, email, phone, password, dateOfBirth, address, rollNo, collegeName, university, country, designation, }) {
    try {
        const salt = yield bcryptjs_1.default.genSalt(10);
        const passwordHash = yield bcryptjs_1.default.hash(password, salt);
        const newUser = yield User_model_1.default.create({
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
    }
    catch (error) {
        throw error;
    }
});
exports.createUserService = createUserService;
/**
 * Authenticates a user and returns their complete data profile and a JWT.
 */
const loginUserService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, password }) {
    try {
        console.log(`[LOGIN SERVICE DEBUG] Starting login attempt for email: ${email}`);
        const user = yield User_model_1.default.findOne({
            where: { email },
            // Ensure all new and existing attributes are fetched
            attributes: [
                'id', 'name', 'email', 'phone', 'role', 'profilePicture', 'password',
                'dateOfBirth', 'address', 'rollNo', 'collegeName', 'university', 'country'
            ]
        });
        if (!user) {
            console.log(`[LOGIN SERVICE DEBUG] User not found for email: ${email}`);
            throw new httpError_1.default("User does not exist", 400);
        }
        const isPasswordMatch = yield bcryptjs_1.default.compare(password, user.get("password"));
        if (!isPasswordMatch) {
            console.log(`[LOGIN SERVICE DEBUG] Password mismatch for email: ${user.get("email")}`);
            throw new httpError_1.default("Invalid password", 400);
        }
        const APP_SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
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
        const jwtOptions = {
            expiresIn: 604800 // 7 days
        };
        const token = jsonwebtoken_1.default.sign(userSessionData, APP_SECRET_KEY, jwtOptions);
        return { user: userSessionData, token };
    }
    catch (error) {
        console.error(`[LOGIN SERVICE ERROR] Failed login for email: ${email}. Error:`, error);
        throw error;
    }
});
exports.loginUserService = loginUserService;
/**
 * Retrieves one or all users from the database, including all detailed fields.
 */
const getUsersService = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const attributes = [
            'id', 'name', 'email', 'phone', 'role', 'profilePicture',
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
    }
    catch (error) {
        throw error;
    }
});
exports.getUsersService = getUsersService;
/**
 * Updates a user's information.
 */
const updateUserService = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_model_1.default.findByPk(id);
        if (!user) {
            throw new httpError_1.default("User not found", 404);
        }
        // Dynamically assign updates to the user model instance
        Object.assign(user, updates);
        yield user.save();
        return user;
    }
    catch (error) {
        throw error;
    }
});
exports.updateUserService = updateUserService;
/**
 * Uploads a profile picture to Supabase Storage and updates the user record.
 */
const uploadProfilePictureService = (userId, fileBuffer, mimetype, originalFileName) => __awaiter(void 0, void 0, void 0, function* () {
    const PROFILE_PICTURE_BUCKET = 'profile-pictures';
    if (!supabase) {
        throw new httpError_1.default("Supabase client is not initialized. Cannot upload profile picture.", 500);
    }
    const user = yield User_model_1.default.findByPk(userId);
    if (!user) {
        throw new httpError_1.default("User not found", 404);
    }
    // Delete old picture if it exists
    const oldPicture = user.get('profilePicture');
    if (oldPicture) {
        try {
            const urlParts = oldPicture.split('/');
            const oldFilePath = urlParts.slice(urlParts.indexOf(PROFILE_PICTURE_BUCKET) + 1).join('/');
            if (oldFilePath) {
                yield supabase.storage.from(PROFILE_PICTURE_BUCKET).remove([oldFilePath]);
            }
        }
        catch (e) {
            console.error("Failed to delete old profile picture, continuing upload...", e);
        }
    }
    // Upload new picture
    const uniqueFileName = `${(0, uuid_1.v4)()}-${originalFileName}`;
    const supabaseFilePath = `${userId}/${uniqueFileName}`;
    const { error: uploadError } = yield supabase.storage
        .from(PROFILE_PICTURE_BUCKET)
        .upload(supabaseFilePath, fileBuffer, { contentType: mimetype, upsert: false });
    if (uploadError) {
        throw new httpError_1.default(`Failed to upload profile picture: ${uploadError.message}`, 500);
    }
    // Get public URL and update user record
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
 * Deletes a user and their profile picture from Supabase Storage.
 */
const deleteUserService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const PROFILE_PICTURE_BUCKET = 'profile-pictures';
    const user = yield User_model_1.default.findByPk(id);
    if (!user) {
        throw new httpError_1.default("User not found", 404);
    }
    // Delete profile picture from Supabase if it exists and the client is available
    const pictureToDelete = user.get('profilePicture');
    if (pictureToDelete && supabase) {
        try {
            const urlParts = pictureToDelete.split('/');
            const filePath = urlParts.slice(urlParts.indexOf(PROFILE_PICTURE_BUCKET) + 1).join('/');
            if (filePath) {
                yield supabase.storage.from(PROFILE_PICTURE_BUCKET).remove([filePath]);
            }
        }
        catch (e) {
            console.error("Failed to delete profile picture from storage, continuing user deletion...", e);
        }
    }
    const result = yield User_model_1.default.destroy({ where: { id } });
    if (result === 0) {
        throw new httpError_1.default("User not found during deletion", 404);
    }
    return true;
});
exports.deleteUserService = deleteUserService;
