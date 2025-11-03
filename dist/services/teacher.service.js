"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeachersService = exports.isTeacherAssignedService = exports.loginTeacherService = exports.updateTeacherPermissions = exports.getTeacherPermissions = exports.createTeacherService = void 0;
const Teacher_model_1 = __importDefault(require("../models/Teacher.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const constants_1 = require("../utils/constants");
const CourseTeacher_model_1 = __importDefault(require("../models/CourseTeacher.model"));
const fs = __importStar(require("fs")); // Import Node.js File System module
const path = __importStar(require("path")); // Import Node.js Path module
const User_model_1 = __importDefault(require("../models/User.model")); // Assuming teachers are stored in the User model
// Define the path to your Jitsi private key file.
// In production on Render, it will be in /etc/secrets/.
// For local development, you might place it in your project root or configure it via .env.
const JITSI_PRIVATE_KEY_FILE_PATH = process.env.NODE_ENV === 'production'
    ? '/etc/secrets/jitsi_private_key.pem' // Render's path for Secret Files
    : path.join(__dirname, '..', '..', 'jitsi_private_key.pem'); // Common local dev path (e.g., if .pem is in project root)
let jitsiPrivateKey;
// Load the Jitsi Private Key once when the service file is imported
try {
    if (!fs.existsSync(JITSI_PRIVATE_KEY_FILE_PATH)) {
        // Fallback for local development if the file isn't present,
        // or if you want to use a direct environment variable for it locally.
        jitsiPrivateKey = process.env.JITSI_PRIVATE_KEY || ''; // Use a specific env var for Jitsi if needed locally
        if (!jitsiPrivateKey) {
            console.warn(`[Jitsi Init] Jitsi private key file not found at ${JITSI_PRIVATE_KEY_FILE_PATH} and JITSI_PRIVATE_KEY env var is empty.`);
        }
        else {
            console.log("[Jitsi Init] Jitsi Private Key loaded from environment variable (fallback).");
        }
    }
    else {
        jitsiPrivateKey = fs.readFileSync(JITSI_PRIVATE_KEY_FILE_PATH, 'utf8');
        console.log("[Jitsi Init] Jitsi Private Key loaded successfully from secret file.");
    }
    if (!jitsiPrivateKey) {
        // Only throw error if the key is absolutely critical for this service
        // For services that *always* need to sign Jitsi JWTs, this is appropriate.
        throw new Error("Jitsi Private Key is not loaded. Ensure it's configured in Render's Secret Files or as an environment variable.");
    }
}
catch (error) {
    console.error("[Jitsi Init] Error loading Jitsi Private Key:", error);
    throw error;
}
const createTeacherService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ name, email, password, phone, expertise }) {
    try {
        const salt = yield bcryptjs_1.default.genSalt(10);
        const passwordHash = yield bcryptjs_1.default.hash(password, salt);
        const newTeacher = yield Teacher_model_1.default.create({
            name,
            email,
            password: passwordHash,
            phone,
            expertise,
        });
        return newTeacher;
    }
    catch (error) {
        throw error;
    }
});
exports.createTeacherService = createTeacherService;
const getTeacherPermissions = (_a) => __awaiter(void 0, [_a], void 0, function* ({ teacherId }) {
    const teacher = yield User_model_1.default.findOne({
        where: { id: teacherId, role: 'teacher' },
        attributes: ['permissions'] // Only fetch the permissions field
    });
    if (!teacher) {
        throw new httpError_1.default("Teacher not found.", 404);
    }
    // Return the permissions object, or a default object if null
    return teacher.permissions || { courses: false, tests: false, qbank: false, webinars: false };
});
exports.getTeacherPermissions = getTeacherPermissions;
/**
 * Updates the permissions for a specific teacher.
 */
const updateTeacherPermissions = (_a) => __awaiter(void 0, [_a], void 0, function* ({ teacherId, permissions }) {
    const teacher = yield User_model_1.default.findOne({
        where: { id: teacherId, role: 'teacher' }
    });
    if (!teacher) {
        throw new httpError_1.default("Teacher not found.", 404);
    }
    // Get existing permissions to merge with new ones
    const existingPermissions = teacher.permissions || {};
    // Update the teacher's permissions field with the new values
    teacher.permissions = Object.assign(Object.assign({}, existingPermissions), permissions);
    yield teacher.save();
    return teacher;
});
exports.updateTeacherPermissions = updateTeacherPermissions;
const loginTeacherService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, password }) {
    try {
        const teacher = yield Teacher_model_1.default.findOne({ where: { email } });
        if (!teacher) {
            throw new httpError_1.default("Invalid credentials", 401);
        }
        const isPasswordMatch = yield bcryptjs_1.default.compare(password, teacher.get("password"));
        if (!isPasswordMatch) {
            throw new httpError_1.default("Invalid password", 400);
        }
        // Assuming SECRET_KEY is for *your app's* JWTs, and `jitsiPrivateKey` is for *Jitsi's* JWTs.
        // If this token is *only* for Jitsi authentication, you would use `jitsiPrivateKey` directly here.
        const APP_SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
        const userSessionData = {
            id: teacher.get("id"),
            name: teacher.get("name"),
            email: teacher.get("email"),
            role: constants_1.Role.TEACHER
        };
        const jwtOptions = {
            expiresIn: 604800 // 7 days in seconds (7 * 24 * 60 * 60)
        };
        // This 'token' is for your app's authentication.
        // The Jitsi-specific JWT (using jitsiPrivateKey) is generated in webinar.controller.ts.
        const token = jsonwebtoken_1.default.sign(userSessionData, APP_SECRET_KEY, jwtOptions);
        return {
            user: userSessionData,
            token,
            role: constants_1.Role.TEACHER
        };
    }
    catch (error) {
        throw error;
    }
});
exports.loginTeacherService = loginTeacherService;
const isTeacherAssignedService = (teacherId, courseId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isAssigned = yield CourseTeacher_model_1.default.findOne({
            where: {
                teacherId,
                courseId
            }
        });
        if (isAssigned) {
            return true;
        }
        else {
            return false;
        }
    }
    catch (error) {
        throw error;
    }
});
exports.isTeacherAssignedService = isTeacherAssignedService;
const getTeachersService = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let whereClause = {};
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
        const teachers = yield Teacher_model_1.default.findAll({
            where: whereClause,
        });
        return teachers;
    }
    catch (error) {
        throw error;
    }
});
exports.getTeachersService = getTeachersService;
