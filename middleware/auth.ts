// middleware/auth.ts

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// --- CRITICAL FIX: Import AuthenticatedRequest and JwtUserPayload from src/utils/types ---
import { AuthenticatedRequest, JwtUserPayload } from '../utils/types';
import HttpError from '../utils/httpError'; // Assuming you have HttpError defined

// If your src/utils/types.ts AuthenticatedRequest doesn't include 'file'/'files'
// but your middleware or controllers need them, use 'declare module' to augment it.
// If your AuthenticatedRequest in src/utils/types.ts already includes these, you can remove this block.
import { File } from 'multer'; // Assuming multer.File is defined in your multer-shim.d.ts or @types/multer
declare module '../utils/types' {
    interface AuthenticatedRequest {
        file?: File;
        files?: File[] | { [fieldname: string]: File[] };
    }
}


/**
 * Middleware to authenticate a user using a JWT token.
 * It verifies the token and attaches the decoded user payload to req.user.
 */
export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        console.log("isAuth: No token provided.");
        return res.status(401).json({ message: 'No token provided, authorization denied.' });
    }

    try {
        // --- CRITICAL FIX: Cast to JwtUserPayload imported from utils/types ---
        const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as JwtUserPayload;

        // req.user now correctly receives the JwtUserPayload type
        req.user = decoded;
        console.log("isAuth: Token successfully verified. User:", req.user.email, "Role:", req.user.role);
        next();
    } catch (err) {
        console.error("isAuth: Token verification failed:", err);
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Invalid or expired token.' });
        }
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        return res.status(401).json({ message: 'Authentication failed.' });
    }
};

/**
 * Middleware to authorize access only to users with the 'admin' role.
 * This middleware should be used AFTER the isAuth middleware.
 */
// This is already exported by 'export const authorizeAdmin = ...'
export const authorizeAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        console.log("authorizeAdmin: User not authenticated (req.user is missing).");
        return res.status(401).json({ message: 'Authentication required for this action.' });
    }

    if (req.user.role !== 'admin') {
        console.log(`authorizeAdmin: Access denied for user ${req.user.email} with role ${req.user.role}.`);
        return res.status(403).json({ message: 'Access denied: Administrator role required.' });
    }

    console.log(`authorizeAdmin: Admin access granted for ${req.user.email}.`);
    next();
};

export default isAuth;
// --- CRITICAL FIX: REMOVE authorizeAdmin from this export list ---
// It is already directly exported above.
export { AuthenticatedRequest };