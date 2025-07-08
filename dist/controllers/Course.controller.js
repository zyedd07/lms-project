"use strict";
// src/controllers/Course.controller.ts
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
exports.courseTeacherController = exports.deleteCourseController = exports.updateCourseController = exports.getAssignedCourseController = exports.getCourseByIdController = exports.getCoursesController = exports.createCourseController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const Course_service_1 = require("../services/Course.service");
const constants_1 = require("../utils/constants");
const teacher_service_1 = require("../services/teacher.service");
// Make sure to import CourseContentModule if you want to use it for type checking the request body
// import { CourseContentModule } from "../utils/types"; 
const createCourseController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        // FIX: Get uploaderId from the authenticated user
        const uploaderId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized', 403);
        }
        // --- MODIFIED LINE: Destructure 'contents' from req.body ---
        const { name, description, demoVideoUrl, imageUrl, categoryId, price, courseType, syllabus, contents } = req.body;
        // --- END MODIFIED LINE ---
        if (!name || !categoryId || !courseType) {
            throw new httpError_1.default('Please provide name, categoryId, and courseType', 400);
        }
        // FIX: Ensure uploaderId is present
        if (!uploaderId) {
            throw new httpError_1.default('Uploader information is missing.', 400);
        }
        // --- MODIFIED LINE: Pass 'contents' and 'uploaderId' to the createCourseService ---
        const newCourse = yield (0, Course_service_1.createCourseService)({
            name,
            description,
            imageUrl,
            demoVideoUrl,
            categoryId,
            price,
            courseType,
            syllabus,
            contents,
            uploaderId // Pass the uploaderId
        });
        // --- END MODIFIED LINE ---
        res.status(201).json({
            success: true,
            data: newCourse
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createCourseController = createCourseController;
const getCoursesController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        let active;
        if (role !== constants_1.Role.ADMIN && role !== constants_1.Role.TEACHER) {
            active = true;
        }
        const { categoryId, id, assigned, limit, offset } = req.query;
        let filters = {};
        if (limit) {
            filters.limit = parseInt(limit);
        }
        if (offset) {
            filters.offset = parseInt(offset);
        }
        const courses = yield (0, Course_service_1.getAllCoursesService)({ categoryId: categoryId, id: id, active: active }, filters);
        res.status(200).json({
            success: true,
            data: courses
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getCoursesController = getCoursesController;
const getCourseByIdController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            throw new httpError_1.default('Course ID is required in URL parameters', 400);
        }
        const course = yield (0, Course_service_1.getCourseByIdService)(id);
        if (!course) {
            throw new httpError_1.default('Course not found', 404);
        }
        res.status(200).json({
            success: true,
            data: course
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getCourseByIdController = getCourseByIdController;
const getAssignedCourseController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        let teacherId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (role === constants_1.Role.ADMIN) {
            teacherId = req.query.teacherId; // Ensure type is string
        }
        else if (role !== constants_1.Role.TEACHER) {
            throw new httpError_1.default('Unauthorized', 403);
        }
        const { limit, offset } = req.query;
        let filters = {};
        if (limit) {
            filters.limit = parseInt(limit);
        }
        if (offset) {
            filters.offset = parseInt(offset);
        }
        const assignedCourses = yield (0, Course_service_1.getAssignedCourseService)(teacherId, filters); // Ensure teacherId is string
        res.status(200).json({
            success: true,
            data: assignedCourses
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAssignedCourseController = getAssignedCourseController;
const updateCourseController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // --- MODIFIED LINE: Destructure 'contents' from req.body ---
        const { name, description, demoVideoUrl, imageUrl, categoryId, price, courseType, active, syllabus, contents } = req.body;
        // --- END MODIFIED LINE ---
        const { id } = req.params;
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN && !(role === constants_1.Role.TEACHER && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) && (yield (0, teacher_service_1.isTeacherAssignedService)(req.user.id, id)))) {
            throw new httpError_1.default('Unauthorized', 403);
        }
        if (!id) {
            throw new httpError_1.default('Course ID is required', 400);
        }
        // --- MODIFIED LINE: Pass 'contents' to the updateCourseService ---
        const updatedCourse = yield (0, Course_service_1.updateCourseService)(id, { name, description, imageUrl, categoryId, price, courseType, demoVideoUrl, active, syllabus, contents });
        // --- END MODIFIED LINE ---
        res.status(200).json({
            success: true,
            data: updatedCourse
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateCourseController = updateCourseController;
const deleteCourseController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized', 403);
        }
        const { id } = req.params;
        if (!id) {
            throw new httpError_1.default('Course ID is required', 400);
        }
        const response = yield (0, Course_service_1.deleteCourseService)(id);
        res.status(200).json(Object.assign({ success: true }, response));
    }
    catch (error) {
        next(error);
    }
});
exports.deleteCourseController = deleteCourseController;
const courseTeacherController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized', 403);
        }
        const { courseId, teacherId, operation } = req.body;
        if (!courseId || !teacherId || !operation) {
            throw new httpError_1.default('Please provide courseId, teacherId, and operation', 400);
        }
        const response = yield (0, Course_service_1.courseTeacherService)(courseId, teacherId, operation);
        res.status(200).json(Object.assign({ success: true }, response));
    }
    catch (error) {
        next(error);
    }
});
exports.courseTeacherController = courseTeacherController;
