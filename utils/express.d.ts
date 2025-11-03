// src/types/express.d.ts
// This file will automatically augment the Express Request type.

// Import necessary types from 'express' and 'multer'
import { Request } from 'express';
import { File } from 'multer';

// Extend the Request interface to include the 'file' property added by Multer
declare global {
  namespace Express {
    interface Request {
      file?: File; // For single file uploads
      files?: File[] | {[fieldname: string]: File[]}; // For multiple file uploads (if you ever need it)
      // If you are using AuthenticatedRequest from your middleware, you might need to extend that as well:
      // user?: { id: string; role: string; /* other user properties */ };
    }
  }
}

// Optionally, if your AuthenticatedRequest is a direct interface/type:
// import { Request } from 'express';
// interface AuthenticatedRequest extends Request {
//   user?: { id: string; role: string; }; // Adjust based on your actual user type
//   file?: Express.Multer.File;
//   files?: Express.Multer.File[] | {[fieldname: string]: Express.Multer.File[]};
// }
//
// For this specific case, since your AuthenticatedRequest already extends Request,
// augmenting `Express.Request` directly is the simplest.
// Just make sure your tsconfig.json includes this file.