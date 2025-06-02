import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { CreateAdminServiceParams, LoginAdminServiceParams } from "../utils/types";
import Admin from '../models/Admin.model';
import HttpError from '../utils/httpError';
import { Role, RoleValue } from '../utils/constants'; // <-- UPDATED: Import RoleValue here

export const createAdminService = async ({ name, email, password }: CreateAdminServiceParams) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newAdmin = await Admin.create({
            name,
            email,
            password: passwordHash,
            // If you create admin users via this service, and want to assign a role:
            // role: Role.ADMIN, // Example: explicitly set default role for new admins
        });
        return newAdmin;
    } catch (error) {
        throw error;
    }
}

export const loginAdminService = async ({ email, password }: LoginAdminServiceParams) => {
    try {
        const admin = await Admin.findOne({ where: { email } });
        if (!admin) {
            throw new HttpError("Invalid credentials", 401);
        }

        const isPasswordMatch = await bcrypt.compare(password, admin.get("password") as unknown as string);
        if (!isPasswordMatch) {
            throw new HttpError("Invalid password", 400);
        }

        const SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
        
        // --- THIS IS THE CRITICAL LINE THAT USES THE NEW TYPE ---
        const userRole = admin.get("role") as unknown as RoleValue; // <-- FIX: Use RoleValue here

        const userSessionData = {
            id: admin.get("id"),
            name: admin.get("name"),
            email: admin.get("email"),
            role: userRole // Use the actual role retrieved from the database
        };

        const token = jwt.sign(userSessionData, SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        
        return {
            user: userSessionData,
            token,
            role: userRole // Pass the actual role in the response
        };
    } catch (error) {
        throw error;
    }
}
