// src/services/Admin.service.ts

import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { CreateAdminServiceParams, LoginAdminServiceParams } from "../utils/types";
import Admin from '../models/Admin.model';
import HttpError from '../utils/httpError';
import { Role, RoleValue } from '../utils/constants';
import * as fs from 'fs'; // Import Node.js File System module
import * as path from 'path'; // Import Node.js Path module

// Define the path to your Jitsi private key file.
// In production on Render, it will be in /etc/secrets/.
// For local development, you might place it in your project root or configure it via .env.
const JITSI_PRIVATE_KEY_FILE_PATH = process.env.NODE_ENV === 'production'
    ? '/etc/secrets/jitsi_private_key.pem' // Render's path for Secret Files
    : path.join(__dirname, '..', '..', 'jitsi_private_key.pem'); // Common local dev path (e.g., if .pem is in project root)

let jitsiPrivateKey: string;

// Load the Jitsi Private Key once when the service file is imported
try {
    if (!fs.existsSync(JITSI_PRIVATE_KEY_FILE_PATH)) {
        // Fallback for local development if the file isn't present,
        // or if you want to use a direct environment variable for it locally.
        // In production, this should ideally always come from the file.
        jitsiPrivateKey = process.env.JITSI_PRIVATE_KEY || ''; // Use a specific env var for Jitsi if needed locally
        if (!jitsiPrivateKey) {
            console.warn(`[Jitsi Init] Jitsi private key file not found at ${JITSI_PRIVATE_KEY_FILE_PATH} and JITSI_PRIVATE_KEY env var is empty.`);
        } else {
            console.log("[Jitsi Init] Jitsi Private Key loaded from environment variable (fallback).");
        }
    } else {
        jitsiPrivateKey = fs.readFileSync(JITSI_PRIVATE_KEY_FILE_PATH, 'utf8');
        console.log("[Jitsi Init] Jitsi Private Key loaded successfully from secret file.");
    }
    if (!jitsiPrivateKey) {
        throw new Error("Jitsi Private Key is not loaded. Ensure it's configured in Render's Secret Files or as an environment variable.");
    }
} catch (error) {
    console.error("[Jitsi Init] Error loading Jitsi Private Key:", error);
    throw error; // Propagate the error to prevent app from starting with missing critical config
}


export const createAdminService = async ({ name, email, password }: CreateAdminServiceParams) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newAdmin = await Admin.create({
            name,
            email,
            password: passwordHash,
        });
        return newAdmin;
    } catch (error) {
        throw error;
    }
}

export const loginAdminService = async ({ email, password }: LoginAdminServiceParams) => {
    try {
        console.log(`[AdminService] Searching for admin with email: ${email}`);
        const admin = await Admin.findOne({ where: { email } });
        
        if (!admin) {
            console.log(`[AdminService] Admin not found for email: ${email}`);
            throw new HttpError("Invalid credentials", 401);
        }
        console.log(`[AdminService] Admin found. ID: ${admin.get("id")}, Name: ${admin.get("name")}`);
        console.log(`[AdminService] Admin's role from DB (raw): ${admin.get("role")}`);

        const isPasswordMatch = await bcrypt.compare(password, admin.get("password") as string);
        if (!isPasswordMatch) {
            console.log(`[AdminService] Password mismatch for email: ${email}`);
            throw new HttpError("Invalid password", 400);
        }
        console.log(`[AdminService] Password matched for email: ${email}`);

        // Use the loaded jitsiPrivateKey for signing
        // Note: Your application's main JWT secret (SECRET_KEY) might be different
        // from the Jitsi Private Key. If SECRET_KEY is for your app's auth, keep it separate.
        // For Jitsi JWT, use jitsiPrivateKey.
        // If SECRET_KEY was intended *only* for Jitsi, then remove it and use jitsiPrivateKey.
        // For clarity, let's assume SECRET_KEY is for *your app's* JWTs, and jitsiPrivateKey is for *Jitsi's* JWTs.
        const APP_SECRET_KEY: string = process.env.SECRET_KEY || 'cleanclean'; 
        
        const userRole: RoleValue = admin.get("role") as RoleValue; 
        console.log(`[AdminService] userRole (after casting to RoleValue): ${userRole}`);
        console.log(`[AdminService] Type of userRole: ${typeof userRole}`);

        const userSessionData = {
            id: admin.get("id"),
            name: admin.get("name"),
            email: admin.get("email"),
            role: userRole
        };
        console.log(`[AdminService] userSessionData before JWT:`, userSessionData);

        const jwtOptions: SignOptions = {
            expiresIn: 604800 // 7 days in seconds (7 * 24 * 60 * 60)
        };
        
        // This 'token' is likely for your app's authentication, not Jitsi's.
        // If it's for Jitsi, then use 'jitsiPrivateKey'.
        const token = jwt.sign(userSessionData, APP_SECRET_KEY, jwtOptions);
        
        console.log(`[AdminService] Token generated. Returning response.`);
        return {
            user: userSessionData,
            token,
            role: userRole
        };
    } catch (error) {
        console.error(`[AdminService] Service error caught:`, error);
        throw error;
    }
}