// controllers/Mediafile.controller.ts
// Updated to match the enhanced service with better error handling and batch processing,
// and to support multi-type media handling (videos and static assets).

import { Request, Response } from 'express';
import * as mediaFileService from '../services/Mediafile.service';
import multer from 'multer';
// Removed CloudfrontSignedCookiesOutput import as we are no longer using cookies

// Enhanced interface to match the service response structure for both videos and static assets
interface MediaFileEntryResponse {
  fileUrl: string | null; // This will be the signed CloudFront URL for videos, or direct S3 URL for static assets
  s3Key: string; // S3 key of the original uploaded file (raw video or static asset)
  id: string;
  originalName: string;
  s3Bucket: string; // The S3 bucket where the original file was stored (raw video or static assets)
  s3Region: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
  processedPath?: string; // Only relevant for videos (HLS master manifest path)
  originalS3Key?: string; // This field might become redundant if s3Key stores the original.
  status?: 'ready' | 'error' | 'processing'; // 'processing' for videos, 'ready' for static assets
  error?: string;
}

// Enhanced interface for batch upload results
interface BatchUploadResult {
  successful: MediaFileEntryResponse[];
  failed: Array<{
    filename: string;
    error: string;
    batchIndex: number;
    fileSize: number;
    mimeType: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
}

/**
 * Helper function to handle common error responses with enhanced error categorization.
 * Provides more specific HTTP status codes and messages based on the error type.
 *
 * @param res The Express response object.
 * @param error The error object caught.
 * @param defaultMessage A default message to use if a more specific one cannot be determined.
 */
const handleErrorResponse = (res: Response, error: any, defaultMessage: string) => {
  console.error(`Error in mediaFile.controller:`, error);

  let statusCode = 500; // Default to Internal Server Error
  let message = defaultMessage;

  // Check if the error is an instance of multer.MulterError (file upload specific errors)
  if (error instanceof multer.MulterError) {
    statusCode = 400; // Bad Request for Multer errors
    message = `File upload error: ${error.message}`;
    if (error.code) {
      message += ` (Code: ${error.code})`;
    }
  } else if (error.statusCode) {
    // Handle custom errors from service (e.g., MediaFileNotFoundError with a custom statusCode)
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.message) {
    // Enhanced error message handling for specific AWS/CloudFront errors
    if (error.message.includes('CloudFront')) {
      statusCode = 502; // Bad Gateway for CloudFront configuration/runtime issues
      message = `CDN Configuration Error: ${error.message}`;
    } else if (error.message.includes('S3 bucket') || error.message.includes('NoSuchBucket')) {
      statusCode = 502; // Bad Gateway for S3 bucket configuration issues
      message = `Storage Configuration Error: ${error.message}`;
    } else if (error.message.includes('AccessDenied')) {
      statusCode = 502; // Bad Gateway for AWS permission issues
      message = `Storage Permission Error: ${error.message}`;
    } else if (error.message.includes('URL signing')) {
      statusCode = 502; // Bad Gateway for issues during signed URL generation
      message = `URL Generation Error: ${error.message}`;
    } else {
      // Fallback for other errors with a message
      message = error.message;
    }
  }

  // Send a structured error response
  res.status(statusCode).json({
    message,
    error: true,
    timestamp: new Date().toISOString() // Include timestamp for debugging
  });
};

/**
 * Controller for handling single file uploads.
 * Expects a single file in `req.file` from `multer` middleware.
 *
 * @param req The Express request object.
 * @param res The Express response object.
 */
export const uploadFile = async (req: Request, res: Response) => {
  try {
    const file = req.file;

    // Validate if a file was actually uploaded
    if (!file) {
      return res.status(400).json({
        message: 'No file uploaded. Please ensure you are sending a file.',
        error: true,
        timestamp: new Date().toISOString()
      });
    }

    const { originalname, mimetype, buffer, size } = file;

    console.log(`📤 Controller: Starting upload for ${originalname} (Size: ${(size / (1024 * 1024)).toFixed(2)} MB, MIME: ${mimetype})`);

    // Call the enhanced service method to handle S3 upload, DB entry, and URL generation
    const mediaFileEntry: MediaFileEntryResponse = await mediaFileService.uploadMedia(
      buffer,
      originalname,
      mimetype,
      size
    );

    console.log(`✅ Controller: Upload completed successfully for ${originalname} (ID: ${mediaFileEntry.id})`);

    // Respond with success status and relevant file metadata
    res.status(201).json({ // 201 Created
      message: 'File uploaded successfully!',
      fileUrl: mediaFileEntry.fileUrl, // This is the generated URL (signed for video, public for static)
      s3Key: mediaFileEntry.s3Key, // S3 key of the original uploaded file
      s3Bucket: mediaFileEntry.s3Bucket, // The bucket where it was stored
      processedPath: mediaFileEntry.processedPath, // Only for videos
      metadata: {
        id: mediaFileEntry.id,
        originalName: mediaFileEntry.originalName,
        mimeType: mediaFileEntry.mimeType,
        fileSize: mediaFileEntry.fileSize,
        status: mediaFileEntry.status,
        createdAt: mediaFileEntry.createdAt
      },
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error(`❌ Controller: Upload failed -`, error?.message || 'Unknown error');
    handleErrorResponse(res, error, 'File upload failed due to an unexpected error.');
  }
};

/**
 * Controller for listing all media files.
 * Retrieves all media entries from the database and generates appropriate URLs for them.
 * Provides a summary of file statuses (ready, error, processing).
 *
 * @param req The Express request object.
 * @param res The Express response object.
 */
export const listMedia = async (req: Request, res: Response) => {
  try {
    console.log(`📋 Controller: Fetching media list...`);

    // Call the service method to get all media files with their generated URLs
    const mediaFiles: MediaFileEntryResponse[] = await mediaFileService.getAllMedia();

    // Calculate a summary of file statuses for a quick overview
    const statusSummary = {
      total: mediaFiles.length,
      ready: mediaFiles.filter(f => f.status === 'ready').length,
      error: mediaFiles.filter(f => f.status === 'error').length,
      processing: mediaFiles.filter(f => f.status === 'processing').length
    };

    console.log(`✅ Controller: Retrieved ${mediaFiles.length} media files. Status summary:`, statusSummary);

    // Respond with the list of media files and the status summary
    res.status(200).json({
      data: mediaFiles,
      summary: statusSummary,
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error(`❌ Controller: Failed to fetch media list -`, error?.message || 'Unknown error');
    handleErrorResponse(res, error, 'Failed to retrieve media list due to an unexpected error.');
  }
};

/**
 * Controller for deleting a single media file.
 * Expects the media file's ID in `req.params.id`.
 *
 * @param req The Express request object.
 * @param res The Express response object.
 */
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate if an ID was provided
    if (!id) {
      return res.status(400).json({
        message: 'Media file ID is required for deletion.',
        error: true,
        timestamp: new Date().toISOString()
      });
    }

    // Basic ID format validation (e.g., for UUIDs or numeric IDs)
    if (!/^[0-9a-fA-F-]+$/.test(id)) { // Generic check for alphanumeric and hyphens
      return res.status(400).json({
        message: 'Invalid media file ID format. Please provide a valid ID.',
        error: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🗑️ Controller: Deleting media file with ID: ${id}`);

    // Call the service method to delete the media file from S3 and the database
    const result = await mediaFileService.deleteMedia(id);

    console.log(`✅ Controller: Successfully deleted media file: ${id}`);

    // Respond with a success message
    res.status(200).json({
      message: result.message,
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error(`❌ Controller: Deletion failed for ID ${req.params.id} -`, error?.message || 'Unknown error');
    handleErrorResponse(res, error, 'File deletion failed due to an unexpected error.');
  }
};

/**
 * Controller for handling multiple file uploads in a batch.
 * Expects an array of files in `req.files` from `multer` middleware.
 * Provides a detailed summary of each file's upload status.
 *
 * @param req The Express request object.
 * @param res The Express response object.
 */
export const uploadMultipleFiles = async (req: Request, res: Response) => {
  try {
    const files = req.files as multer.File[]; // Cast to multer.File[] for type safety

    // Validate if any files were uploaded
    if (!files || files.length === 0) {
      return res.status(400).json({
        message: 'No files uploaded. Please ensure you are sending files.',
        error: true,
        timestamp: new Date().toISOString()
      });
    }

    // Optional: Implement a maximum file count per batch to prevent abuse or overload
    const MAX_FILES_PER_BATCH = 10; // Example limit
    if (files.length > MAX_FILES_PER_BATCH) {
      return res.status(400).json({
        message: `Too many files. Maximum ${MAX_FILES_PER_BATCH} files allowed per batch upload.`,
        error: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`📤 Controller: Starting batch upload of ${files.length} files.`);

    // Log details of each file in the batch
    files.forEach((file, index) => {
      console.log(`  [${index + 1}] Filename: ${file.originalname}, Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    });

    // Call the enhanced batch upload service method
    const batchResult: BatchUploadResult = await mediaFileService.uploadMultipleMedia(files);

    console.log(`✅ Controller: Batch upload completed. Summary: ${batchResult.summary.successful}/${batchResult.summary.total} successful (${batchResult.summary.successRate}%)`);

    // Determine the appropriate HTTP status code based on the batch results
    let statusCode = 201; // Default to Created if at least one file was successful
    if (batchResult.summary.successful === 0) {
      statusCode = 400; // Bad Request if all files failed
    } else if (batchResult.summary.failed > 0) {
      statusCode = 207; // Multi-Status (WebDAV) if there was partial success
    }

    // Respond with a detailed summary of the batch upload
    res.status(statusCode).json({
      message: `Batch upload completed: ${batchResult.summary.successful}/${batchResult.summary.total} files uploaded successfully.`,
      summary: batchResult.summary,
      successful: batchResult.successful,
      failed: batchResult.failed,
      success: batchResult.summary.successful > 0, // True if at least one file succeeded
      partialSuccess: batchResult.summary.successful > 0 && batchResult.summary.failed > 0, // True if some succeeded and some failed
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error(`❌ Controller: Batch upload failed -`, error?.message || 'Unknown error');
    handleErrorResponse(res, error, 'Multiple file upload failed due to an unexpected error.');
  }
};

/**
 * NEW: Controller for testing CloudFront access.
 * This endpoint allows you to provide a `processedPath` and get a report on whether
 * a signed URL can be generated and if the corresponding file exists in S3.
 * Useful for debugging CloudFront 403 errors.
 *
 * @param req The Express request object (expects `processedPath` in body).
 * @param res The Express response object.
 */
export const testCloudFrontAccess = async (req: Request, res: Response) => {
  try {
    const { processedPath } = req.body;

    if (!processedPath) {
      return res.status(400).json({
        message: '`processedPath` is required in the request body to test CloudFront access.',
        error: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🧪 Controller: Testing CloudFront access for path: ${processedPath}`);

    // Call the service utility function for CloudFront access testing
    const testResult = await mediaFileService.testCloudFrontAccess(processedPath);

    // Respond with the test results
    res.status(200).json({
      ...testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error(`❌ Controller: CloudFront access test failed -`, error?.message || 'Unknown error');
    handleErrorResponse(res, error, 'CloudFront access test failed due to an unexpected error.');
  }
};

/**
 * NEW: Controller for validating CloudFront and S3 environment variables.
 * Provides a quick health check of the necessary environment configurations.
 *
 * @param req The Express request object.
 * @param res The Express response object.
 */
export const validateEnvironment = async (req: Request, res: Response) => {
  try {
    console.log(`🔧 Controller: Validating environment variables...`);

    // Call the service utility function for environment variable validation
    const validation = mediaFileService.validateEnvironmentVariables();

    // Determine response status code based on validation result
    const statusCode = validation.valid ? 200 : 500; // 200 OK if valid, 500 Internal Server Error if invalid

    // Respond with the validation results
    res.status(statusCode).json({
      ...validation,
      message: validation.valid ? 'Environment validation passed successfully.' : 'Environment validation failed. Please check missing variables and warnings.',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error(`❌ Controller: Environment validation failed -`, error?.message || 'Unknown error');
    handleErrorResponse(res, error, 'Environment validation failed due to an unexpected error.');
  }
};

/**
 * NEW: Controller for retrieving a single media file by its original filename.
 * This can be useful for debugging specific files without needing their database ID.
 *
 * @param req The Express request object (expects `filename` in params).
 * @param res The Express response object.
 */
export const getMediaByFilename = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        message: 'Filename parameter is required to retrieve media file.',
        error: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔍 Controller: Attempting to retrieve media by filename: ${filename}`);

    // Call the service utility function to get media by filename
    const mediaFile = await mediaFileService.getMediaByFilename(filename);

    // Respond with the found media file data
    res.status(200).json({
      data: mediaFile,
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error(`❌ Controller: Get media by filename failed -`, error?.message || 'Unknown error');

    // Handle specific "not found" errors from the service
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ // 404 Not Found
        message: error.message,
        error: true,
        timestamp: new Date().toISOString()
      });
    }

    handleErrorResponse(res, error, 'Failed to retrieve media file by filename due to an unexpected error.');
  }
};
