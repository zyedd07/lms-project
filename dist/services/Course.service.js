"use strict";
// src/services/Course.service.ts
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
exports.courseTeacherService = exports.deleteCourseService = exports.getAssignedCourseService = exports.getAllCoursesService = exports.getCourseByIdService = exports.updateCourseService = exports.createCourseService = void 0;
const Categories_model_1 = __importDefault(require("../models/Categories.model"));
const Course_model_1 = __importDefault(require("../models/Course.model")); // Ensure this import is correct and brings in the typed Course model
const CourseTeacher_model_1 = __importDefault(require("../models/CourseTeacher.model"));
const Teacher_model_1 = __importDefault(require("../models/Teacher.model"));
const constants_1 = require("../utils/constants");
const httpError_1 = __importDefault(require("../utils/httpError"));
const createCourseService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingCourse = yield Course_model_1.default.findOne({
            where: { name: params.name, categoryId: params.categoryId },
        });
        if (existingCourse) {
            throw new httpError_1.default("Course already exists with the same name and category", 400);
        }
        const newCourse = yield Course_model_1.default.create({
            name: params.name,
            description: params.description,
            imageUrl: params.imageUrl,
            categoryId: params.categoryId,
            price: params.price,
            courseType: params.courseType,
            demoVideoUrl: params.demoVideoUrl,
            active: params.active,
            syllabus: params.syllabus || [],
            contents: params.contents || [], // Ensure contents is also passed here
        });
        return newCourse;
    }
    catch (error) {
        throw error;
    }
});
exports.createCourseService = createCourseService;
const updateCourseService = (id, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const course = yield Course_model_1.default.findOne({
            where: { id: id }
        });
        if (!course) {
            throw new httpError_1.default('Course not found', 404);
        }
        // --- CORRECTED LINES ---
        // To safely access properties like 'syllabus' and 'contents' on the 'course' object
        // without TypeScript complaining about `Model<any, any>`, you can use:
        // 1. Explicitly casting `course` to the correct type (e.g., `Course & { syllabus: any[]; contents: any[]; }`)
        // 2. Using `course.get('propertyName')` method which is type-safe
        // 3. Ensuring your Sequelize model definition uses the correct instance typing (as provided in the last response for Course.model.ts)
        // Assuming your Course.model.ts now properly types the instance:
        // No explicit cast is needed IF your model typing is perfect and accessible.
        // However, if the error persists, a simple type assertion like `as any` or a more specific type
        // can temporarily resolve it while you refine your model's instance typing.
        // Let's use `as any` for quick fix, but the best long-term solution is strong model typing.
        const currentSyllabus = course.syllabus || [];
        const currentContents = course.contents || [];
        yield Course_model_1.default.update(Object.assign(Object.assign({}, params), { 
            // Use provided syllabus/contents if available, otherwise fallback to existing data
            syllabus: params.syllabus !== undefined ? params.syllabus : currentSyllabus, contents: params.contents !== undefined ? params.contents : currentContents }), {
            where: { id: id }
        });
        // --- END CORRECTED LINES ---
        const updatedCourse = yield Course_model_1.default.findByPk(id);
        return updatedCourse;
    }
    catch (error) {
        throw error;
    }
});
exports.updateCourseService = updateCourseService;
const getCourseByIdService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseData = yield Course_model_1.default.findOne({
            where: { id: id },
            include: [
                {
                    model: Teacher_model_1.default,
                    through: { attributes: [] },
                    as: 'teachers',
                    required: false,
                    attributes: ['id', 'name']
                },
                {
                    model: Categories_model_1.default,
                    as: 'category',
                    required: false,
                    attributes: ['id', 'name']
                }
            ]
        });
        if (!courseData) {
            return null;
        }
        return courseData;
    }
    catch (error) {
        console.error("Error in getCourseByIdService:", error);
        throw error;
    }
});
exports.getCourseByIdService = getCourseByIdService;
const getAllCoursesService = (_a, filters_1) => __awaiter(void 0, [_a, filters_1], void 0, function* ({ categoryId, id, active }, filters) {
    try {
        let whereClause = {};
        if (id) {
            whereClause = { id };
            if (active === true || active === false) {
                whereClause.active = active;
            }
            const courseData = yield Course_model_1.default.findOne({
                where: whereClause,
                include: [
                    {
                        model: Teacher_model_1.default,
                        through: { attributes: [] },
                        as: 'teachers',
                        required: false,
                        attributes: ['id', 'name']
                    },
                    {
                        model: Categories_model_1.default,
                        as: 'category',
                        required: false,
                        attributes: ['id', 'name']
                    }
                ],
                limit: filters === null || filters === void 0 ? void 0 : filters.limit,
                offset: filters === null || filters === void 0 ? void 0 : filters.offset
            });
            if (!courseData) {
                throw new httpError_1.default('Course not found', 404);
            }
            return courseData;
        }
        else {
            if (categoryId) {
                whereClause.categoryId = categoryId;
            }
            if (active === true || active === false) {
                whereClause.active = active;
            }
            const courses = yield Course_model_1.default.findAll({
                where: whereClause,
                limit: filters === null || filters === void 0 ? void 0 : filters.limit,
                offset: filters === null || filters === void 0 ? void 0 : filters.offset,
                include: [
                    {
                        model: Teacher_model_1.default,
                        through: { attributes: [] },
                        as: 'teachers',
                        required: false,
                        attributes: ['id', 'name']
                    },
                    {
                        model: Categories_model_1.default,
                        as: 'category',
                        required: false,
                        attributes: ['id', 'name']
                    }
                ]
            });
            return courses;
        }
    }
    catch (error) {
        throw error;
    }
});
exports.getAllCoursesService = getAllCoursesService;
const getAssignedCourseService = (teacherId, filters) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const assignedCourses = yield CourseTeacher_model_1.default.findAll({
            where: {
                teacherId
            },
            include: [
                {
                    model: Course_model_1.default,
                    as: 'course',
                    required: true,
                },
                {
                    model: Teacher_model_1.default,
                    as: 'teacher',
                    required: true,
                    attributes: ['id', 'name']
                }
            ],
            limit: filters === null || filters === void 0 ? void 0 : filters.limit,
            offset: filters === null || filters === void 0 ? void 0 : filters.offset,
        });
        const formattedData = assignedCourses.map((course) => {
            const plainCourse = course.get('course', { plain: true });
            const plainTeacher = course.get('teacher', { plain: true });
            return Object.assign(Object.assign({}, plainCourse), { teacher: plainTeacher });
        });
        return formattedData;
    }
    catch (error) {
        throw error;
    }
});
exports.getAssignedCourseService = getAssignedCourseService;
const deleteCourseService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const course = yield Course_model_1.default.findOne({
            where: { id }
        });
        if (!course) {
            throw new httpError_1.default('Course not found', 404);
        }
        yield course.destroy();
        return { message: 'Course deleted successfully' };
    }
    catch (error) {
        throw error;
    }
});
exports.deleteCourseService = deleteCourseService;
const courseTeacherService = (courseId, teacherId, operation) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const course = yield Course_model_1.default.findOne({
            where: { id: courseId }
        });
        if (!course) {
            throw new httpError_1.default('Course not found', 404);
        }
        const isAssigned = yield CourseTeacher_model_1.default.findOne({
            where: {
                courseId,
                teacherId
            }
        });
        if (isAssigned && operation === constants_1.CourseTeacherServiceOperation.ASSIGN) {
            throw new httpError_1.default('Teacher is already assigned to the course', 400);
        }
        if (!isAssigned && operation === constants_1.CourseTeacherServiceOperation.UNASSIGN) {
            throw new httpError_1.default('Teacher is not assigned to the course', 400);
        }
        if (operation === constants_1.CourseTeacherServiceOperation.ASSIGN) {
            yield CourseTeacher_model_1.default.create({
                courseId,
                teacherId
            });
        }
        if (operation === constants_1.CourseTeacherServiceOperation.UNASSIGN) {
            yield CourseTeacher_model_1.default.destroy({
                where: {
                    courseId,
                    teacherId
                }
            });
        }
        return { message: `Teacher ${operation}ed successfully` };
    }
    catch (error) {
        throw error;
    }
});
exports.courseTeacherService = courseTeacherService;
