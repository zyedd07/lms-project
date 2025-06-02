import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { CreateAdminServiceParams, LoginAdminServiceParams } from "../utils/types";
import Admin from '../models/Admin.model';
import HttpError from '../utils/httpError';
import { Role, RoleValue } from '../utils/constants'; // <-- Ensure RoleValue is imported

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
        console.log(`[AdminService] Searching for admin with email: ${email}`); // LOG 9
        const admin = await Admin.findOne({ where: { email } });
        
        if (!admin) {
            console.log(`[AdminService] Admin not found for email: ${email}`); // LOG 10
            throw new HttpError("Invalid credentials", 401);
        }
        console.log(`[AdminService] Admin found. ID: ${admin.get("id")}, Name: ${admin.get("name")}`); // LOG 11
        console.log(`[AdminService] Admin's role from DB (raw): ${admin.get("role")}`); // LOG 12

        const isPasswordMatch = await bcrypt.compare(password, admin.get("password") as unknown as string);
        if (!isPasswordMatch) {
            console.log(`[AdminService] Password mismatch for email: ${email}`); // LOG 13
            throw new HttpError("Invalid password", 400);
        }
        console.log(`[AdminService] Password matched for email: ${email}`); // LOG 14

        const SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
        
        const userRole = admin.get("role") as unknown as RoleValue; 
        console.log(`[AdminService] userRole (after casting to RoleValue): ${userRole}`); // LOG 15
        console.log(`[AdminService] Type of userRole: ${typeof userRole}`); // LOG 16

        const userSessionData = {
            id: admin.get("id"),
            name: admin.get("name"),
            email: admin.get("email"),
            role: userRole
        };
        console.log(`[AdminService] userSessionData before JWT:`, userSessionData); // LOG 17

        const token = jwt.sign(userSessionData, SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        
        console.log(`[AdminService] Token generated. Returning response.`); // LOG 18
        return {
            user: userSessionData,
            token,
            role: userRole
        };
    } catch (error) {
        console.error(`[AdminService] Service error caught:`, error); // LOG 19
        throw error;
    }
}
