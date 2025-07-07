import { Request, Response, NextFunction } from 'express';
import * as TeacherService from '../services/teacher.service';

export const getTeacherPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { teacherId } = req.params;
        const permissions = await TeacherService.getTeacherPermissions({ teacherId });
        res.status(200).json({ success: true, permissions });
    } catch (error) {
        next(error);
    }
};

export const updateTeacherPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { teacherId } = req.params;
        const { permissions } = req.body; // The frontend will send the new permissions object

        if (!permissions) {
            return res.status(400).json({ success: false, message: 'Permissions object is required.' });
        }

        const updatedTeacher = await TeacherService.updateTeacherPermissions({ teacherId, permissions });
        res.status(200).json({ success: true, message: 'Permissions updated successfully.', data: updatedTeacher });
    } catch (error) {
        next(error);
    }
};
