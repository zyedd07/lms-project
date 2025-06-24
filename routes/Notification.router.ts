import express from 'express';
import * as notificationController from '../controllers/Notification.controller';
import isAuth from '../middleware/auth'; // Using auth middleware as per your example

const router = express.Router();

// --- Notification Routes ---
// All routes require an authenticated user.

/**
 * @route   GET /api/notifications
 * @desc    Get all unread notifications for the currently logged-in user
 * @access  Private
 */
router.get(
    '/',
    isAuth,
    notificationController.getMyNotifications
);

/**
 * @route   PATCH /api/notifications/:notificationId/read
 * @desc    Mark a specific notification as read for the logged-in user
 * @access  Private
 */
router.patch(
    '/:notificationId/read',
    isAuth,
    notificationController.markAsRead
);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all of the logged-in user's unread notifications as read
 * @access  Private
 */
router.patch(
    '/read-all',
    isAuth,
    notificationController.markAllAsRead
);

export default router;
