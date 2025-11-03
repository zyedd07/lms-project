import { Response, NextFunction } from 'express';
import * as notificationService from '../services/Notification.service';
import { AuthenticatedRequest, CreateNotificationServiceParams, UpdateNotificationServiceParams, CreateBroadcastNotificationParams } from '../utils/types';
import HttpError from '../utils/httpError';

// --- Admin Controllers ---

/**
 * @description Controller for an admin to get all notifications.
 */
export const getAllNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const notifications = await notificationService.getAllNotificationsService();
        res.status(200).json({
            success: true,
            message: "All notifications fetched successfully.",
            data: notifications
        });
    } catch (error) {
        console.error("Error in getAllNotifications:", error);
        next(error);
    }
};

/**
 * @description Controller for an admin to create a notification for a specific user.
 */
export const createNotificationForUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { userId, type, text, link } = req.body as CreateNotificationServiceParams;
        if (!userId || !type || !text) {
            throw new HttpError("User ID, type, and text are required", 400);
        }
        const newNotification = await notificationService.createNotificationService({ userId, type, text, link });
        res.status(201).json({ success: true, message: "Notification created successfully.", data: newNotification });
    } catch (error) {
        console.error("Error in createNotificationForUser:", error);
        next(error);
    }
};

/**
 * @description Controller for an admin to create a broadcast notification for all users.
 */
export const createBroadcastNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { type, text, link } = req.body as CreateBroadcastNotificationParams;
        if (!type || !text) {
            throw new HttpError("Type and text are required for a broadcast", 400);
        }
        const result = await notificationService.createBroadcastNotificationService({ type, text, link });
        res.status(201).json({ success: true, ...result });
    } catch (error) {
        console.error("Error in createBroadcastNotification:", error);
        next(error);
    }
};

/**
 * @description Controller for an admin to update an existing notification.
 */
export const updateNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { notificationId } = req.params;
        const updateData: UpdateNotificationServiceParams = req.body;
        if (!notificationId) {
            throw new HttpError('Bad Request: Notification ID is required', 400);
        }
        if (Object.keys(updateData).length === 0) {
            throw new HttpError("Bad Request: No update data provided", 400);
        }
        const updatedNotification = await notificationService.updateNotificationService(notificationId, updateData);
        res.status(200).json({ success: true, message: "Notification updated.", data: updatedNotification });
    } catch (error) {
        console.error("Error in updateNotification:", error);
        next(error);
    }
};

/**
 * @description Controller for an admin to delete a notification.
 */
export const deleteNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { notificationId } = req.params;
        if (!notificationId) {
            throw new HttpError('Bad Request: Notification ID is required', 400);
        }
        const result = await notificationService.deleteNotificationService(notificationId);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        console.error("Error in deleteNotification:", error);
        next(error);
    }
};

// --- User-facing Controllers ---

/**
 * @description Controller to get the current user's unread notifications (limit 10).
 */
export const getMyNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            throw new HttpError("User not authenticated.", 401);
        }
        const notifications = await notificationService.getUnreadNotificationsByUserService(req.user.id);
        res.status(200).json({ success: true, message: "Unread notifications fetched successfully", data: notifications });
    } catch (error) {
        console.error("Error in getMyNotifications:", error);
        next(error);
    }
};

/**
 * @description Controller to get ALL of the current user's notifications.
 */
export const getAllMyNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            throw new HttpError("User not authenticated.", 401);
        }
        const notifications = await notificationService.getAllNotificationsByUserService(req.user.id);
        res.status(200).json({ success: true, message: "All notifications fetched successfully", data: notifications });
    } catch (error) {
        console.error("Error in getAllMyNotifications:", error);
        next(error);
    }
};

/**
 * @description Controller to mark a specific notification as read.
 */
export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            throw new HttpError("User not authenticated.", 401);
        }
        const { notificationId } = req.params;
        if (!notificationId) {
            throw new HttpError('Bad Request: Notification ID is required', 400);
        }
        const result = await notificationService.markNotificationAsReadService(notificationId, req.user.id);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        console.error("Error in markAsRead:", error);
        next(error);
    }
};

/**
 * @description Controller to mark all of a user's unread notifications as read.
 */
export const markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            throw new HttpError("User not authenticated.", 401);
        }
        const result = await notificationService.markAllNotificationsAsReadService(req.user.id);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        console.error("Error in markAllAsRead:", error);
        next(error);
    }
};
