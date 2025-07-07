import Teacher from "../models/Teacher.model";
import { CreateTeacherServiceParams, GetTeacherFilterType, LoginTeacherServiceParams,GetTeacherPermissionsParams, UpdateTeacherPermissionsParams  } from "../utils/types";
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import HttpError from "../utils/httpError";
import { Role } from "../utils/constants";
import CourseTeacher from "../models/CourseTeacher.model";
import * as fs from 'fs'; // Import Node.js File System module
import * as path from 'path'; // Import Node.js Path module
import User from '../models/User.model'; // Assuming teachers are stored in the User model


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
        // Only throw error if the key is absolutely critical for this service
        // For services that *always* need to sign Jitsi JWTs, this is appropriate.
        throw new Error("Jitsi Private Key is not loaded. Ensure it's configured in Render's Secret Files or as an environment variable.");
    }
} catch (error) {
    console.error("[Jitsi Init] Error loading Jitsi Private Key:", error);
    throw error;
}


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

export const getTeacherPermissions = async ({ teacherId }: GetTeacherPermissionsParams) => {
    const teacher = await User.findOne({
        where: { id: teacherId, role: 'teacher' },
        attributes: ['permissions'] // Only fetch the permissions field
    });

    if (!teacher) {
        throw new HttpError("Teacher not found.", 404);
    }

    // Return the permissions object, or a default object if null
    return (teacher as any).permissions || { courses: false, tests: false, qbank: false, webinars: false };
};

/**
 * Updates the permissions for a specific teacher.
 */
export const updateTeacherPermissions = async ({ teacherId, permissions }: UpdateTeacherPermissionsParams) => {
    const teacher = await User.findOne({
        where: { id: teacherId, role: 'teacher' }
    });

    if (!teacher) {
        throw new HttpError("Teacher not found.", 404);
    }

    // Get existing permissions to merge with new ones
    const existingPermissions = (teacher as any).permissions || {};
    
    // Update the teacher's permissions field with the new values
    (teacher as any).permissions = { ...existingPermissions, ...permissions };

    await teacher.save();
    return teacher;
};

export const loginTeacherService = async ({ email, password }: LoginTeacherServiceParams) => {
    try {
        const teacher = await Teacher.findOne({ where: { email } });
        if (!teacher) {
            throw new HttpError("Invalid credentials", 401);
        }
        const isPasswordMatch = await bcrypt.compare(password, teacher.get("password") as string);
        if (!isPasswordMatch) {
            throw new HttpError("Invalid password", 400)
        }
        // Assuming SECRET_KEY is for *your app's* JWTs, and `jitsiPrivateKey` is for *Jitsi's* JWTs.
        // If this token is *only* for Jitsi authentication, you would use `jitsiPrivateKey` directly here.
        const APP_SECRET_KEY: string = process.env.SECRET_KEY || 'cleanclean'; 

        const userSessionData = {
            id: teacher.get("id"),
            name: teacher.get("name"),
            email: teacher.get("email"),
            role: Role.TEACHER
        }

        const jwtOptions: SignOptions = {
            expiresIn: 604800 // 7 days in seconds (7 * 24 * 60 * 60)
        };
        
        // This 'token' is for your app's authentication.
        // The Jitsi-specific JWT (using jitsiPrivateKey) is generated in webinar.controller.ts.
        const token = jwt.sign(userSessionData, APP_SECRET_KEY, jwtOptions); 

        return {
            user: userSessionData,
            token,
            role: Role.TEACHER
        }
    } catch (error) {
        throw error;
    }
}

export const 
isTeacherAssignedService = async (teacherId: string, courseId: string) => {
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