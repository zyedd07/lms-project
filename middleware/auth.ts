// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { File } from 'multer'; // Assuming you use Multer, otherwise this import can be removed

// --- IMPORTANT: Import your Sequelize User model here ---
// Adjust the path to where your Sequelize models are defined and exported.
// This might look different depending on how you structure your models.
import User from './models/User'; // Example: if User model is in src/models/User.ts

// Define the shape of the request object after authentication
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string; // The role is crucial for authorization
    phone?: string; // Make phone optional as it might be null/undefined initially or in DB
  };
  file?: File; // Multer file properties
  files?: File[] | { [fieldname: string]: File[] }; // Multer files properties
}

/**
 * Middleware to authenticate a user using a JWT token.
 * It verifies the token, extracts the user ID, and then fetches
 * the full user object from the database to attach to req.user.
 */
export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("isAuth: No token provided or invalid format.");
    return res.status(401).json({ message: 'No token provided, authorization denied.' });
  }

  const token = authHeader.split(' ')[1];
  let decodedToken: { id: string; email: string; role: string; iat: number; exp: number; }; // Type for basic token payload

  try {
    // Verify the token using the SECRET_KEY from environment variables
    // Ensure process.env.SECRET_KEY is correctly set in your environment
    decodedToken = jwt.verify(token, process.env.SECRET_KEY as string) as any;
  } catch (err: any) {
    console.error("isAuth: Token verification failed:", err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }

  // Ensure the decoded token contains at least the user ID to fetch from DB
  if (!decodedToken || !decodedToken.id) {
    req.user = undefined;
    console.log("isAuth: Decoded token missing user ID.");
    return res.status(401).json({ message: 'Not authenticated. Invalid token payload.' });
  }

  try {
    // --- Sequelize specific: Fetch the full user object from the database ---
    // Use findByPk to find by primary key (id)
    const userFromDb = await User.findByPk(decodedToken.id, {
            attributes: { exclude: ['password'] } // Exclude the password field
        });

    if (!userFromDb) {
      req.user = undefined;
      console.log(`isAuth: User with ID ${decodedToken.id} not found in DB.`);
      return res.status(404).json({ message: 'User not found.' });
    }

    // Attach the complete user data from the database to the request object
    // userFromDb.toJSON() converts the Sequelize instance to a plain JavaScript object
    const userData = userFromDb.toJSON();

    req.user = {
      id: userData.id, // Sequelize `id` attribute
      email: userData.email,
      role: userData.role,
      phone: userData.phone || '', // Ensure phone is explicitly included, default to empty string if null/undefined
    };

    console.log("isAuth: User data fetched from DB. User:", req.user.email, "Role:", req.user.role, "Phone:", req.user.phone);
    next(); // Proceed to the next middleware or route handler
  } catch (err: any) {
    console.error('isAuth: Error fetching user from database:', err);
    return res.status(500).json({ message: 'Internal server error during authentication process.' });
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

  console.log(`authorizeAdmin: Admin access granted for ${req.user.email}.`);
  next(); // User is an admin, proceed
};

// Export both as named exports, or keep isAuth as default and export authorizeAdmin as named
export default isAuth;
