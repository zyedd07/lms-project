import Notification from '../models/Notification.model';
import User from '../models/User.model'; // Import User model for broadcast and associations
import HttpError from '../utils/httpError';
import { CreateNotificationServiceParams, UpdateNotificationServiceParams, CreateBroadcastNotificationParams } from '../utils/types';

/**
 * @description Get all notifications for the admin panel, including user details.
 * @returns {Promise<Notification[]>} A list of all notifications.
 */
export const getAllNotificationsService = async () => {
    try {
        const notifications = await Notification.findAll({
            order: [['createdAt', 'DESC']],
            include: [{
                model: User,
                as: 'user', // This alias must match your association definition
                attributes: ['name', 'email'] // Fetches associated user's name and email
            }]
        });
        return notifications;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Create a new notification for a specific user.
 * @param {CreateNotificationServiceParams} params - Data for the new notification.
 * @returns {Promise<Notification>} The created notification.
 */
export const createNotificationService = async (params: CreateNotificationServiceParams) => {
    try {
        const newNotification = await Notification.create(params);
        return newNotification;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Create a notification for every user (broadcast).
 * @param {CreateBroadcastNotificationParams} params - Data for the broadcast.
 * @returns {Promise<{ message: string, count: number }>} Success message and count.
 */
export const createBroadcastNotificationService = async (params: CreateBroadcastNotificationParams) => {
    try {
        const users = await User.findAll({ attributes: ['id'], raw: true });
        if (users.length === 0) {
            return { message: "No users found to send notifications to.", count: 0 };
        }

        const notificationsToCreate = users.map(user => ({
            userId: (user as any).id,
            type: params.type,
            text: params.text,
            link: params.link,
        }));

        await Notification.bulkCreate(notificationsToCreate);
        return {
            message: "Broadcast notification sent successfully to all users.",
            count: notificationsToCreate.length
        };
    } catch (error) {
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
            limit: 10 // Return only the last 10 unread notifications for the dropdown
        });
        return notifications;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Get ALL notifications for a specific user (read and unread).
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Notification[]>} A complete list of the user's notifications.
 */
export const getAllNotificationsByUserService = async (userId: string) => {
    try {
        const notifications = await Notification.findAll({
            where: {
                userId, // Filter by the user ID
            },
            order: [['createdAt', 'DESC']], // Get the newest ones first
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

/**
 * @description Update an existing notification (Admin only).
 * @param {string} notificationId - The ID of the notification to update.
 * @param {UpdateNotificationServiceParams} params - The fields to update.
 * @returns {Promise<Notification>} The updated notification instance.
 */
export const updateNotificationService = async (notificationId: string, params: UpdateNotificationServiceParams) => {
    try {
        const notification = await Notification.findByPk(notificationId);

        if (!notification) {
            throw new HttpError("Notification not found", 404);
        }

        const updatedNotification = await notification.update(params);
        return updatedNotification;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Delete a notification (Admin only).
 * @param {string} notificationId - The ID of the notification to delete.
 * @returns {Promise<{ message: string }>} Success message.
 */
export const deleteNotificationService = async (notificationId: string) => {
    try {
        const notification = await Notification.findByPk(notificationId);

        if (!notification) {
            throw new HttpError("Notification not found", 404);
        }

        await notification.destroy();
        return { message: "Notification deleted successfully" };
    } catch (error) {
        throw error;
    }
};
