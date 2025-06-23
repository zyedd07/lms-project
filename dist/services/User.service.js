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
const supabase_js_1 = require("@supabase/supabase-js"); // Import createClient directly
// --- Supabase client setup using environment variables ---
// This block is moved here from a separate config file or directly used in controllers/services.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using SERVICE_ROLE_KEY for server-side
if (!supabaseUrl || !supabaseKey) {
    console.error('Environment variables SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined.');
    // In a real application, you might want to throw an error or exit the process if these are critical
    // For now, we'll proceed, but operations requiring Supabase will fail.
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false, // No need for session persistence on the server
    },
});
console.log("Supabase client initialized directly in User.service.ts");
const uuid_1 = require("uuid"); // To generate unique filenames
// Define the path to your Jitsi private key file.
// In production on Render, it will be in /etc/secrets/.
// For local development, you might place it in your project root or configure it via .env.
const JITSI_PRIVATE_KEY_FILE_PATH = process.env.NODE_ENV === 'production'
    ? '/etc/secrets/jitsi_private_key.pem' // Render's path for Secret Files
    : path.join(__dirname, '..', '..', 'jitsi_private_key.pem'); // Common local dev path (e.g., if .pem is in project root)
let jitsiPrivateKey;
// Load the Jitsi Private Key once when the service file is imported
try {
    if (!fs.existsSync(JITSI_PRIVATE_KEY_FILE_PATH)) {
        jitsiPrivateKey = process.env.JITSI_PRIVATE_KEY || ''; // Use a specific env var for Jitsi if needed locally
        if (!jitsiPrivateKey) {
            console.warn(`[Jitsi Init] Jitsi private key file not found at ${JITSI_PRIVATE_KEY_FILE_PATH} and JITSI_PRIVATE_KEY env var is empty.`);
        }
        else {
            console.log("[Jitsi Init] Jitsi Private Key loaded from environment variable (fallback).");
        }
    }
    else {
        jitsiPrivateKey = fs.readFileSync(JITSI_PRIVATE_KEY_FILE_PATH, 'utf8');
        console.log("[Jitsi Init] Jitsi Private Key loaded successfully from secret file.");
    }
    if (!jitsiPrivateKey) {
        throw new Error("Jitsi Private Key is not loaded. Ensure it's configured in Render's Secret Files or as an environment variable.");
    }
}
catch (error) {
    console.error("[Jitsi Init] Error loading Jitsi Private Key:", error);
    throw error;
}
const createUserService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ name, email, phone, password }) {
    try {
        const salt = yield bcryptjs_1.default.genSalt(10);
        const passwordHash = yield bcryptjs_1.default.hash(password, salt);
        const newUser = yield User_model_1.default.create({
            name,
            email,
            password: passwordHash,
            phone,
            role: 'student',
            // profilePicture will default to null/undefined if not provided, which is fine
        });
        return newUser;
    }
    catch (error) {
        throw error;
    }
});
exports.createUserService = createUserService;
const loginUserService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, password }) {
    try {
        const user = yield User_model_1.default.findOne({
            where: { email },
            attributes: ['id', 'name', 'email', 'phone', 'role', 'profilePicture', 'password']
        });
        if (!user) {
            throw new httpError_1.default("User does not exist", 400);
        }
        const isPasswordMatch = yield bcryptjs_1.default.compare(password, user.get("password"));
        if (!isPasswordMatch) {
            throw new httpError_1.default("Invalid password", 400);
        }
        const APP_SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
        const userRole = user.get("role");
        const profilePictureUrl = user.get("profilePicture");
        const userSessionData = {
            id: user.get("id"),
            name: user.get("name"),
            email: user.get("email"),
            phone: user.get("phone"),
            role: userRole,
            profilePicture: profilePictureUrl,
        };
        const jwtOptions = {
            expiresIn: 604800
        };
        const token = jsonwebtoken_1.default.sign(userSessionData, APP_SECRET_KEY, jwtOptions);
        return {
            user: userSessionData,
            token,
        };
    }
    catch (error) {
        throw error;
    }
});
exports.loginUserService = loginUserService;
const getUsersService = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (email) {
            const user = yield User_model_1.default.findOne({
                where: { email },
                attributes: ['id', 'name', 'email', 'phone', 'role', 'profilePicture']
            });
            if (!user) {
                throw new httpError_1.default("User does not exist", 400);
            }
            return user;
        }
        else {
            const users = yield User_model_1.default.findAll({
                attributes: ['id', 'name', 'email', 'phone', 'role', 'profilePicture']
            });
            return users;
        }
    }
    catch (error) {
        throw error;
    }
});
exports.getUsersService = getUsersService;
const updateUserService = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_model_1.default.findByPk(id);
        if (!user) {
            throw new httpError_1.default("User not found", 404);
        }
        if (updates.name !== undefined)
            user.name = updates.name;
        if (updates.email !== undefined)
            user.email = updates.email;
        if (updates.phone !== undefined)
            user.phone = updates.phone;
        if (updates.role !== undefined)
            user.role = updates.role;
        // profilePicture will be handled by uploadProfilePictureService,
        // but keeping this here for flexibility if other controllers use it
        if (updates.profilePicture !== undefined)
            user.profilePicture = updates.profilePicture;
        yield user.save();
        return user;
    }
    catch (error) {
        console.error("Error in updateUserService:", error);
        throw error;
    }
});
exports.updateUserService = updateUserService;
/**
 * Service to upload a profile picture to Supabase Storage and update the user's record.
 * @param userId The ID of the user.
 * @param fileBuffer The buffer of the image file.
 * @param mimetype The MIME type of the file (e.g., 'image/jpeg').
 * @param originalFileName The original name of the file.
 * @returns The updated user object with the new profile picture URL.
 * @throws HttpError if the user is not found or upload/deletion fails.
 */
const uploadProfilePictureService = (userId, fileBuffer, // File buffer from multer
mimetype, // File mimetype from multer
originalFileName // Original file name from multer
) => __awaiter(void 0, void 0, void 0, function* () {
    const PROFILE_PICTURE_BUCKET = 'profile-pictures'; // Define your Supabase bucket name for profile pictures
    try {
        const user = yield User_model_1.default.findByPk(userId);
        if (!user) {
            throw new httpError_1.default("User not found", 404);
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
                    const { error: deleteError } = yield supabase.storage
                        .from(PROFILE_PICTURE_BUCKET)
                        .remove([oldFilePathInBucket]);
                    if (deleteError) {
                        console.error(`Supabase Delete Old Profile Picture Error for ${oldFilePathInBucket}:`, deleteError);
                        throw new httpError_1.default(`Failed to delete old profile picture from storage: ${deleteError.message}`, 500);
                    }
                    console.log(`Successfully deleted old profile picture: ${oldFilePathInBucket}`);
                }
                else {
                    console.warn(`Old profile picture URL's bucket '${bucketNameInUrl}' does not match expected bucket '${PROFILE_PICTURE_BUCKET}'. Skipping deletion: ${user.profilePicture}`);
                }
            }
            else {
                console.warn(`Could not parse old profile picture URL for deletion: ${user.profilePicture}`);
            }
        }
        // --- Step 2: Upload the new profile picture to Supabase Storage ---
        // Create a unique file name to avoid collisions
        const uniqueFileName = `${(0, uuid_1.v4)()}-${originalFileName}`;
        // Define the path within your Supabase bucket (e.g., profile-pictures/user-id/unique-file-name.jpg)
        const supabaseFilePath = `${userId}/${uniqueFileName}`; // Store directly under user ID in the bucket
        console.log(`Attempting to upload new profile picture to ${PROFILE_PICTURE_BUCKET}/${supabaseFilePath}`);
        const { data: uploadData, error: uploadError } = yield supabase.storage
            .from(PROFILE_PICTURE_BUCKET)
            .upload(supabaseFilePath, fileBuffer, {
            contentType: mimetype,
            upsert: false, // Prevents accidental overwrites if a file with exact same name is uploaded
        });
        if (uploadError) {
            console.error("Supabase Upload Profile Picture Error:", uploadError);
            throw new httpError_1.default(`Failed to upload profile picture to storage: ${uploadError.message}`, 500);
        }
        console.log(`Successfully uploaded new profile picture to ${PROFILE_PICTURE_BUCKET}/${supabaseFilePath}`);
        // --- Step 3: Get the public URL for the newly uploaded file ---
        const { data: publicUrlData } = supabase.storage
            .from(PROFILE_PICTURE_BUCKET)
            .getPublicUrl(supabaseFilePath);
        const newProfilePictureUrl = publicUrlData === null || publicUrlData === void 0 ? void 0 : publicUrlData.publicUrl;
        if (!newProfilePictureUrl) {
            throw new httpError_1.default("Failed to get public URL for new profile picture.", 500);
        }
        console.log(`New profile picture public URL: ${newProfilePictureUrl}`);
        // --- Step 4: Update the user's profilePicture field in the database ---
        user.profilePicture = newProfilePictureUrl;
        yield user.save();
        console.log(`User ${userId} profile picture updated in DB to: ${newProfilePictureUrl}`);
        return user;
    }
    catch (error) {
        console.error("Error in uploadProfilePictureService:", error);
        throw error;
    }
});
exports.uploadProfilePictureService = uploadProfilePictureService;
/**
 * Deletes a user from the database by their ID.
 * Also deletes their associated profile picture from Supabase Storage.
 * @param id The ID of the user to delete.
 * @returns true if the user was successfully deleted.
 * @throws HttpError if the user is not found.
 */
const deleteUserService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const PROFILE_PICTURE_BUCKET = 'profile-pictures'; // Define your Supabase bucket name
    try {
        const user = yield User_model_1.default.findByPk(id);
        if (!user) {
            throw new httpError_1.default("User not found", 404);
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
                    const { error: deleteError } = yield supabase.storage
                        .from(PROFILE_PICTURE_BUCKET)
                        .remove([filePathInBucket]);
                    if (deleteError) {
                        console.error(`Supabase Delete User Profile Picture Error for ${filePathInBucket}:`, deleteError);
                        // Log the error but don't prevent user deletion if storage delete fails
                        // You might want a more robust error handling strategy here (e.g., retry, dead-letter queue)
                    }
                    else {
                        console.log(`Successfully deleted user ${id}'s profile picture: ${filePathInBucket}`);
                    }
                }
                else {
                    console.warn(`User ${id}'s profile picture URL's bucket '${bucketNameInUrl}' does not match expected bucket '${PROFILE_PICTURE_BUCKET}'. Skipping deletion: ${user.profilePicture}`);
                }
            }
            else {
                console.warn(`Could not parse user ${id}'s old profile picture URL for deletion: ${user.profilePicture}`);
            }
        }
        const result = yield User_model_1.default.destroy({
            where: { id },
        });
        if (result === 0) {
            // This case should ideally be caught by findByPk check above, but as a fallback
            throw new httpError_1.default("User not found", 404);
        }
        return true;
    }
    catch (error) {
        console.error("Error in deleteUserService:", error);
        throw error;
    }
});
exports.deleteUserService = deleteUserService;
