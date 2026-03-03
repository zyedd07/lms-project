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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationController = __importStar(require("../controllers/Notification.controller"));
const auth_1 = __importStar(require("../middleware/auth"));
const router = express_1.default.Router();
// --- Admin-only CRUD Routes ---
/**
 * @route   GET /api/notifications/admin/all
 * @desc    Admin gets a list of all notifications
 * @access  Private (Admin)
 */
router.get('/admin/all', auth_1.default, auth_1.authorizeAdmin, notificationController.getAllNotifications);
/**
 * @route   POST /api/notifications/admin/create
 * @desc    Admin creates a notification for a specific user
 * @access  Private (Admin)
 */
router.post('/admin/create', auth_1.default, auth_1.authorizeAdmin, notificationController.createNotificationForUser);
/**
 * @route   POST /api/notifications/admin/broadcast
 * @desc    Admin creates a broadcast notification for all users
 * @access  Private (Admin)
 */
router.post('/admin/broadcast', auth_1.default, auth_1.authorizeAdmin, notificationController.createBroadcastNotification);
/**
 * @route   PUT /api/notifications/admin/:notificationId
 * @desc    Admin updates an existing notification
 * @access  Private (Admin)
 */
router.put('/admin/:notificationId', auth_1.default, auth_1.authorizeAdmin, notificationController.updateNotification);
/**
 * @route   DELETE /api/notifications/admin/:notificationId
 * @desc    Admin deletes a notification
 * @access  Private (Admin)
 */
router.delete('/admin/:notificationId', auth_1.default, auth_1.authorizeAdmin, notificationController.deleteNotification);
// --- Authenticated User Routes ---
/**
 * @route   GET /api/notifications
 * @desc    Get all unread notifications for the currently logged-in user
 * @access  Private
 */
router.get('/', auth_1.default, notificationController.getMyNotifications);
/**
 * @route   GET /api/notifications/all
 * @desc    Get ALL notifications for the currently logged-in user
 * @access  Private
 */
router.get('/all', auth_1.default, notificationController.getAllMyNotifications);
/**
 * @route   PATCH /api/notifications/:notificationId/read
 * @desc    Mark a specific notification as read for the logged-in user
 * @access  Private
 */
router.patch('/:notificationId/read', auth_1.default, notificationController.markAsRead);
/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all of the logged-in user's unread notifications as read
 * @access  Private
 */
router.patch('/read-all', auth_1.default, notificationController.markAllAsRead);
exports.default = router;
