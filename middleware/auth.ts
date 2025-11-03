// middleware/auth.ts

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
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

// Configuration
const TOKEN_EXPIRY = '30d'; // 30 days
const REFRESH_THRESHOLD = 7 * 24 * 60 * 60; // 7 days in seconds - refresh if token expires within 7 days

/**
 * Helper function to generate a new JWT token with 30-day expiry
 */
export const generateToken = (payload: JwtUserPayload, expiresIn: string = TOKEN_EXPIRY): string => {
    return jwt.sign(payload, process.env.SECRET_KEY as string, { expiresIn });
};

/**
 * Helper function to check if token needs refresh
 * Returns true if token expires within REFRESH_THRESHOLD
 */
const shouldRefreshToken = (decoded: JwtUserPayload): boolean => {
    if (!decoded.exp) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    
    // Refresh if token expires within 7 days
    return timeUntilExpiry < REFRESH_THRESHOLD;
};

/**
 * Middleware to authenticate a user using a JWT token.
 * Implements sliding window expiration:
 * - If token is valid and fresh: proceed normally
 * - If token is valid but expires soon (within 7 days): auto-refresh with new 30-day token
 * - If token expired: reject (user must login again)
 * 
 * This ensures users stay logged in as long as they open the app at least once per 30 days.
 */
export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
        // Verify token - this will throw if expired
        const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as JwtUserPayload;
        
        // Token is valid - attach user to request
        req.user = decoded;
        console.log("isAuth: Token valid. User:", req.user.email, "Expires:", new Date(decoded.exp! * 1000).toISOString());
        
        // Check if token should be refreshed (sliding window)
        if (shouldRefreshToken(decoded)) {
            console.log("isAuth: Token expiring soon. Issuing new 30-day token for:", decoded.email);
            
            // Generate new token with fresh 30-day expiry
            const newToken = generateToken({
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                status: decoded.status
            });
            
            // Send new token in response headers
            res.setHeader('X-New-Token', newToken);
            res.setHeader('X-Token-Refreshed', 'true');
            
            console.log("isAuth: New 30-day token issued for:", req.user.email);
        }
        
        return next();

    } catch (err) {
        console.error("isAuth: Token verification failed:", err);
        
        if (err instanceof jwt.TokenExpiredError) {
            // Token expired - user hasn't opened app in 30 days
            console.log("isAuth: Token expired. User must login again.");
            return res.status(401).json({ 
                message: 'Your session has expired. Please login again.',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        if (err instanceof jwt.JsonWebTokenError) {
            console.log("isAuth: Invalid token.");
            return res.status(401).json({ 
                message: 'Invalid token. Please login again.',
                code: 'TOKEN_INVALID'
            });
        }
        
        return res.status(401).json({ 
            message: 'Authentication failed.',
            code: 'AUTH_ERROR'
        });
    }
};

/**
 * Standalone endpoint for explicit token refresh
 * Use this as: POST /api/user/refresh-token
 * 
 * This allows the app to explicitly request a token refresh on app open
 * even if no API calls are being made yet.
 */
export const refreshTokenController = async (req: AuthenticatedRequest, res: Response) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ 
            message: 'Token is required for refresh.',
            code: 'NO_TOKEN'
        });
    }

    try {
        // Verify token - must be valid, not expired
        const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as JwtUserPayload;
        
        console.log("Token refresh requested for user:", decoded.email);

        // Generate new token with fresh 30-day expiry
        const newToken = generateToken({
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            status: decoded.status
        });

        console.log("Token refreshed successfully. New 30-day expiry for:", decoded.email);

        return res.status(200).json({
            message: 'Token refreshed successfully',
            token: newToken,
            user: {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                status: decoded.status
            }
        });

    } catch (error) {
        console.error("Token refresh error:", error);
        
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ 
                message: 'Token has expired. Please login again.',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        return res.status(401).json({ 
            message: 'Invalid token. Cannot refresh.',
            code: 'INVALID_TOKEN'
        });
    }
};

/**
 * Middleware to authorize access only to users with the 'admin' role.
 * This middleware should be used AFTER the isAuth middleware.
 */
export const authorizeAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        console.log("authorizeAdmin: User not authenticated (req.user is missing).");
        return res.status(401).json({ 
            message: 'Authentication required for this action.',
            code: 'NOT_AUTHENTICATED'
        });
    }

    if (req.user.role !== 'admin') {
        console.log(`authorizeAdmin: Access denied for user ${req.user.email} with role ${req.user.role}.`);
        return res.status(403).json({ 
            message: 'Access denied: Administrator role required.',
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    }

    console.log(`authorizeAdmin: Admin access granted for ${req.user.email}.`);
    next();
};

/**
 * Middleware to authorize access only to teachers and admins
 */
export const authorizeTeacher = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        console.log("authorizeTeacher: User not authenticated (req.user is missing).");
        return res.status(401).json({ 
            message: 'Authentication required for this action.',
            code: 'NOT_AUTHENTICATED'
        });
    }

    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        console.log(`authorizeTeacher: Access denied for user ${req.user.email} with role ${req.user.role}.`);
        return res.status(403).json({ 
            message: 'Access denied: Teacher role required.',
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    }

    console.log(`authorizeTeacher: Teacher access granted for ${req.user.email}.`);
    next();
};

export default isAuth;
export { AuthenticatedRequest };