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
exports.deleteUserService = exports.updateUserService = exports.getUsersService = exports.loginUserService = exports.createUserService = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs = __importStar(require("fs")); // Import Node.js File System module
const path = __importStar(require("path")); // Import Node.js Path module
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
        // Fallback for local development if the file isn't present,
        // or if you want to use a direct environment variable for it locally.
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
        // Only throw error if the key is absolutely critical for this service.
        // For services that *always* need to sign Jitsi JWTs, this is appropriate.
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
            role: 'student', // Default role for new sign-ups
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
        });
        if (!user) {
            throw new httpError_1.default("User does not exist", 400);
        }
        // Casting user.get("password") to string as bcrypt.compare expects string
        const isPasswordMatch = yield bcryptjs_1.default.compare(password, user.get("password"));
        if (!isPasswordMatch) {
            throw new httpError_1.default("Invalid password", 400);
        }
        // Assuming SECRET_KEY is for *your app's* JWTs, and `jitsiPrivateKey` is for *Jitsi's* JWTs.
        // If this token is *only* for Jitsi authentication, you would use `jitsiPrivateKey` here.
        const APP_SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
        const userRole = user.get("role");
        const userSessionData = {
            id: user.get("id"),
            name: user.get("name"),
            email: user.get("email"),
            role: userRole,
        };
        const jwtOptions = {
            expiresIn: 604800 // 7 days in seconds (7 * 24 * 60 * 60)
        };
        const token = jsonwebtoken_1.default.sign(userSessionData, APP_SECRET_KEY, jwtOptions); // Use APP_SECRET_KEY for app-internal JWT
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
            });
            if (!user) {
                throw new httpError_1.default("User does not exist", 400);
            }
            return user;
        }
        else {
            const users = yield User_model_1.default.findAll(); // This fetches all users
            return users;
        }
    }
    catch (error) {
        throw error;
    }
});
exports.getUsersService = getUsersService;
/**
 * Updates a user's profile based on their ID.
 * @param id The ID of the user to update.
 * @param updates An object containing the fields to update (e.g., name, email, phone, role).
 * @returns The updated user object.
 * @throws HttpError if the user is not found or if there's a validation error.
 */
const updateUserService = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // User.findByPk(id) as any; // Temporary 'any' until User.model.ts is fixed
        // Once User.model.ts is updated to extend Model<any, any>, you might not need this casting.
        const user = yield User_model_1.default.findByPk(id); // Assuming User.model.ts extends Model<any, any> now
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
 * Deletes a user from the database by their ID.
 * @param id The ID of the user to delete.
 * @returns true if the user was successfully deleted.
 * @throws HttpError if the user is not found.
 */
const deleteUserService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield User_model_1.default.destroy({
            where: { id },
        });
        if (result === 0) {
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
