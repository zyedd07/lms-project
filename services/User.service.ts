import User from "../models/User.model";
import bcrypt from 'bcryptjs';
import { CreateUserServiceParams, LoginUserServiceParams } from "../utils/types";
import HttpError from "../utils/httpError";
import jwt from 'jsonwebtoken';

export const createUserService = async ({ name, email, phone, password }: CreateUserServiceParams) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newUser = await User.create({
            name,
            email,
            password: passwordHash,
            phone,
        });
        return newUser;
    } catch (error) {
        throw error;
    }
}

export const loginUserService = async ({ email, password }: LoginUserServiceParams) => {
    try {
        const user = await User.findOne({
            where: { email },
        })
        if (!user) {
            throw new HttpError("User does not exist", 400)
        }
        const isPasswordMatch = await bcrypt.compare(password, user.get("password") as unknown as string);
        if (!isPasswordMatch) {
            throw new HttpError("Invalid password", 400)
        }
        const SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
        const userSessionData = {
            id: user.get("id"),
            name: user.get("name"),
            email: user.get("email"),
            role: "STUDENT",
        }
        const token = jwt.sign(userSessionData, SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        return {
            user: userSessionData,
            token,
        }
    } catch (error) {
        throw error;
    }
}

export const getUsersService = async (email?: string) => {
    try {
        if (email) {
            const user = await User.findOne({
                where: { email },
            })
            if (!user) {
                throw new HttpError("User does not exist", 400)
            }
            return user;
        } else {
            const users = await User.findAll();
            return users;
        }
    } catch (error) {
        throw error;
    }
}