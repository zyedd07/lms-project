import Teacher from "../models/Teacher.model"; // Ensure correct import path and type definition for Teacher model
import { CreateTeacherServiceParams, GetTeacherFilterType, LoginTeacherServiceParams } from "../utils/types";
import jwt, { SignOptions } from 'jsonwebtoken'; // FIX: Import SignOptions
import bcrypt from 'bcryptjs';
import HttpError from "../utils/httpError";
import { Role } from "../utils/constants";
import CourseTeacher from "../models/CourseTeacher.model"; // Ensure correct import path and type definition

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
            // role: Role.TEACHER // You might want to explicitly set role here if it's not handled by the model's default
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
            throw new HttpError("Invalid credentials", 401); // Changed from generic Error to HttpError for consistency
        }
        // Casting teacher.get("password") to string as bcrypt.compare expects string
        const isPasswordMatch = await bcrypt.compare(password, teacher.get("password") as string);
        if (!isPasswordMatch) {
            throw new HttpError("Invalid password", 400)
        }
        const SECRET_KEY: string = process.env.SECRET_KEY || 'cleanclean'; // Ensure SECRET_KEY is always a string
        const userSessionData = {
            id: teacher.get("id"),
            name: teacher.get("name"), // Assuming Teacher model has a 'name' field
            email: teacher.get("email"),
            role: Role.TEACHER // Assuming Role.TEACHER is correctly defined in your constants
        }

        // FIX: Explicitly type the options object as SignOptions
        const jwtOptions: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string // Explicitly assert it as string
};
        
        const token = jwt.sign(userSessionData, SECRET_KEY, jwtOptions); // FIX: Pass jwtOptions here

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