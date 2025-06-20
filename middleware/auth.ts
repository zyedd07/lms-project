// middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { File } from 'multer'; // Assuming you use Multer, otherwise this import can be removed

// Define the shape of the request object after authentication
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string; // Added 'name' here
    email: string;
    role: string; // The role is crucial for authorization
    phone: string;
  };
  file?: File; // Multer file properties
  files?: File[] | { [fieldname: string]: File[] }; // Multer files properties
}

/**
 * Middleware to authenticate a user using a JWT token.
 * It verifies the token and attaches the decoded user payload to req.user.
 */
export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    console.log("isAuth: No token provided."); // Log for debugging
    return res.status(401).json({ message: 'No token provided, authorization denied.' });
  }

  try {
    // Verify the token using the SECRET_KEY from environment variables
    const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as {
      id: string;
      name: string; // Added 'name' to the expected decoded type
      email: string;
      role: string;
      phone: string;
    };

    req.user = decoded; // Attach the decoded user payload to the request
    console.log("isAuth: Token successfully verified. User:", req.user.email, "Role:", req.user.role); // Log success
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error("isAuth: Token verification failed:", err); // Log the specific error
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * Middleware to authorize access only to users with the 'admin' role.
 * This middleware should be used AFTER the isAuth middleware.
 */
export const authorizeAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Check if user information is available from the authentication middleware
  if (!req.user) {
    console.log("authorizeAdmin: User not authenticated (req.user is missing).");
    // This case should ideally be caught by isAuth, but good for robustness
    return res.status(401).json({ message: 'Authentication required for this action.' });
  }

  // Check if the authenticated user has the 'admin' role
  if (req.user.role !== 'admin') {
    console.log(`authorizeAdmin: Access denied for user ${req.user.email} with role ${req.user.role}.`);
    return res.status(403).json({ message: 'Access denied: Administrator role required.' });
  }

  console.log(`authorizeAdmin: Admin access granted for ${req.user.email}.`); // Log success
  next(); // User is an admin, proceed
};

export default isAuth; // Export isAuth as the default