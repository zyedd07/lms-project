// controllers/mediaFile.controller.ts
// This file handles request parsing, calls the service, and sends responses.

import { Request, Response } from 'express'; // Import Request and Response types from Express
// No direct import of MulterFile needed here if using global augmentation
import * as mediaFileService from '../services/Mediafile.service'; // Import all functions from service

// The global declaration for Express.Request augmentation for Multer.File
// This should ideally be in a separate .d.ts file (e.g., src/types/express.d.ts)
// and referenced in tsconfig.json.
// For this example, we assume it's correctly picked up from your `multer.d.ts` file.

// Define a simple interface for the expected structure of the media file entry
// This helps TypeScript understand the properties even if the service returns 'any'
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

// Controller for handling file upload requests
export const uploadFile = async (req: Request, res: Response) => {
  try {
    // Multer adds 'file' to the request object.
    // TypeScript now knows 'req.file' can be a MulterFile due to the global augmentation.
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
      fileUrl: mediaFileEntry.fileUrl, // Now recognized
      s3Key: mediaFileEntry.s3Key,       // Now recognized
      metadata: mediaFileEntry,
    });
  } catch (error: any) { // Use 'any' for error type or define a custom error interface
    console.error('Error in mediaFile.controller.uploadFile:', error);
    const statusCode = error.statusCode || 500; // Use custom status code if available
    res.status(statusCode).json({ message: error.message || 'File upload failed.' });
  }
};

// Controller for handling requests to list all media files
export const listMedia = async (req: Request, res: Response) => {
  try {
    const mediaFiles: MediaFileEntryResponse[] = await mediaFileService.getAllMedia(); // Cast to array of MediaFileEntryResponse
    res.status(200).json(mediaFiles);
  } catch (error: any) {
    console.error('Error in mediaFile.controller.listMedia:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch media list.' });
  }
};

// Controller for handling requests to delete a media file
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Get file ID from URL parameters
    const result = await mediaFileService.deleteMedia(id);
    res.status(200).json({ message: result.message });
  } catch (error: any) {
    console.error('Error in mediaFile.controller.deleteFile:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'File deletion failed.' });
  }
};