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
exports.markAllNotificationsAsReadService = exports.markNotificationAsReadService = exports.getUnreadNotificationsByUserService = exports.createNotificationService = void 0;
const Notification_model_1 = __importDefault(require("../models/Notification.model"));
const httpError_1 = __importDefault(require("../utils/httpError")); // Assuming you have a custom HttpError utility
/**
 * @description Create a new notification.
 * @param {CreateNotificationServiceParams} params - Data for the new notification.
 * @returns {Promise<Notification>} The created notification.
 */
const createNotificationService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // You could add a check here to ensure the user ID is valid before creating.
        const newNotification = yield Notification_model_1.default.create(params);
        return newNotification;
    }
    catch (error) {
        // Throw the error to be handled by the controller or a global error handler.
        throw error;
    }
});
exports.createNotificationService = createNotificationService;
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
        });
        return notifications;
    }
    catch (error) {
        throw error;
    }
});
exports.getUnreadNotificationsByUserService = getUnreadNotificationsByUserService;
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
        // The update method returns an array with the number of affected rows.
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
