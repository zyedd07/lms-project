import { Request, Response, NextFunction } from 'express';
import * as UserCourseService from '../services/UserCourse.service';

export const enrollInCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, courseId } = req.body;
        if (!userId || !courseId) {
            return res.status(400).json({ success: false, message: 'User ID and Course ID are required.' });
        }
        // FIX: Pass arguments as a single object to match the service function
        const enrollment = await UserCourseService.enrollUserInCourse({ userId, courseId });
        res.status(201).json({ success: true, message: 'User enrolled successfully.', data: enrollment });
    } catch (error) {
        next(error);
    }
};

export const getUserCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        // FIX: Pass argument as a single object
        const courses = await UserCourseService.getEnrolledCoursesForUser({ userId });
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        next(error);
    }
};

export const unenrollFromCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, courseId } = req.body;
        if (!userId || !courseId) {
            return res.status(400).json({ success: false, message: 'User ID and Course ID are required.' });
        }
        // FIX: Pass arguments as a single object
        await UserCourseService.unenrollUserFromCourse({ userId, courseId });
        res.status(200).json({ success: true, message: 'User unenrolled successfully.' });
    } catch (error) {
        next(error);
    }
};

export const updateEnrollmentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, courseId, status } = req.body;
        if (!userId || !courseId || !status) {
            return res.status(400).json({ success: false, message: 'User ID, Course ID, and a new status are required.' });
        }
        // FIX: Pass arguments as a single object
        const updatedEnrollment = await UserCourseService.updateEnrollmentStatus({ userId, courseId, status });
        res.status(200).json({ success: true, message: 'Enrollment status updated successfully.', data: updatedEnrollment });
    } catch (error) {
        next(error);
    }
};
