
import { Request, Response } from 'express'; // Import Request and Response types from Express
import * as mediaFileService from '../services/Mediafile.service'; // Import all functions from service

// Controller for handling file upload requests
export const uploadFile = async (req: Request, res: Response) => {
  try {
    // Multer adds 'file' to the request object
    const file = req.file as Express.Multer.File; // Cast req.file to Multer's File type

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { originalname, mimetype, buffer, size } = file;
    // const adminId = (req as any).user.id; // If you have authentication and want to link to admin user

    const mediaFileEntry = await mediaFileService.uploadMedia(
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
    console.error('Error in mediaFile.controller.uploadFile:', error);
    const statusCode = error.statusCode || 500; // Use custom status code if available
    res.status(statusCode).json({ message: error.message || 'File upload failed.' });
  }
};

// Controller for handling requests to list all media files
export const listMedia = async (req: Request, res: Response) => {
  try {
    const mediaFiles = await mediaFileService.getAllMedia();
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