import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: any; // You can define a more specific type for the user
}

const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY!);

    // Attach decoded token data to req.user (or req.auth)
    req.user = decoded;
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
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