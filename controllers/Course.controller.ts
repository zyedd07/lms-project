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
    // Add the import for the new service function here
    getCourseByIdService, // <--- ADD THIS LINE
} from "../services/Course.service"; // Make sure this path is correct
import { Role } from "../utils/constants";
import { isTeacherAssignedService } from "../services/Teacher.service";
import { GetCourseFilters } from "../utils/types";

export const createCourseController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized', 403);
        }
        const { name, description, demoVideoUrl, imageUrl, categoryId, price, courseType, } = req.body;
        if (!name || !categoryId || !courseType) {
            throw new HttpError('Please provide name, categoryId, and courseType', 400);
        }
        const newCourse = await createCourseService({ name, description, imageUrl, demoVideoUrl, categoryId, price, courseType });
        res.status(201).json({
            success: true, // Added success: true for consistency with other responses
            data: newCourse // Wrapped in data for consistency
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
        // Note: The 'id' here is a query parameter, not a URL parameter
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

// ******* ADD THIS NEW CONTROLLER FUNCTION *******
export const getCourseByIdController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters (e.g., /course/123)
        // You might want to add role-based access here if only certain roles can view course details
        // For now, assuming anyone authenticated can view details.
        // If course `active` status matters for public access, handle it in the service.

        if (!id) {
            throw new HttpError('Course ID is required in URL parameters', 400);
        }

        const course = await getCourseByIdService(id); // Call the new service function

        if (!course) {
            throw new HttpError('Course not found', 404); // If service returns null/undefined
        }

        res.status(200).json({
            success: true,
            data: course // Send the single course object in 'data'
        });
    } catch (error) {
        next(error);
    }
};
// *************************************************

export const getAssignedCourseController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        let teacherId = req.user?.id;
        if (role === Role.ADMIN) {
            teacherId = req.query.teacherId;
        }
        else if (role !== Role.TEACHER) {
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
        const assignedCourses = await getAssignedCourseService(teacherId, filters);
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
        const { name, description, demoVideoUrl, imageUrl, categoryId, price, courseType, active } = req.body;
        const { id } = req.params;
        const role = req.user?.role;
        // The original logic here was if (role !== Role.ADMIN || !(await isTeacherAssignedService(req.user.id, id)))
        // This means ONLY ADMIN or an assigned teacher could update.
        // Assuming ADMIN can update regardless of assignment, and teacher must be assigned.
        if (role !== Role.ADMIN && !(role === Role.TEACHER && req.user?.id && await isTeacherAssignedService(req.user.id, id))) {
            throw new HttpError('Unauthorized', 403);
        }
        if (!id) {
            throw new HttpError('Course ID is required', 400);
        }
        const updatedCourse = await updateCourseService(id, { name, description, imageUrl, categoryId, price, courseType, demoVideoUrl, active });
        res.status(200).json({
            success: true,
            data: updatedCourse // Wrapped in data for consistency
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
            ...response // Assuming deleteCourseService returns { message: '...' }
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
