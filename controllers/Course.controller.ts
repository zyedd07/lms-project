import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import { courseTeacherService, createCourseService, deleteCourseService, getAllCoursesService, getAssignedCourseService, updateCourseService } from "../services/Course.service";
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
        res.status(201).json(newCourse);
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
        if (role !== Role.ADMIN || !(await isTeacherAssignedService(req.user.id, id))) {
            throw new HttpError('Unauthorized', 403);
        }
        if (!id) {
            throw new HttpError('Course ID is required', 400);
        }
        const updatedCourse = await updateCourseService(id, { name, description, imageUrl, categoryId, price, courseType, demoVideoUrl, active });
        res.status(200).json({
            success: true,
            ...updatedCourse
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