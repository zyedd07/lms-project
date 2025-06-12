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
exports.getTeachersController = exports.loginTeacher = exports.createTeacher = void 0;
const Teacher_service_1 = require("../services/Teacher.service");
const httpError_1 = __importDefault(require("../utils/httpError"));
const constants_1 = require("../utils/constants");
const createTeacher = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || req.user.role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default("Unauthorized", 403);
        }
        const { name, email, password, phone, expertise } = req.body;
        if (!name || !email || !password || !phone || !expertise) {
            throw new Error("Please provide all required fields");
        }
        const newTeacher = yield (0, Teacher_service_1.createTeacherService)({ name, email, password, phone, expertise });
        res.status(201).json(newTeacher);
    }
    catch (error) {
        next(error);
    }
});
exports.createTeacher = createTeacher;
const loginTeacher = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new Error("Please provide both email and password");
        }
        const response = yield (0, Teacher_service_1.loginTeacherService)({ email, password });
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.loginTeacher = loginTeacher;
const getTeachersController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || req.user.role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default("Unauthorized", 403);
        }
        const { name, email, expertise, phone, id } = req.query;
        const teachers = yield (0, Teacher_service_1.getTeachersService)({ name: name, email: email, expertise: expertise, phone: phone, id: id });
        res.status(200).json({
            success: true,
            data: teachers
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getTeachersController = getTeachersController;
