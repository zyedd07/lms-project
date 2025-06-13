"use strict";
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
exports.getTeachersService = exports.isTeacherAssignedService = exports.loginTeacherService = exports.createTeacherService = void 0;
const Teacher_model_1 = __importDefault(require("../models/Teacher.model")); // Ensure correct import path and type definition for Teacher model
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // FIX: Import SignOptions
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const constants_1 = require("../utils/constants");
const CourseTeacher_model_1 = __importDefault(require("../models/CourseTeacher.model")); // Ensure correct import path and type definition
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
            // role: Role.TEACHER // You might want to explicitly set role here if it's not handled by the model's default
        });
        return newTeacher;
    }
    catch (error) {
        throw error;
    }
});
exports.createTeacherService = createTeacherService;
const loginTeacherService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, password }) {
    try {
        const teacher = yield Teacher_model_1.default.findOne({ where: { email } });
        if (!teacher) {
            throw new httpError_1.default("Invalid credentials", 401); // Changed from generic Error to HttpError for consistency
        }
        // Casting teacher.get("password") to string as bcrypt.compare expects string
        const isPasswordMatch = yield bcryptjs_1.default.compare(password, teacher.get("password"));
        if (!isPasswordMatch) {
            throw new httpError_1.default("Invalid password", 400);
        }
        const SECRET_KEY = process.env.SECRET_KEY || 'cleanclean'; // Ensure SECRET_KEY is always a string
        const userSessionData = {
            id: teacher.get("id"),
            name: teacher.get("name"), // Assuming Teacher model has a 'name' field
            email: teacher.get("email"),
            role: constants_1.Role.TEACHER // Assuming Role.TEACHER is correctly defined in your constants
        };
        // FIX: Explicitly type the options object as SignOptions
        const jwtOptions = {
            // Calculate 7 days in seconds. You can adjust this value as needed.
            expiresIn: 604800 // 7 days in seconds (7 * 24 * 60 * 60)
        };
        const token = jsonwebtoken_1.default.sign(userSessionData, SECRET_KEY, jwtOptions); // FIX: Pass jwtOptions here
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
