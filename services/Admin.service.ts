import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { CreateAdminServiceParams, LoginAdminServiceParams } from "../utils/types";
import Admin from '../models/Admin.model'; // Assuming Admin.model has a 'role' field
import HttpError from '../utils/httpError';
import { Role } from '../utils/constants'; // Assuming Role constant is defined here

export const createAdminService = async ({ name, email, password }: CreateAdminServiceParams) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        // Assuming Admin.create also allows setting a role, or it defaults to ADMIN
        // If your createAdmin flow assigns specific roles (e.g., only 'admin'),
        // ensure it's set here when creating the new record.
        const newAdmin = await Admin.create({
            name,
            email,
            password: passwordHash,
            // Example if you always want new admins created via this service to be 'ADMIN':
            // role: Role.ADMIN,
        });
        return newAdmin;
    } catch (error) {
        // It's generally better to wrap errors in HttpError for consistent handling
        // For example: throw new HttpError("Failed to create admin", 500);
        throw error; // Re-throwing the original error for now
    }
}

export const loginAdminService = async ({ email, password }: LoginAdminServiceParams) => {
    try {
        const admin = await Admin.findOne({ where: { email } });
        if (!admin) {
            // Throw HttpError for consistent error handling in the controller
            throw new HttpError("Invalid credentials", 401);
        }

        const isPasswordMatch = await bcrypt.compare(password, admin.get("password") as unknown as string);
        if (!isPasswordMatch) {
            throw new HttpError("Invalid password", 400);
        }

        const SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
        
        // --- THIS IS THE CRITICAL PART: Retrieve the actual role from the database 'admin' object ---
        // This will only work if the 'role' column exists in your 'Admins' table in Supabase
        // and is populated with values like 'admin', 'teacher', or 'student'.
        const userRole = admin.get("role") as unknown as Role; 

        // Prepare the session data to be signed into the JWT token
        const userSessionData = {
            id: admin.get("id"),
            name: admin.get("name"),
            email: admin.get("email"),
            role: userRole // <--- Use the actual role retrieved from the database
        };

        // Sign the JWT token
        const token = jwt.sign(userSessionData, SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        
        // Return the user data (including the actual role) and the token to the controller
        return {
            user: userSessionData,
            token,
            role: userRole // <--- Pass the actual role in the response
        };
    } catch (error) {
        // Re-throw the error so it can be caught by the controller's try-catch block
        throw error;
    }
}
