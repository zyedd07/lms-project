import Teacher from "../models/Teacher.model";
import { CreateTeacherServiceParams, LoginTeacherServiceParams } from "../utils/types";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import HttpError from "../utils/httpError";

export const createTeacherService = async ({ name, email, password, phone, expertise }: CreateTeacherServiceParams) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newTeacher = await Teacher.create({
            name,
            email,
            password: passwordHash,
            phone,
            expertise,
        })
        return newTeacher;
    } catch (error) {
        throw error;
    }
}

export const loginTeacherService = async ({ email, password }: LoginTeacherServiceParams) => {
    try {
        const teacher = await Teacher.findOne({ where: { email } });
        if (!teacher) {
            throw new Error("Teacher does not exist");
        }
        const isPasswordMatch = await bcrypt.compare(password, teacher.get("password") as unknown as string);
        if (!isPasswordMatch) {
            throw new HttpError("Invalid password", 400)
        }
        const SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
        const userSessionData = {
            id: teacher.get("id"),
            name: teacher.get("name"),
            email: teacher.get("email"),
            role: "TEACHER",
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