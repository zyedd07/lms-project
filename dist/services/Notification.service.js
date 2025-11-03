"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotificationService = exports.updateNotificationService = exports.markAllNotificationsAsReadService = exports.markNotificationAsReadService = exports.getAllNotificationsByUserService = exports.getUnreadNotificationsByUserService = exports.createBroadcastNotificationService = exports.createNotificationService = exports.getAllNotificationsService = void 0;
const Notification_model_1 = __importDefault(require("../models/Notification.model"));
const User_model_1 = __importDefault(require("../models/User.model")); // Import User model for broadcast and associations
const httpError_1 = __importDefault(require("../utils/httpError"));
/**
 * @description Get all notifications for the admin panel, including user details.
 * @returns {Promise<Notification[]>} A list of all notifications.
 */
const getAllNotificationsService = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield Notification_model_1.default.findAll({
            order: [['createdAt', 'DESC']],
            include: [{
                    model: User_model_1.default,
                    as: 'user', // This alias must match your association definition
                    attributes: ['name', 'email'] // Fetches associated user's name and email
                }]
        });
        return notifications;
    }
    catch (error) {
        throw error;
    }
});
exports.getAllNotificationsService = getAllNotificationsService;
/**
 * @description Create a new notification for a specific user.
 * @param {CreateNotificationServiceParams} params - Data for the new notification.
 * @returns {Promise<Notification>} The created notification.
 */
const createNotificationService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newNotification = yield Notification_model_1.default.create(params);
        return newNotification;
    }
    catch (error) {
        throw error;
    }
});
exports.createNotificationService = createNotificationService;
/**
 * @description Create a notification for every user (broadcast).
 * @param {CreateBroadcastNotificationParams} params - Data for the broadcast.
 * @returns {Promise<{ message: string, count: number }>} Success message and count.
 */
const createBroadcastNotificationService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield User_model_1.default.findAll({ attributes: ['id'], raw: true });
        if (users.length === 0) {
            return { message: "No users found to send notifications to.", count: 0 };
        }
        const notificationsToCreate = users.map(user => ({
            userId: user.id,
            type: params.type,
            text: params.text,
            link: params.link,
        }));
        yield Notification_model_1.default.bulkCreate(notificationsToCreate);
        return {
            message: "Broadcast notification sent successfully to all users.",
            count: notificationsToCreate.length
        };
    }
    catch (error) {
        throw error;
    }
});
exports.createBroadcastNotificationService = createBroadcastNotificationService;
/**
 * @description Get all unread notifications for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Notification[]>} A list of the user's unread notifications.
 */
const getUnreadNotificationsByUserService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield Notification_model_1.default.findAll({
            where: {
                userId,
                isRead: false,
            },
            order: [['createdAt', 'DESC']],
            limit: 10 // Return only the last 10 unread notifications for the dropdown
        });
        return notifications;
    }
    catch (error) {
        throw error;
    }
});
exports.getUnreadNotificationsByUserService = getUnreadNotificationsByUserService;
/**
 * @description Get ALL notifications for a specific user (read and unread).
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Notification[]>} A complete list of the user's notifications.
 */
const getAllNotificationsByUserService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield Notification_model_1.default.findAll({
            where: {
                userId, // Filter by the user ID
            },
            order: [['createdAt', 'DESC']], // Get the newest ones first
        });
        return notifications;
    }
    catch (error) {
        throw error;
    }
});
exports.getAllNotificationsByUserService = getAllNotificationsByUserService;
/**
 * @description Mark a single notification as read.
 * @param {string} notificationId - The ID of the notification.
 * @param {string} userId - The ID of the user (for authorization).
 * @returns {Promise<{ message: string }>} Success message.
 */
const markNotificationAsReadService = (notificationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield Notification_model_1.default.findOne({
            where: { id: notificationId, userId },
        });
        if (!notification) {
            throw new httpError_1.default("Notification not found or you do not have permission to view it", 404);
        }
        if (notification.isRead) {
            return { message: "Notification is already marked as read." };
        }
        yield notification.update({ isRead: true });
        return { message: "Notification marked as read successfully" };
    }
    catch (error) {
        throw error;
    }
});
exports.markNotificationAsReadService = markNotificationAsReadService;
/**
 * @description Mark all of a user's unread notifications as read.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<{ message: string }>} Success message.
 */
const markAllNotificationsAsReadService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Notification_model_1.default.update({ isRead: true }, {
            where: {
                userId,
                isRead: false,
            },
        });
        return { message: "All notifications marked as read successfully" };
    }
    catch (error) {
        throw error;
    }
});
exports.markAllNotificationsAsReadService = markAllNotificationsAsReadService;
/**
 * @description Update an existing notification (Admin only).
 * @param {string} notificationId - The ID of the notification to update.
 * @param {UpdateNotificationServiceParams} params - The fields to update.
 * @returns {Promise<Notification>} The updated notification instance.
 */
const updateNotificationService = (notificationId, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield Notification_model_1.default.findByPk(notificationId);
        if (!notification) {
            throw new httpError_1.default("Notification not found", 404);
        }
        const updatedNotification = yield notification.update(params);
        return updatedNotification;
    }
    catch (error) {
        throw error;
    }
});
exports.updateNotificationService = updateNotificationService;
/**
 * @description Delete a notification (Admin only).
 * @param {string} notificationId - The ID of the notification to delete.
 * @returns {Promise<{ message: string }>} Success message.
 */
const deleteNotificationService = (notificationId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield Notification_model_1.default.findByPk(notificationId);
        if (!notification) {
            throw new httpError_1.default("Notification not found", 404);
        }
        yield notification.destroy();
        return { message: "Notification deleted successfully" };
    }
    catch (error) {
        throw error;
    }
});
exports.deleteNotificationService = deleteNotificationService;
