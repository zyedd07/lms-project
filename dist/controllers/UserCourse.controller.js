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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEnrollmentStatus = exports.unenrollFromCourse = exports.getUserCourses = exports.enrollInCourse = void 0;
const UserCourseService = __importStar(require("../services/UserCourse.service"));
const enrollInCourse = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, courseId } = req.body;
        if (!userId || !courseId) {
            return res.status(400).json({ success: false, message: 'User ID and Course ID are required.' });
        }
        // FIX: Pass arguments as a single object to match the service function
        const enrollment = yield UserCourseService.enrollUserInCourse({ userId, courseId });
        res.status(201).json({ success: true, message: 'User enrolled successfully.', data: enrollment });
    }
    catch (error) {
        next(error);
    }
});
exports.enrollInCourse = enrollInCourse;
const getUserCourses = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        // FIX: Pass argument as a single object
        const courses = yield UserCourseService.getEnrolledCoursesForUser({ userId });
        res.status(200).json({ success: true, data: courses });
    }
    catch (error) {
        next(error);
    }
});
exports.getUserCourses = getUserCourses;
const unenrollFromCourse = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, courseId } = req.body;
        if (!userId || !courseId) {
            return res.status(400).json({ success: false, message: 'User ID and Course ID are required.' });
        }
        // FIX: Pass arguments as a single object
        yield UserCourseService.unenrollUserFromCourse({ userId, courseId });
        res.status(200).json({ success: true, message: 'User unenrolled successfully.' });
    }
    catch (error) {
        next(error);
    }
});
exports.unenrollFromCourse = unenrollFromCourse;
const updateEnrollmentStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, courseId, status } = req.body;
        if (!userId || !courseId || !status) {
            return res.status(400).json({ success: false, message: 'User ID, Course ID, and a new status are required.' });
        }
        // FIX: Pass arguments as a single object
        const updatedEnrollment = yield UserCourseService.updateEnrollmentStatus({ userId, courseId, status });
        res.status(200).json({ success: true, message: 'Enrollment status updated successfully.', data: updatedEnrollment });
    }
    catch (error) {
        next(error);
    }
});
exports.updateEnrollmentStatus = updateEnrollmentStatus;
