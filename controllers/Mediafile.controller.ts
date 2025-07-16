// controllers/mediaFile.controller.ts
// This file handles request parsing, calls the service, and sends responses.

import { Request, Response } from 'express';
import * as mediaFileService from '../services/Mediafile.service';
import * as multer from 'multer'; // Explicitly import multer to make its namespace available for typing

// The global declaration for Express.Request augmentation for Multer.File and Multer.Files
// This should ideally be in a separate .d.ts file (e.g., src/types/express.d.ts)
// and referenced in tsconfig.json.
// For this example, we assume it's correctly picked up from your `multer.d.ts` file or similar.
// Example for reference if not already global:
/*
declare namespace Express {
  export interface Request {
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
    // If you have authentication and add user info to req:
    // user?: { id: string; // other user properties };
  }
}
*/

// Define a precise interface for the expected structure of the media file entry
// This helps TypeScript understand the properties returned from the service.
interface MediaFileEntryResponse {
  id: string;
  originalName: string;
  s3Key: string;
  s3Bucket: string;
  s3Region: string;
  fileUrl: string; // This will be the CloudFront signed URL
  mimeType: string;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
  // uploadedByAdminId?: string; // Uncomment if tracking admin uploads
}

// Controller for handling single file upload requests
export const uploadFile = async (req: Request, res: Response) => {
  try {
    // Multer adds 'file' to the request object.
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { originalname, mimetype, buffer, size } = file;

    // Optional: Get adminId if you have authentication middleware
    // const adminId = (req as any).user.id;

    const mediaFileEntry: MediaFileEntryResponse = await mediaFileService.uploadMedia(
      buffer,
      originalname,
      mimetype,
      size,
      // adminId // Pass adminId if used in service
    );

    res.status(201).json({
      message: 'File uploaded successfully!',
      fileUrl: mediaFileEntry.fileUrl,
      s3Key: mediaFileEntry.s3Key,
      metadata: mediaFileEntry, // Returns all stored metadata including the signed URL
    });
  } catch (error: any) { // Catching as 'any' to access custom properties like 'statusCode'
    console.error('Error in mediaFile.controller.uploadFile:', error);
    const statusCode = error.statusCode || 500; // Use custom status code if available from service
    res.status(statusCode).json({ message: error.message || 'File upload failed.' });
  }
};

// NEW: Controller for handling multiple file upload requests
export const uploadMultipleFiles = async (req: Request, res: Response) => {
  try {
    // Multer adds 'files' to the request object for array uploads.
    // Ensure your router configuration uses `upload.array('fieldName')` or `upload.fields([...])`
    const files = req.files as Express.Multer.File[]; // Explicitly cast to array of Multer.File

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    // Optional: Get adminId if you have authentication middleware
    // const adminId = (req as any).user.id;

    const uploadedFilesMetadata: MediaFileEntryResponse[] = await mediaFileService.uploadMultipleMedia(
      files,
      // adminId // Pass adminId if used in service
    );

    // Filter out any potential null/undefined entries if your service's Promise.allSettled
    // design returns them for failed individual uploads.
    // Given the current service implementation (logs and continues, pushing to uploadedFilesMetadata),
    // this filtering might not be strictly necessary if you always expect an object,
    // but it's good practice if there's a chance of undefined/nulls for failed uploads.
    const successfulUploads = uploadedFilesMetadata.filter(Boolean);

    res.status(201).json({
      message: `${successfulUploads.length} files uploaded successfully!`,
      uploadedFiles: successfulUploads,
      // You might also want to include a count of failed uploads if the service tracks them,
      // or if you refactor the service to return success/failure arrays.
    });
  } catch (error: any) {
    console.error('Error in mediaFile.controller.uploadMultipleFiles:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Multiple file upload failed.' });
  }
};


// Controller for handling requests to list all media files
export const listMedia = async (req: Request, res: Response) => {
  try {
    const mediaFiles: MediaFileEntryResponse[] = await mediaFileService.getAllMedia();
    res.status(200).json(mediaFiles);
  } catch (error: any) {
    console.error('Error in mediaFile.controller.listMedia:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Failed to fetch media list.' });
  }
};

// Controller for handling requests to delete a media file
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Get file ID from URL parameters

    if (!id) {
        return res.status(400).json({ message: 'Media file ID is required.' });
    }

    const result = await mediaFileService.deleteMedia(id);
    res.status(200).json({ message: result.message });
  } catch (error: any) {
    console.error('Error in mediaFile.controller.deleteFile:', error);
    const statusCode = error.statusCode || 500; // Propagate custom status code from service
    res.status(statusCode).json({ message: error.message || 'File deletion failed.' });
  }
};