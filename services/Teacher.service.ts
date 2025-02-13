import Teacher from "../models/Teacher.model";
import { CreateTeacherServiceParams, GetTeacherFilterType, LoginTeacherServiceParams } from "../utils/types";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import HttpError from "../utils/httpError";
import { Role } from "../utils/constants";
import CourseTeacher from "../models/CourseTeacher.model";

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
            role: Role.TEACHER
        }
        const token = jwt.sign(userSessionData, SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        return {
            user: userSessionData,
            token,
            role: Role.TEACHER
        }
    } catch (error) {
        throw error;
    }
}

export const isTeacherAssignedService = async (teacherId: string, courseId: string) => {
    try {
        const isAssigned = await CourseTeacher.findOne({
            where: {
                teacherId,
                courseId
            }
        })
        if (isAssigned) {
            return true;
        }
        else {
            return false;
        }
    } catch (error) {
        throw error;
    }
}

export const getTeachersService = async (filters: GetTeacherFilterType) => {
    try {
        let whereClause: GetTeacherFilterType = {};
        if (filters.name) {
            whereClause.name = filters.name;
        }
        if (filters.email) {
            whereClause.email = filters.email;
        }
        if (filters.expertise) {
            whereClause.expertise = filters.expertise;
        }
        if (filters.phone) {
            whereClause.phone = filters.phone;
        }
        if (filters.id) {
            whereClause.id = filters.id;
        }
        const teachers = await Teacher.findAll({
            where: whereClause,
        });

        return teachers;
    } catch (error) {
        throw error;
    }
}