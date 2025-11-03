"use strict";
// src/services/Admin.service.ts
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
exports.loginAdminService = exports.createAdminService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Admin_model_1 = __importDefault(require("../models/Admin.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
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
        // In production, this should ideally always come from the file.
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
    throw error; // Propagate the error to prevent app from starting with missing critical config
}
const createAdminService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ name, email, password }) {
    try {
        const salt = yield bcryptjs_1.default.genSalt(10);
        const passwordHash = yield bcryptjs_1.default.hash(password, salt);
        const newAdmin = yield Admin_model_1.default.create({
            name,
            email,
            password: passwordHash,
        });
        return newAdmin;
    }
    catch (error) {
        throw error;
    }
});
exports.createAdminService = createAdminService;
const loginAdminService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, password }) {
    try {
        console.log(`[AdminService] Searching for admin with email: ${email}`);
        const admin = yield Admin_model_1.default.findOne({ where: { email } });
        if (!admin) {
            console.log(`[AdminService] Admin not found for email: ${email}`);
            throw new httpError_1.default("Invalid credentials", 401);
        }
        console.log(`[AdminService] Admin found. ID: ${admin.get("id")}, Name: ${admin.get("name")}`);
        console.log(`[AdminService] Admin's role from DB (raw): ${admin.get("role")}`);
        const isPasswordMatch = yield bcryptjs_1.default.compare(password, admin.get("password"));
        if (!isPasswordMatch) {
            console.log(`[AdminService] Password mismatch for email: ${email}`);
            throw new httpError_1.default("Invalid password", 400);
        }
        console.log(`[AdminService] Password matched for email: ${email}`);
        // Use the loaded jitsiPrivateKey for signing
        // Note: Your application's main JWT secret (SECRET_KEY) might be different
        // from the Jitsi Private Key. If SECRET_KEY is for your app's auth, keep it separate.
        // For Jitsi JWT, use jitsiPrivateKey.
        // If SECRET_KEY was intended *only* for Jitsi, then remove it and use jitsiPrivateKey.
        // For clarity, let's assume SECRET_KEY is for *your app's* JWTs, and jitsiPrivateKey is for *Jitsi's* JWTs.
        const APP_SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
        const userRole = admin.get("role");
        console.log(`[AdminService] userRole (after casting to RoleValue): ${userRole}`);
        console.log(`[AdminService] Type of userRole: ${typeof userRole}`);
        const userSessionData = {
            id: admin.get("id"),
            name: admin.get("name"),
            email: admin.get("email"),
            role: userRole
        };
        console.log(`[AdminService] userSessionData before JWT:`, userSessionData);
        const jwtOptions = {
            expiresIn: 604800 // 7 days in seconds (7 * 24 * 60 * 60)
        };
        // This 'token' is likely for your app's authentication, not Jitsi's.
        // If it's for Jitsi, then use 'jitsiPrivateKey'.
        const token = jsonwebtoken_1.default.sign(userSessionData, APP_SECRET_KEY, jwtOptions);
        console.log(`[AdminService] Token generated. Returning response.`);
        return {
            user: userSessionData,
            token,
            role: userRole
        };
    }
    catch (error) {
        console.error(`[AdminService] Service error caught:`, error);
        throw error;
    }
});
exports.loginAdminService = loginAdminService;
