// src/controllers/Course.controller.ts

import { NextFunction, Request, Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import {
    courseTeacherService,
    createCourseService,
    deleteCourseService,
    getAllCoursesService,
    getAssignedCourseService,
    updateCourseService,
    getCourseByIdService,
} from "../services/Course.service";
import { Role } from "../utils/constants";
import { isTeacherAssignedService } from "../services/teacher.service";
import { GetCourseFilters } from "../utils/types"; 
// Make sure to import CourseContentModule if you want to use it for type checking the request body
// import { CourseContentModule } from "../utils/types"; 

export const createCourseController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        // FIX: Get uploaderId from the authenticated user
        const uploaderId = req.user?.id;

        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized', 403);
        }
        // --- MODIFIED LINE: Destructure 'contents' from req.body ---
        const { name, description, demoVideoUrl, imageUrl, categoryId, price, courseType, syllabus, contents } = req.body;
        // --- END MODIFIED LINE ---
        if (!name || !categoryId || !courseType) {
            throw new HttpError('Please provide name, categoryId, and courseType', 400);
        }
        // FIX: Ensure uploaderId is present
        if (!uploaderId) {
            throw new HttpError('Uploader information is missing.', 400);
        }

        // --- MODIFIED LINE: Pass 'contents' and 'uploaderId' to the createCourseService ---
        const newCourse = await createCourseService({ 
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
    } catch (error) {
        next(error);
    }
}

export const getCoursesController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        let active;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            active = true;
        }
        const { categoryId, id, assigned, limit, offset } = req.query;
        let filters: GetCourseFilters = {};
        if (limit) {
            filters.limit = parseInt(limit as string);
        }
        if (offset) {
            filters.offset = parseInt(offset as string);
        }
        const courses = await getAllCoursesService({ categoryId: categoryId as string, id: id as string, active: active }, filters);
        res.status(200).json({
            success: true,
            data: courses
        });
    } catch (error) {
        next(error);
    }
};

export const getCourseByIdController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new HttpError('Course ID is required in URL parameters', 400);
        }

        const course = await getCourseByIdService(id);

        if (!course) {
            throw new HttpError('Course not found', 404);
        }

        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        next(error);
    }
};

export const getAssignedCourseController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        let teacherId = req.user?.id;
        if (role === Role.ADMIN) {
            teacherId = req.query.teacherId as string; // Ensure type is string
        } else if (role !== Role.TEACHER) {
            throw new HttpError('Unauthorized', 403);
        }
        const { limit, offset } = req.query;

        let filters: GetCourseFilters = {};
        if (limit) {
            filters.limit = parseInt(limit as string);
        }
        if (offset) {
            filters.offset = parseInt(offset as string);
        }
        const assignedCourses = await getAssignedCourseService(teacherId as string, filters); // Ensure teacherId is string
        res.status(200).json({
            success: true,
            data: assignedCourses
        });
    } catch (error) {
        next(error);
    }
}

export const updateCourseController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // --- MODIFIED LINE: Destructure 'contents' from req.body ---
        const { name, description, demoVideoUrl, imageUrl, categoryId, price, courseType, active, syllabus, contents } = req.body;
        // --- END MODIFIED LINE ---
        const { id } = req.params;
        const role = req.user?.role;

        if (role !== Role.ADMIN && !(role === Role.TEACHER && req.user?.id && await isTeacherAssignedService(req.user.id, id))) {
            throw new HttpError('Unauthorized', 403);
        }
        if (!id) {
            throw new HttpError('Course ID is required', 400);
        }
        // --- MODIFIED LINE: Pass 'contents' to the updateCourseService ---
        const updatedCourse = await updateCourseService(id, { name, description, imageUrl, categoryId, price, courseType, demoVideoUrl, active, syllabus, contents });
        // --- END MODIFIED LINE ---
        res.status(200).json({
            success: true,
            data: updatedCourse
        });
    } catch (error) {
        next(error);
    }
}

export const deleteCourseController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized', 403);
        }
        const { id } = req.params;
        if (!id) {
            throw new HttpError('Course ID is required', 400);
        }
        const response = await deleteCourseService(id);
        res.status(200).json({
            success: true,
            ...response
        });
    } catch (error) {
        next(error);
    }
}

export const courseTeacherController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized', 403);
        }
        const { courseId, teacherId, operation } = req.body;
        if (!courseId || !teacherId || !operation) {
            throw new HttpError('Please provide courseId, teacherId, and operation', 400);
        }
        const response = await courseTeacherService(courseId, teacherId, operation);
        res.status(200).json({
            success: true,
            ...response
        });
    } catch (error) {
        next(error);
    }
}
