import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { CreateAdminServiceParams, LoginAdminServiceParams } from "../utils/types";
import Admin from '../models/Admin.model';
import HttpError from '../utils/httpError';
import { Role } from '../utils/constants';

export const createAdminService = async ({ name, email, password }: CreateAdminServiceParams) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newAdmin = await Admin.create({
            name,
            email,
            password: passwordHash,
        })
        return newAdmin;
    } catch (error) {
        throw error;
    }
}

export const loginAdminService = async ({ email, password }: LoginAdminServiceParams) => {
    try {
        const admin = await Admin.findOne({ where: { email } });
        if (!admin) {
            throw new Error("admin does not exist");
        }
        const isPasswordMatch = await bcrypt.compare(password, admin.get("password") as unknown as string);
        if (!isPasswordMatch) {
            throw new HttpError("Invalid password", 400)
        }
        const SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
        const userSessionData = {
            id: admin.get("id"),
            name: admin.get("name"),
            email: admin.get("email"),
            role: Role.ADMIN
        }
        const token = jwt.sign(userSessionData, SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        return {
            user: userSessionData,
            token,
            role: Role.ADMIN
        }
    } catch (error) {
        throw error;
    }
}