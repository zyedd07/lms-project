import Notification from '../models/Notification.model';
import HttpError from '../utils/httpError'; // Assuming you have a custom HttpError utility
import { CreateNotificationServiceParams } from '../utils/types';

/**
 * @description Create a new notification.
 * @param {CreateNotificationServiceParams} params - Data for the new notification.
 * @returns {Promise<Notification>} The created notification.
 */
export const createNotificationService = async (params: CreateNotificationServiceParams) => {
    try {
        // You could add a check here to ensure the user ID is valid before creating.
        const newNotification = await Notification.create(params);
        return newNotification;
    } catch (error) {
        // Throw the error to be handled by the controller or a global error handler.
        throw error;
    }
};

/**
 * @description Get all unread notifications for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Notification[]>} A list of the user's unread notifications.
 */
export const getUnreadNotificationsByUserService = async (userId: string) => {
    try {
        const notifications = await Notification.findAll({
            where: {
                userId,
                isRead: false,
            },
            order: [['createdAt', 'DESC']],
        });
        return notifications;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Mark a single notification as read.
 * @param {string} notificationId - The ID of the notification.
 * @param {string} userId - The ID of the user (for authorization).
 * @returns {Promise<{ message: string }>} Success message.
 */
export const markNotificationAsReadService = async (notificationId: string, userId: string) => {
    try {
        const notification = await Notification.findOne({
            where: { id: notificationId, userId },
        });

        if (!notification) {
            throw new HttpError("Notification not found or you do not have permission to view it", 404);
        }

        if (notification.isRead) {
            return { message: "Notification is already marked as read." };
        }

        await notification.update({ isRead: true });

        return { message: "Notification marked as read successfully" };
    } catch (error) {
        throw error;
    }
};

/**
 * @description Mark all of a user's unread notifications as read.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<{ message: string }>} Success message.
 */
export const markAllNotificationsAsReadService = async (userId: string) => {
    try {
        // The update method returns an array with the number of affected rows.
        await Notification.update(
            { isRead: true },
            {
                where: {
                    userId,
                    isRead: false,
                },
            }
        );
        return { message: "All notifications marked as read successfully" };
    } catch (error) {
        throw error;
    }
};
