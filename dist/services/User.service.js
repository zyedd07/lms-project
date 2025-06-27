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
exports.deleteUserService = exports.uploadProfilePictureService = exports.updateUserService = exports.getUsersService = exports.getProfileService = exports.loginUserService = exports.createUserService = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const supabase_js_1 = require("@supabase/supabase-js");
const uuid_1 = require("uuid");
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
    return User_model_1.default.create(Object.assign(Object.assign({}, params), { password: passwordHash, role: params.designation }));
});
exports.createUserService = createUserService;
/**
 * Authenticates a user and returns their complete data profile and a JWT.
 */
const loginUserService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, password }) {
    const user = yield User_model_1.default.findOne({
        where: { email },
        attributes: [
            'id', 'name', 'email', 'phone', 'role', 'profilePicture', 'password',
            'dateOfBirth', 'address', 'rollNo', 'collegeName', 'university', 'country'
        ]
    });
    if (!user) {
        throw new httpError_1.default("User does not exist", 400);
    }
    const isPasswordMatch = yield bcryptjs_1.default.compare(password, user.get("password"));
    if (!isPasswordMatch) {
        throw new httpError_1.default("Invalid password", 400);
    }
    const APP_SECRET_KEY = process.env.SECRET_KEY || 'default-secret-key';
    // JWT payload should be minimal for security and performance
    const jwtPayload = {
        id: user.get("id"),
        name: user.get("name"),
        email: user.get("email"),
        role: user.get("role"),
    };
    const jwtOptions = { expiresIn: '7d' };
    const token = jsonwebtoken_1.default.sign(jwtPayload, APP_SECRET_KEY, jwtOptions);
    return { user: user.toJSON(), token };
});
exports.loginUserService = loginUserService;
/**
 * --- FIX 1: This new service fetches the fresh profile from the DB ---
 * This is called by the `getLoggedInUser` controller to solve the core bug.
 */
const getProfileService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_model_1.default.findByPk(userId, {
        attributes: [
            'id', 'name', 'email', 'phone', 'role', 'profilePicture',
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
 * --- FIX 2: This service was accidentally removed and is now restored ---
 * Retrieves one user (if email is provided) or all users from the database.
 */
const getUsersService = (email) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.getUsersService = getUsersService;
/**
 * Updates a user's information.
 */
const updateUserService = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_model_1.default.findByPk(id);
    if (!user) {
        throw new httpError_1.default("User not found", 404);
    }
    Object.assign(user, updates);
    yield user.save();
    return user;
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
