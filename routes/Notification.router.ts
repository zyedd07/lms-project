import express from 'express';
import * as notificationController from '../controllers/Notification.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth';

const router = express.Router();

// --- Admin-only CRUD Routes ---

/**
 * @route   GET /api/notifications/admin/all
 * @desc    Admin gets a list of all notifications
 * @access  Private (Admin)
 */
router.get(
    '/admin/all',
    isAuth,
    authorizeAdmin,
    notificationController.getAllNotifications
);

/**
 * @route   POST /api/notifications/admin/create
 * @desc    Admin creates a notification for a specific user
 * @access  Private (Admin)
 */
router.post(
    '/admin/create',
    isAuth,
    authorizeAdmin,
    notificationController.createNotificationForUser
);

/**
 * @route   POST /api/notifications/admin/broadcast
 * @desc    Admin creates a broadcast notification for all users
 * @access  Private (Admin)
 */
router.post(
    '/admin/broadcast',
    isAuth,
    authorizeAdmin,
    notificationController.createBroadcastNotification
);

/**
 * @route   PUT /api/notifications/admin/:notificationId
 * @desc    Admin updates an existing notification
 * @access  Private (Admin)
 */
router.put(
    '/admin/:notificationId',
    isAuth,
    authorizeAdmin,
    notificationController.updateNotification
);

/**
 * @route   DELETE /api/notifications/admin/:notificationId
 * @desc    Admin deletes a notification
 * @access  Private (Admin)
 */
router.delete(
    '/admin/:notificationId',
    isAuth,
    authorizeAdmin,
    notificationController.deleteNotification
);


// --- Authenticated User Routes ---

/**
 * @route   GET /api/notifications
 * @desc    Get all unread notifications for the currently logged-in user
 * @access  Private
 */
router.get(
    '/',
    isAuth,
    notificationController.getMyNotifications
);

/**
 * @route   GET /api/notifications/all
 * @desc    Get ALL notifications for the currently logged-in user
 * @access  Private
 */
router.get(
    '/all',
    isAuth,
    notificationController.getAllMyNotifications
);

/**
 * @route   PATCH /api/notifications/:notificationId/read
 * @desc    Mark a specific notification as read for the logged-in user
 * @access  Private
 */
router.patch(
    '/:notificationId/read',
    isAuth,
    notificationController.markAsRead
);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all of the logged-in user's unread notifications as read
 * @access  Private
 */
router.patch(
    '/read-all',
    isAuth,
    notificationController.markAllAsRead
);

export default router;
