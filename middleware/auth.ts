// middleware/auth.ts

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtUserPayload, AuthenticatedRequest } from '../utils/types'; // Import AuthenticatedRequest directly from utils/types
import HttpError from '../utils/httpError';

// If you use Multer's File type here for req.file/files, import it locally
// This import is *not* for re-defining AuthenticatedRequest.
import { File } from 'multer';

// This 'declare module' block is only needed IF your AuthenticatedRequest
// in src/utils/types.ts does NOT already include 'file' and 'files' properties.
// If it does, you can remove this block.
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
        return next(new HttpError('No token provided, authorization denied.', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as JwtUserPayload;
        req.user = decoded;
        console.log("isAuth: Token successfully verified. User:", req.user.email, "Role:", req.user.role);
        next();
    } catch (err) {
        console.error("isAuth: Token verification failed:", err);
        if (err instanceof jwt.TokenExpiredError) {
            return next(new HttpError('Token expired.', 401));
        }
        if (err instanceof jwt.JsonWebTokenError) {
            return next(new HttpError('Invalid token.', 401));
        }
        return next(new HttpError('Authentication failed.', 401));
    }
};

/**
 * Middleware to authorize access only to users with the 'admin' role.
 * This middleware should be used AFTER the isAuth middleware.
 */
// Already directly exported via 'export const authorizeAdmin'
export const authorizeAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        console.log("authorizeAdmin: User not authenticated (req.user is missing).");
        return next(new HttpError('Authentication required for this action.', 401));
    }

    if (req.user.role !== 'admin') {
        console.log(`authorizeAdmin: Access denied for user ${req.user.email} with role ${req.user.role}.`);
        return next(new HttpError('Access denied: Administrator role required.', 403));
    }

    console.log(`authorizeAdmin: Admin access granted for ${req.user.email}.`);
    next();
};

export default isAuth; // Export isAuth as the default
// REMOVED authorizeAdmin from this line, as it's already exported above
export { AuthenticatedRequest }; // Only re-export AuthenticatedRequest