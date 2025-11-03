// middleware/auth.ts
// Complete authentication middleware with device token verification

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { AuthenticatedRequest, JwtUserPayload } from '../utils/types';
import HttpError from '../utils/httpError';

// Augment AuthenticatedRequest with multer file types if needed
import { File } from 'multer';
declare module '../utils/types' {
    interface AuthenticatedRequest {
        file?: File;
        files?: File[] | { [fieldname: string]: File[] };
    }
}

// Extend JwtUserPayload to include JWT standard claims
interface JwtPayloadWithClaims extends JwtUserPayload {
    iat?: number;  // issued at
    exp?: number;  // expiration time
}

// Configuration
const TOKEN_EXPIRY = '30d'; // 30 days
const REFRESH_THRESHOLD = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Helper function to generate a new JWT token
 */
export const generateToken = (payload: JwtUserPayload, expiresIn = TOKEN_EXPIRY): string => {
    const secretKey = process.env.SECRET_KEY;
    
    if (!secretKey) {
        throw new Error('SECRET_KEY is not defined in environment variables');
    }
    
    const tokenPayload = {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        profilePicture: payload.profilePicture,
        dateOfBirth: payload.dateOfBirth,
        address: payload.address,
        rollNo: payload.rollNo,
        collegeName: payload.collegeName,
        university: payload.university,
        country: payload.country
    };
    
    return jwt.sign(tokenPayload, secretKey, { expiresIn } as any);
};

/**
 * Check if token needs refresh (expires within 7 days)
 */
const shouldRefreshToken = (decoded: JwtPayloadWithClaims): boolean => {
    if (!decoded.exp) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    
    return timeUntilExpiry < REFRESH_THRESHOLD;
};

/**
 * Main authentication middleware with DEVICE TOKEN verification
 * This middleware does BOTH JWT and device token checks
 */
export const isAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
        console.log("isAuth: No token provided.");
        return res.status(401).json({ 
            message: 'No token provided, authorization denied.',
            code: 'NO_TOKEN'
        });
    }

    try {
        const secretKey = process.env.SECRET_KEY;
        
        if (!secretKey) {
            throw new Error('SECRET_KEY is not defined');
        }

        // ==========================================
        // STEP 1: Verify JWT Token
        // ==========================================
        const decoded = jwt.verify(token, secretKey) as JwtPayloadWithClaims;
        
        console.log("isAuth: Token valid for user:", decoded.email);

        // ==========================================
        // STEP 2: Verify Device Token
        // ==========================================
        const deviceToken = req.headers['x-device-token'] as string;
        const deviceId = req.headers['x-device-id'] as string;

        if (!deviceToken) {
            console.log(`isAuth: No device token for user ${decoded.email}`);
            return res.status(401).json({
                message: 'Device token missing. Please login again.',
                code: 'DEVICE_TOKEN_MISSING',
                requiresLogin: true
            });
        }

        // Fetch user from database
        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'email', 'deviceToken', 'deviceId', 'role', 'status']
        });

        if (!user) {
            console.log(`isAuth: User not found: ${decoded.id}`);
            return res.status(401).json({
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Check if user has a stored device token
        const storedDeviceToken = user.get('deviceToken') as string | null;
        
        if (!storedDeviceToken) {
            console.log(`isAuth: No active session for user ${decoded.email}`);
            return res.status(401).json({
                message: 'No active session. Please login again.',
                code: 'NO_ACTIVE_SESSION',
                requiresLogin: true
            });
        }

        // Verify device token matches
        if (storedDeviceToken !== deviceToken) {
            console.log(`isAuth: ❌ Device token mismatch for user ${decoded.email}`);
            console.log(`  Expected: ${storedDeviceToken.substring(0, 20)}...`);
            console.log(`  Received: ${deviceToken.substring(0, 20)}...`);
            
            return res.status(401).json({
                message: 'Session invalid. You have been logged in from another device.',
                code: 'DEVICE_MISMATCH',
                requiresLogin: true
            });
        }

        // Optional: Verify device ID consistency (stricter security)
        const storedDeviceId = user.get('deviceId') as string | null;
        if (storedDeviceId && deviceId && storedDeviceId !== deviceId) {
            console.log(`isAuth: ⚠️ Device ID mismatch for user ${decoded.email}`);
            return res.status(401).json({
                message: 'Device ID mismatch. Please login again.',
                code: 'DEVICE_MISMATCH',
                requiresLogin: true
            });
        }

        console.log(`isAuth: ✅ Device verified for user ${decoded.email}`);

        // ==========================================
        // STEP 3: Check user status
        // ==========================================
        const userStatus = user.get('status') as string;
        if (userStatus === 'pending') {
            return res.status(403).json({
                message: 'Your account is awaiting admin approval',
                code: 'PENDING_APPROVAL'
            });
        }
        if (userStatus === 'rejected') {
            return res.status(403).json({
                message: 'Your account has been rejected',
                code: 'ACCOUNT_REJECTED'
            });
        }

        // ==========================================
        // STEP 4: Attach user to request
        // ==========================================
        req.user = decoded;

        // ==========================================
        // STEP 5: Auto-refresh token if needed (sliding window)
        // ==========================================
        if (shouldRefreshToken(decoded)) {
            console.log("isAuth: Token expiring soon. Issuing new 30-day token for:", decoded.email);
            
            const userPayload: JwtUserPayload = {
                id: decoded.id,
                name: decoded.name,
                email: decoded.email,
                phone: decoded.phone,
                role: decoded.role,
                profilePicture: decoded.profilePicture,
                dateOfBirth: decoded.dateOfBirth,
                address: decoded.address,
                rollNo: decoded.rollNo,
                collegeName: decoded.collegeName,
                university: decoded.university,
                country: decoded.country
            };
            
            const newToken = generateToken(userPayload);
            
            // Send new token in response headers
            res.setHeader('X-New-Token', newToken);
            res.setHeader('X-Token-Refreshed', 'true');
            
            console.log("isAuth: ✅ New 30-day token issued");
        }
        
        return next();

    } catch (err) {
        console.error("isAuth: Token verification failed:", err);
        
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ 
                message: 'Your session has expired. Please login again.',
                code: 'TOKEN_EXPIRED',
                requiresLogin: true
            });
        }
        
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ 
                message: 'Invalid token. Please login again.',
                code: 'TOKEN_INVALID',
                requiresLogin: true
            });
        }
        
        return res.status(401).json({ 
            message: 'Authentication failed.',
            code: 'AUTH_ERROR'
        });
    }
};

/**
 * Explicit token refresh endpoint
 * POST /api/user/refresh-token
 */
export const refreshTokenController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ 
            message: 'Token is required for refresh.',
            code: 'NO_TOKEN'
        });
    }

    try {
        const secretKey = process.env.SECRET_KEY;
        
        if (!secretKey) {
            throw new Error('SECRET_KEY is not defined');
        }

        // Verify token
        const decoded = jwt.verify(token, secretKey) as JwtPayloadWithClaims;
        
        console.log("Token refresh requested for user:", decoded.email);

        // ==========================================
        // VERIFY DEVICE TOKEN FOR REFRESH
        // ==========================================
        const deviceToken = req.headers['x-device-token'] as string;

        if (!deviceToken) {
            return res.status(401).json({
                message: 'Device token required for refresh',
                code: 'DEVICE_TOKEN_MISSING',
                requiresLogin: true
            });
        }

        // Fetch user to verify device token
        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'email', 'deviceToken', 'deviceId']
        });

        if (!user) {
            return res.status(401).json({
                message: 'User not found',
                code: 'USER_NOT_FOUND',
                requiresLogin: true
            });
        }

        const storedDeviceToken = user.get('deviceToken') as string | null;

        if (!storedDeviceToken || storedDeviceToken !== deviceToken) {
            console.log(`Refresh: Device mismatch for ${decoded.email}`);
            return res.status(401).json({
                message: 'Session invalid. Logged in from another device.',
                code: 'DEVICE_MISMATCH',
                requiresLogin: true
            });
        }

        // Update last login time
        await user.update({
            lastLoginAt: new Date()
        });

        // Generate new token
        const userPayload: JwtUserPayload = {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            phone: decoded.phone,
            role: decoded.role,
            profilePicture: decoded.profilePicture,
            dateOfBirth: decoded.dateOfBirth,
            address: decoded.address,
            rollNo: decoded.rollNo,
            collegeName: decoded.collegeName,
            university: decoded.university,
            country: decoded.country
        };

        const newToken = generateToken(userPayload);

        console.log("Token refreshed successfully for:", decoded.email);

        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            token: newToken,
            user: userPayload
        });

    } catch (error) {
        console.error("Token refresh error:", error);
        
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ 
                message: 'Token has expired. Please login again.',
                code: 'TOKEN_EXPIRED',
                requiresLogin: true
            });
        }
        
        return res.status(401).json({ 
            message: 'Invalid token. Cannot refresh.',
            code: 'INVALID_TOKEN',
            requiresLogin: true
        });
    }
};

/**
 * Admin role authorization middleware
 * Use after isAuth middleware
 */
export const authorizeAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return res.status(401).json({ 
            message: 'Authentication required for this action.',
            code: 'NOT_AUTHENTICATED'
        });
    }

    if (req.user.role !== 'admin') {
        console.log(`authorizeAdmin: Access denied for ${req.user.email} (${req.user.role})`);
        return res.status(403).json({ 
            message: 'Access denied: Administrator role required.',
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    }

    console.log(`authorizeAdmin: ✅ Admin access granted for ${req.user.email}`);
    next();
};

/**
 * Teacher role authorization middleware
 * Use after isAuth middleware
 */
export const authorizeTeacher = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return res.status(401).json({ 
            message: 'Authentication required for this action.',
            code: 'NOT_AUTHENTICATED'
        });
    }

    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        console.log(`authorizeTeacher: Access denied for ${req.user.email} (${req.user.role})`);
        return res.status(403).json({ 
            message: 'Access denied: Teacher role required.',
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    }

    console.log(`authorizeTeacher: ✅ Teacher access granted for ${req.user.email}`);
    next();
};

export default isAuth;
export { AuthenticatedRequest };