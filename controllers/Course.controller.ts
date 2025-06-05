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
    addCourseContentService, // Imported for adding course content
    updateCourseContentService, // Imported for updating course content
    deleteCourseContentService, // Imported for deleting course content
} from "../services/Course.service";
import { Role } from "../utils/constants";
import { isTeacherAssignedService } from "../services/Teacher.service";
import {
    GetCourseFilters,
    AddCourseContentParams, // Used for typing the request body when adding content
    UpdateCourseContentParams, // Used for typing the request body when updating content
} from "../utils/types";

// --- Course Management Controllers ---

/**
 * @route POST /api/courses
 * @description Creates a new course.
 * @access Admin
 */
export const createCourseController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized', 403);
        }
        const { name, description, demoVideoUrl, imageUrl, categoryId, price, courseType, syllabus, active, contents } = req.body;
        if (!name || !categoryId || !courseType) {
            throw new HttpError('Please provide name, categoryId, and courseType', 400);
        }
        const newCourse = await createCourseService({ name, description, imageUrl, demoVideoUrl, categoryId, price, courseType, syllabus, active, contents });
        res.status(201).json({
            success: true,
            data: newCourse
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route GET /api/courses
 * @description Retrieves a list of courses, with optional filtering.
 * @access All (public for non-admin/teacher, with active filter applied; admin/teacher can view all)
 */
export const getCoursesController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        let activeFilter: boolean | undefined;

        // If the user is not an Admin or Teacher, only return active courses
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            activeFilter = true;
        } else {
            // Admins and Teachers can explicitly request active/inactive courses
            if (req.query.active !== undefined) {
                activeFilter = String(req.query.active).toLowerCase() === 'true';
            }
        }

        const { categoryId, id } = req.query; // 'id' here is for searching a single course via general GET endpoint
        const { limit, offset } = req.query;

        let filters: GetCourseFilters = {};
        if (limit) {
            filters.limit = parseInt(limit as string, 10);
        }
        if (offset) {
            filters.offset = parseInt(offset as string, 10);
        }

        const courses = await getAllCoursesService({
            categoryId: categoryId as string,
            id: id as string,
            active: activeFilter
        }, filters);

        res.status(200).json({
            success: true,
            data: courses
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route GET /api/courses/:id
 * @description Retrieves a single course by its ID.
 * @access All
 */
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

/**
 * @route GET /api/courses/assigned
 * @description Retrieves courses assigned to the authenticated teacher, or a specific teacher if admin.
 * @access Teacher | Admin
 */
export const getAssignedCourseController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        let teacherId = req.user?.id; // Default to authenticated user's ID

        if (role === Role.ADMIN) {
            // If admin, they can request assigned courses for a specific teacher via query param
            teacherId = req.query.teacherId as string;
            if (!teacherId) {
                throw new HttpError('Teacher ID is required in query parameters for admin', 400);
            }
        } else if (role !== Role.TEACHER) {
            // Only Teachers and Admins are authorized for this route
            throw new HttpError('Unauthorized', 403);
        }

        if (!teacherId) {
            throw new HttpError('Teacher ID is missing for authorization check', 400); // Should ideally not happen
        }

        const { limit, offset } = req.query;
        let filters: GetCourseFilters = {};
        if (limit) {
            filters.limit = parseInt(limit as string, 10);
        }
        if (offset) {
            filters.offset = parseInt(offset as string, 10);
        }

        const assignedCourses = await getAssignedCourseService(teacherId, filters);
        res.status(200).json({
            success: true,
            data: assignedCourses
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route PUT /api/courses/:id
 * @description Updates an existing course.
 * @access Admin | Teacher (assigned to course)
 */
export const updateCourseController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { name, description, demoVideoUrl, imageUrl, categoryId, price, courseType, active, syllabus, contents } = req.body;
        const { id } = req.params;
        const role = req.user?.role;
        const userId = req.user?.id;

        // Authorization: Only Admin or Teacher (assigned to the course) can update
        if (role !== Role.ADMIN && !(role === Role.TEACHER && userId && await isTeacherAssignedService(userId, id))) {
            throw new HttpError('Unauthorized', 403);
        }
        if (!id) {
            throw new HttpError('Course ID is required', 400);
        }
        const updatedCourse = await updateCourseService(id, { name, description, imageUrl, categoryId, price, courseType, demoVideoUrl, active, syllabus, contents });
        res.status(200).json({
            success: true,
            data: updatedCourse
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route DELETE /api/courses/:id
 * @description Deletes a course.
 * @access Admin
 */
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
};

/**
 * @route POST /api/courses/assign-teacher
 * @description Assigns or unassigns a teacher to/from a course.
 * @access Admin
 */
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
};

---

### New Course Content Controllers

These controllers handle the operations on the `contents` JSONB array within a course.

/**
 * @route POST /api/courses/:courseId/contents
 * @description Adds a new content item (lesson/video) to a specific course.
 * @access Admin | Teacher (assigned to course)
 */
export const addCourseContentController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { courseId } = req.params;
        const contentParams: AddCourseContentParams = req.body; // Type check for incoming data
        const role = req.user?.role;
        const userId = req.user?.id;

        // Authorization: Only Admin or Teacher (assigned to course) can add content
        if (role !== Role.ADMIN && !(role === Role.TEACHER && userId && await isTeacherAssignedService(userId, courseId))) {
            throw new HttpError('Unauthorized to add content to this course', 403);
        }

        // Validation for required content fields
        if (!courseId) {
            throw new HttpError('Course ID is required in URL parameters', 400);
        }
        if (!contentParams.title || !contentParams.video_url) {
            throw new HttpError('Title and video URL are required for new content', 400);
        }

        const newContent = await addCourseContentService(courseId, contentParams);

        res.status(201).json({
            success: true,
            message: 'Content item added successfully',
            data: newContent
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route PUT /api/courses/:courseId/contents/:contentId
 * @description Updates an existing content item within a course.
 * @access Admin | Teacher (assigned to course)
 */
export const updateCourseContentController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { courseId, contentId } = req.params;
        const updates: UpdateCourseContentParams = req.body; // Type check for incoming data
        const role = req.user?.role;
        const userId = req.user?.id;

        // Authorization: Only Admin or Teacher (assigned to course) can update content
        if (role !== Role.ADMIN && !(role === Role.TEACHER && userId && await isTeacherAssignedService(userId, courseId))) {
            throw new HttpError('Unauthorized to update content for this course', 403);
        }

        // Basic validation
        if (!courseId || !contentId) {
            throw new HttpError('Course ID and Content ID are required in URL parameters', 400);
        }
        if (Object.keys(updates).length === 0) {
            throw new HttpError('No update parameters provided', 400);
        }

        const updatedContent = await updateCourseContentService(courseId, contentId, updates);

        if (!updatedContent) {
            // This might happen if contentId doesn't exist, or update failed internally
            throw new HttpError('Content item not found within this course or failed to update', 404);
        }

        res.status(200).json({
            success: true,
            message: 'Content item updated successfully',
            data: updatedContent
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route DELETE /api/courses/:courseId/contents/:contentId
 * @description Deletes a specific content item from a course.
 * @access Admin | Teacher (assigned to course)
 */
export const deleteCourseContentController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { courseId, contentId } = req.params;
        const role = req.user?.role;
        const userId = req.user?.id;

        // Authorization: Only Admin or Teacher (assigned to course) can delete content
        if (role !== Role.ADMIN && !(role === Role.TEACHER && userId && await isTeacherAssignedService(userId, courseId))) {
            throw new HttpError('Unauthorized to delete content from this course', 403);
        }

        // Basic validation
        if (!courseId || !contentId) {
            throw new HttpError('Course ID and Content ID are required in URL parameters', 400);
        }

        const response = await deleteCourseContentService(courseId, contentId);

        res.status(200).json({
            success: true,
            ...response
        });
    } catch (error) {
        next(error);
    }
};
