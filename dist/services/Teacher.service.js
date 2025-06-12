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
const Teacher_model_1 = __importDefault(require("../models/Teacher.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const constants_1 = require("../utils/constants");
const CourseTeacher_model_1 = __importDefault(require("../models/CourseTeacher.model"));
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
const loginTeacherService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, password }) {
    try {
        const teacher = yield Teacher_model_1.default.findOne({ where: { email } });
        if (!teacher) {
            throw new Error("Teacher does not exist");
        }
        const isPasswordMatch = yield bcryptjs_1.default.compare(password, teacher.get("password"));
        if (!isPasswordMatch) {
            throw new httpError_1.default("Invalid password", 400);
        }
        const SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
        const userSessionData = {
            id: teacher.get("id"),
            name: teacher.get("name"),
            email: teacher.get("email"),
            role: constants_1.Role.TEACHER
        };
        const token = jsonwebtoken_1.default.sign(userSessionData, SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
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
