// controllers/Mediafile.controller.ts
// This file handles request parsing, calls the service, and sends responses.

import { Request, Response } from 'express'; // Import Request and Response types from Express
import * as mediaFileService from '../services/Mediafile.service'; // Import all functions from service
import multer from 'multer'; // Import the default export (the multer function)

// Define a precise interface for the expected structure of the media file entry
interface MediaFileEntryResponse {
  fileUrl: string;
  s3Key: string;
  // Add other properties you expect from the service's return if needed
  id: string;
  originalName: string;
  s3Bucket: string;
  s3Region: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to handle common error responses
const handleErrorResponse = (res: Response, error: any, defaultMessage: string) => {
  console.error(`Error in mediaFile.controller:`, error);

  let statusCode = 500;
  let message = defaultMessage;

  // Check if the error is an instance of multer.MulterError
  if (error instanceof multer.MulterError) { // <--- Use multer.MulterError from the imported default
    statusCode = 400; // Bad Request for Multer errors like file size limits
    message = `File upload error: ${error.message}`;
    if (error.code) {
      message += ` (Code: ${error.code})`;
    }
  } else if (error.statusCode) {
    // Handle custom errors from service (e.g., MediaFileNotFoundError)
    statusCode = error.statusCode;
    message = error.message;
  } else {
    // Generic error
    message = error.message || defaultMessage;
  }

  res.status(statusCode).json({ message });
};

// Controller for handling single file upload requests
export const uploadFile = async (req: Request, res: Response) => {
  try {
    // req.file is typed by the Express.Request augmentation in multer-shim.d.ts
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { originalname, mimetype, buffer, size } = file; // Properties now directly available

    // const adminId = (req as any).user.id; // If you have authentication and want to link to admin user

    const mediaFileEntry: MediaFileEntryResponse = await mediaFileService.uploadMedia( // Cast to MediaFileEntryResponse
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
      metadata: mediaFileEntry,
    });
  } catch (error: any) { // Use 'any' for error type or define a custom error interface
    handleErrorResponse(res, error, 'File upload failed.');
  }
};

// Controller for handling requests to list all media files
export const listMedia = async (req: Request, res: Response) => {
  try {
    const mediaFiles: MediaFileEntryResponse[] = await mediaFileService.getAllMedia(); // Cast to array of MediaFileEntryResponse
    res.status(200).json(mediaFiles);
  } catch (error: any) {
    handleErrorResponse(res, error, 'Failed to fetch media list.');
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
    handleErrorResponse(res, error, 'File deletion failed.');
  }
};

// NEW: Controller for handling multiple file upload requests
export const uploadMultipleFiles = async (req: Request, res: Response) => {
  try {
    // req.files is typed by the Express.Request augmentation in multer-shim.d.ts
    // It's already typed as `multer.File[]` or `{ [fieldname: string]: multer.File[] }`
    // So, we can directly use `file as multer.File` or `files as multer.File[]`
    const files = req.files as multer.File[]; // <--- Use multer.File from the imported default

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    // const adminId = (req as any).user.id; // If you have authentication and want to link to admin user

    const uploadedFilesMetadata: MediaFileEntryResponse[] = await mediaFileService.uploadMultipleMedia(
      files,
      // adminId // Pass adminId if used in service
    );

    const successfulUploads = uploadedFilesMetadata.filter(Boolean);

    res.status(201).json({
      message: `${successfulUploads.length} files uploaded successfully!`,
      uploadedFiles: successfulUploads,
    });
  } catch (error: any) {
    handleErrorResponse(res, error, 'Multiple file upload failed.');
  }
};