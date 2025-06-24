import { Response, NextFunction } from 'express';
import {
    getUnreadNotificationsByUserService,
    markNotificationAsReadService,
    markAllNotificationsAsReadService
} from '../services/Notification.service';
import { AuthenticatedRequest } from '../middleware/auth'; // Matched import path from your example
import HttpError from '../utils/httpError';

/**
 * @description Controller to get the current user's unread notifications.
 */
export const getMyNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("User not authenticated.", 401);
        }
        const userId = req.user.id;

        const notifications = await getUnreadNotificationsByUserService(userId);
        
        res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            data: notifications
        });
    } catch (error) {
        console.error("Error in getMyNotifications:", error);
        next(error);
    }
};

/**
 * @description Controller to mark a specific notification as read.
 */
export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("User not authenticated.", 401);
        }
        const userId = req.user.id;
        const { notificationId } = req.params;

        if (!notificationId) {
            throw new HttpError('Bad Request: Notification ID is required in params', 400);
        }

        const result = await markNotificationAsReadService(notificationId, userId);
        
        res.status(200).json({ 
            success: true, 
            message: result.message 
        });
    } catch (error) {
        console.error("Error in markAsRead:", error);
        next(error);
    }
};

/**
 * @description Controller to mark all of the user's notifications as read.
 */
export const markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("User not authenticated.", 401);
        }
        const userId = req.user.id;

        const result = await markAllNotificationsAsReadService(userId);

        res.status(200).json({ 
            success: true, 
            message: result.message 
        });
    } catch (error) {
        console.error("Error in markAllAsRead:", error);
        next(error);
    }
};
