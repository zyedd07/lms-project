import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { File } from 'multer'; // <--- ADD THIS IMPORT!

export interface AuthenticatedRequest extends Request {
  user?: { // Suggesting a more specific type for user based on typical JWT payload
    id: string; // Assuming 'id' is part of your JWT payload
    email: string; // Assuming 'email' is part of your JWT payload
    role: string; // Assuming 'role' is part of your JWT payload
    // Add other properties that are in your JWT payload here
  };
  // --- CHANGE 'Express.Multer.File' to 'File' (the imported one) ---
  file?: File; // For single file uploads
  files?: File[] | { [fieldname: string]: File[] }; // For multiple file uploads (if you ever use them)
  // --- END CHANGE ---
}

const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as {
      id: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default isAuth;