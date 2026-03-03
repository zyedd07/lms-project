"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.markAllAsRead = exports.markAsRead = exports.getAllMyNotifications = exports.getMyNotifications = exports.deleteNotification = exports.updateNotification = exports.createBroadcastNotification = exports.createNotificationForUser = exports.getAllNotifications = void 0;
const notificationService = __importStar(require("../services/Notification.service"));
const httpError_1 = __importDefault(require("../utils/httpError"));
// --- Admin Controllers ---
/**
 * @description Controller for an admin to get all notifications.
 */
const getAllNotifications = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield notificationService.getAllNotificationsService();
        res.status(200).json({
            success: true,
            message: "All notifications fetched successfully.",
            data: notifications
        });
    }
    catch (error) {
        console.error("Error in getAllNotifications:", error);
        next(error);
    }
});
exports.getAllNotifications = getAllNotifications;
/**
 * @description Controller for an admin to create a notification for a specific user.
 */
const createNotificationForUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, type, text, link } = req.body;
        if (!userId || !type || !text) {
            throw new httpError_1.default("User ID, type, and text are required", 400);
        }
        const newNotification = yield notificationService.createNotificationService({ userId, type, text, link });
        res.status(201).json({ success: true, message: "Notification created successfully.", data: newNotification });
    }
    catch (error) {
        console.error("Error in createNotificationForUser:", error);
        next(error);
    }
});
exports.createNotificationForUser = createNotificationForUser;
/**
 * @description Controller for an admin to create a broadcast notification for all users.
 */
const createBroadcastNotification = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, text, link } = req.body;
        if (!type || !text) {
            throw new httpError_1.default("Type and text are required for a broadcast", 400);
        }
        const result = yield notificationService.createBroadcastNotificationService({ type, text, link });
        res.status(201).json(Object.assign({ success: true }, result));
    }
    catch (error) {
        console.error("Error in createBroadcastNotification:", error);
        next(error);
    }
});
exports.createBroadcastNotification = createBroadcastNotification;
/**
 * @description Controller for an admin to update an existing notification.
 */
const updateNotification = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId } = req.params;
        const updateData = req.body;
        if (!notificationId) {
            throw new httpError_1.default('Bad Request: Notification ID is required', 400);
        }
        if (Object.keys(updateData).length === 0) {
            throw new httpError_1.default("Bad Request: No update data provided", 400);
        }
        const updatedNotification = yield notificationService.updateNotificationService(notificationId, updateData);
        res.status(200).json({ success: true, message: "Notification updated.", data: updatedNotification });
    }
    catch (error) {
        console.error("Error in updateNotification:", error);
        next(error);
    }
});
exports.updateNotification = updateNotification;
/**
 * @description Controller for an admin to delete a notification.
 */
const deleteNotification = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId } = req.params;
        if (!notificationId) {
            throw new httpError_1.default('Bad Request: Notification ID is required', 400);
        }
        const result = yield notificationService.deleteNotificationService(notificationId);
        res.status(200).json({ success: true, message: result.message });
    }
    catch (error) {
        console.error("Error in deleteNotification:", error);
        next(error);
    }
});
exports.deleteNotification = deleteNotification;
// --- User-facing Controllers ---
/**
 * @description Controller to get the current user's unread notifications (limit 10).
 */
const getMyNotifications = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw new httpError_1.default("User not authenticated.", 401);
        }
        const notifications = yield notificationService.getUnreadNotificationsByUserService(req.user.id);
        res.status(200).json({ success: true, message: "Unread notifications fetched successfully", data: notifications });
    }
    catch (error) {
        console.error("Error in getMyNotifications:", error);
        next(error);
    }
});
exports.getMyNotifications = getMyNotifications;
/**
 * @description Controller to get ALL of the current user's notifications.
 */
const getAllMyNotifications = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw new httpError_1.default("User not authenticated.", 401);
        }
        const notifications = yield notificationService.getAllNotificationsByUserService(req.user.id);
        res.status(200).json({ success: true, message: "All notifications fetched successfully", data: notifications });
    }
    catch (error) {
        console.error("Error in getAllMyNotifications:", error);
        next(error);
    }
});
exports.getAllMyNotifications = getAllMyNotifications;
/**
 * @description Controller to mark a specific notification as read.
 */
const markAsRead = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw new httpError_1.default("User not authenticated.", 401);
        }
        const { notificationId } = req.params;
        if (!notificationId) {
            throw new httpError_1.default('Bad Request: Notification ID is required', 400);
        }
        const result = yield notificationService.markNotificationAsReadService(notificationId, req.user.id);
        res.status(200).json({ success: true, message: result.message });
    }
    catch (error) {
        console.error("Error in markAsRead:", error);
        next(error);
    }
});
exports.markAsRead = markAsRead;
/**
 * @description Controller to mark all of a user's unread notifications as read.
 */
const markAllAsRead = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw new httpError_1.default("User not authenticated.", 401);
        }
        const result = yield notificationService.markAllNotificationsAsReadService(req.user.id);
        res.status(200).json({ success: true, message: result.message });
    }
    catch (error) {
        console.error("Error in markAllAsRead:", error);
        next(error);
    }
});
exports.markAllAsRead = markAllAsRead;
