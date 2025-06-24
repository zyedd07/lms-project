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
exports.markAllAsRead = exports.markAsRead = exports.getMyNotifications = void 0;
const Notification_service_1 = require("../services/Notification.service");
const httpError_1 = __importDefault(require("../utils/httpError"));
/**
 * @description Controller to get the current user's unread notifications.
 */
const getMyNotifications = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("User not authenticated.", 401);
        }
        const userId = req.user.id;
        const notifications = yield (0, Notification_service_1.getUnreadNotificationsByUserService)(userId);
        res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            data: notifications
        });
    }
    catch (error) {
        console.error("Error in getMyNotifications:", error);
        next(error);
    }
});
exports.getMyNotifications = getMyNotifications;
/**
 * @description Controller to mark a specific notification as read.
 */
const markAsRead = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("User not authenticated.", 401);
        }
        const userId = req.user.id;
        const { notificationId } = req.params;
        if (!notificationId) {
            throw new httpError_1.default('Bad Request: Notification ID is required in params', 400);
        }
        const result = yield (0, Notification_service_1.markNotificationAsReadService)(notificationId, userId);
        res.status(200).json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        console.error("Error in markAsRead:", error);
        next(error);
    }
});
exports.markAsRead = markAsRead;
/**
 * @description Controller to mark all of the user's notifications as read.
 */
const markAllAsRead = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("User not authenticated.", 401);
        }
        const userId = req.user.id;
        const result = yield (0, Notification_service_1.markAllNotificationsAsReadService)(userId);
        res.status(200).json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        console.error("Error in markAllAsRead:", error);
        next(error);
    }
});
exports.markAllAsRead = markAllAsRead;
