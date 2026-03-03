// middleware/checkDeviceToken.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../utils/types';
import User from '../models/User.model';

export const checkDeviceToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verify user is authenticated (should be done by isAuth middleware before this)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // ✅ SKIP DEVICE TOKEN CHECK FOR ADMINS
    if (req.user.role === 'admin') {
      console.log(`checkDeviceToken: Skipping device token check for admin user ${req.user.email}`);
      return next();
    }

    // Get device token from request header
    const deviceToken = req.headers['x-device-token'] as string;

    if (!deviceToken) {
      console.log(`checkDeviceToken: No device token provided for user ${req.user.email}`);
      return res.status(401).json({
        message: 'Device token missing. Please login again.',
        code: 'DEVICE_TOKEN_MISSING',
        requiresLogin: true
      });
    }

    // Fetch user from database to get stored device token
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const storedDeviceToken = user.get('deviceToken') as string | null;

    // Check if device token matches
    if (!storedDeviceToken || storedDeviceToken !== deviceToken) {
      console.log(`checkDeviceToken: Device token mismatch for user ${req.user.email}`);
      console.log(`  Expected: ${storedDeviceToken}`);
      console.log(`  Received: ${deviceToken}`);
      
      return res.status(401).json({
        message: 'Session invalid. You have been logged in from another device.',
        code: 'DEVICE_MISMATCH',
        requiresLogin: true
      });
    }

    // Device token is valid, proceed to next middleware/controller
    console.log(`checkDeviceToken: Valid device token for user ${req.user.email}`);
    next();
  } catch (error) {
    console.error('checkDeviceToken error:', error);
    return res.status(500).json({
      message: 'Error verifying device',
      code: 'DEVICE_CHECK_ERROR'
    });
  }
};