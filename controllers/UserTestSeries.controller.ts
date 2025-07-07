import { Request, Response, NextFunction } from 'express';
import * as UserTestSeriesService from '../services/UserTestSeries.service';

export const enrollInTestSeries = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, testSeriesId } = req.body;
        const enrollment = await UserTestSeriesService.enrollUserInTestSeries({ userId, testSeriesId });
        res.status(201).json({ success: true, message: 'User enrolled in test series successfully.', data: enrollment });
    } catch (error) {
        next(error);
    }
};

export const getUserTestSeries = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const testSeries = await UserTestSeriesService.getEnrolledTestSeriesForUser({ userId });
        res.status(200).json({ success: true, data: testSeries });
    } catch (error) {
        next(error);
    }
};

export const unenrollFromTestSeries = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, testSeriesId } = req.body;
        await UserTestSeriesService.unenrollUserFromTestSeries({ userId, testSeriesId });
        res.status(200).json({ success: true, message: 'User unenrolled from test series successfully.' });
    } catch (error) {
        next(error);
    }
};

export const updateEnrollmentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, testSeriesId, status } = req.body;
        const updatedEnrollment = await UserTestSeriesService.updateTestSeriesEnrollmentStatus({ userId, testSeriesId, status });
        res.status(200).json({ success: true, message: 'Enrollment status updated successfully.', data: updatedEnrollment });
    } catch (error) {
        next(error);
    }
};
