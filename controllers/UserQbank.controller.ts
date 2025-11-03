import { Request, Response, NextFunction } from 'express';
import * as UserQbankService from '../services/UserQbank.service';

export const enrollInQbank = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, qbankId } = req.body;
        const enrollment = await UserQbankService.enrollUserInQbank({ userId, qbankId });
        res.status(201).json({ success: true, message: 'User enrolled in Q-Bank successfully.', data: enrollment });
    } catch (error) {
        next(error);
    }
};

export const getUserQbanks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const qbanks = await UserQbankService.getEnrolledQbanksForUser({ userId });
        res.status(200).json({ success: true, data: qbanks });
    } catch (error) {
        next(error);
    }
};

export const unenrollFromQbank = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, qbankId } = req.body;
        await UserQbankService.unenrollUserFromQbank({ userId, qbankId });
        res.status(200).json({ success: true, message: 'User unenrolled from Q-Bank successfully.' });
    } catch (error) {
        next(error);
    }
};

export const updateEnrollmentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, qbankId, status } = req.body;
        const updatedEnrollment = await UserQbankService.updateQbankEnrollmentStatus({ userId, qbankId, status });
        res.status(200).json({ success: true, message: 'Enrollment status updated successfully.', data: updatedEnrollment });
    } catch (error) {
        next(error);
    }
};
