// src/services/Admin.service.ts

import jwt, { SignOptions } from 'jsonwebtoken'; // Import SignOptions from jsonwebtoken
import bcrypt from 'bcryptjs';
import { CreateAdminServiceParams, LoginAdminServiceParams } from "../utils/types";
import Admin from '../models/Admin.model'; // Ensure correct import path and type definition for Admin model
import HttpError from '../utils/httpError';
import { Role, RoleValue } from '../utils/constants';

export const createAdminService = async ({ name, email, password }: CreateAdminServiceParams) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newAdmin = await Admin.create({
            name,
            email,
            password: passwordHash,
            // role: Role.ADMIN, // Example: explicitly set default role for new admins if applicable here
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

        // Casting admin.get("password") to string as bcrypt.compare expects string
        const isPasswordMatch = await bcrypt.compare(password, admin.get("password") as string);
        if (!isPasswordMatch) {
            console.log(`[AdminService] Password mismatch for email: ${email}`);
            throw new HttpError("Invalid password", 400);
        }
        console.log(`[AdminService] Password matched for email: ${email}`);

        // Ensure SECRET_KEY is always a string. If process.env.SECRET_KEY is undefined, 'cleanclean' is used.
        const SECRET_KEY: string = process.env.SECRET_KEY || 'cleanclean';
        
        // Ensure userRole is correctly typed based on your RoleValue enum/type
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

        // FIX: Explicitly type the options object as SignOptions
       const jwtOptions: SignOptions = {
    // Calculate 7 days in seconds. You can adjust this value as needed.
    expiresIn: 604800 // 7 days in seconds (7 * 24 * 60 * 60)
};
        
        const token = jwt.sign(userSessionData, SECRET_KEY, jwtOptions);
        
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