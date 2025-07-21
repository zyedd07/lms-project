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
exports.updateEnrollmentStatus = exports.unenrollUserFromCourse = exports.getEnrolledCoursesForUser = exports.enrollUserInCourse = void 0;
const UserCourse_model_1 = __importDefault(require("../models/UserCourse.model"));
const Course_model_1 = __importDefault(require("../models/Course.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const enrollUserInCourse = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, courseId }) {
    // Check if the enrollment already exists
    const existingEnrollment = yield UserCourse_model_1.default.findOne({
        where: { userId, courseId }
    });
    if (existingEnrollment) {
        throw new httpError_1.default("User is already enrolled in this course.", 409); // 409 Conflict
    }
    // The status will default to 'active' based on the model definition.
    const newEnrollment = yield UserCourse_model_1.default.create({ userId, courseId });
    return newEnrollment;
});
exports.enrollUserInCourse = enrollUserInCourse;
const getEnrolledCoursesForUser = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId }) {
    const enrollments = yield UserCourse_model_1.default.findAll({
        where: { userId },
        include: [{
                model: Course_model_1.default,
                attributes: ['id', 'name', 'description', 'price', 'contents'] // Use 'name' to match your Course model
            }]
    });
    return enrollments;
});
exports.getEnrolledCoursesForUser = getEnrolledCoursesForUser;
const unenrollUserFromCourse = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, courseId }) {
    const result = yield UserCourse_model_1.default.destroy({
        where: { userId, courseId }
    });
    if (result === 0) {
        throw new httpError_1.default("Enrollment record not found.", 404);
    }
    return true;
});
exports.unenrollUserFromCourse = unenrollUserFromCourse;
/**
 * Updates the status of an existing enrollment.
 * @param userId The ID of the user.
 * @param courseId The ID of the course.
 * @param status The new status ('active', 'completed', or 'dropped').
 */
const updateEnrollmentStatus = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, courseId, status }) {
    const enrollment = yield UserCourse_model_1.default.findOne({
        where: { userId, courseId }
    });
    if (!enrollment) {
        throw new httpError_1.default("Enrollment record not found.", 404);
    }
    // FIX: Cast the generic model instance to 'any' to allow property access.
    // This resolves the "Property 'status' does not exist" error.
    enrollment.status = status;
    yield enrollment.save();
    return enrollment;
});
exports.updateEnrollmentStatus = updateEnrollmentStatus;
