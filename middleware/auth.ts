import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Make sure you have @types/multer installed (npm install --save-dev @types/multer)
// This will bring in the Express.Multer.File type.

export interface AuthenticatedRequest extends Request {
  user?: { // Suggesting a more specific type for user based on typical JWT payload
    id: string; // Assuming 'id' is part of your JWT payload
    email: string; // Assuming 'email' is part of your JWT payload
    role: string; // Assuming 'role' is part of your JWT payload
    // Add other properties that are in your JWT payload here
  };
  // --- ADD THESE LINES TO INCLUDE MULTER'S FILE PROPERTIES ---
  file?: Express.Multer.File; // For single file uploads
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] }; // For multiple file uploads (if you ever use them)
  // --- END ADDED LINES ---
}

const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // Verify the token
    // Cast process.env.SECRET_KEY to string, as it might be undefined
    const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as {
      id: string; // Assuming 'id' is part of your JWT payload
      email: string; // Assuming 'email' is part of your JWT payload
      role: string; // Assuming 'role' is part of your JWT payload
      // Add other properties that are in your JWT payload here
    };

    // Attach decoded token data to req.user
    req.user = decoded;
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    // For more robust error handling, you might distinguish between token expiration and invalid token
    // if (err instanceof jwt.TokenExpiredError) {
    //   return res.status(401).json({ message: 'Token expired' });
    // }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default isAuth;


// export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
//   const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

//   if (!token) {
//     next(); // Proceed to the next middleware or route handler without authentication
//   } else {
//     try {
//       // Verify the token
//       const decoded = jwt.verify(token, process.env.SECRET_KEY!);

//       // Attach decoded token data to req.user (or req.auth)
//       req.user = decoded;
//       next(); // Proceed to the next middleware or route handler
//     } catch (err) {
//       next(); // Proceed to the next middleware or route handler without authentication
//     }
//   }
// }