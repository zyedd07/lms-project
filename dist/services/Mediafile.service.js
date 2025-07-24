"use strict";
// services/mediaFile.service.ts
// COMPLETE FIXED VERSION - This addresses all the CloudFront 403 issues
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMediaByFilename = exports.validateEnvironmentVariables = exports.testCloudFrontAccess = exports.uploadMultipleMedia = exports.deleteMedia = exports.getAllMedia = exports.uploadMedia = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const cloudfront_signer_1 = require("@aws-sdk/cloudfront-signer");
const aws_1 = require("../config/aws");
const Mediafile_model_1 = __importDefault(require("../models/Mediafile.model"));
/**
 * Generates a CloudFront signed URL for a given processed file path.
 * This function is critical for securely serving private content via CloudFront.
 *
 * @param processedCloudFrontPath The path to the file on CloudFront (e.g., /processed-videos/myvideo/index.m3u8).
 * This path should be relative to the CloudFront distribution's root.
 * @param checkFileExists Optional. If true, performs a HeadObjectCommand on S3 to verify file existence before signing.
 * Useful for debugging, but can be set to false for files that will be created later (e.g., by MediaConvert).
 * @returns A promise that resolves with the generated signed URL.
 * @throws An error if CloudFront environment variables are missing, the private key is malformed, or signing fails.
 */
const generateCloudFrontSignedUrl = (processedCloudFrontPath_1, ...args_1) => __awaiter(void 0, [processedCloudFrontPath_1, ...args_1], void 0, function* (processedCloudFrontPath, checkFileExists = true) {
    // Retrieve CloudFront environment variables
    const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
    const CLOUDFRONT_PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY;
    const CLOUDFRONT_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID;
    // Validate environment variables are present
    if (!CLOUDFRONT_MEDIA_DOMAIN || !CLOUDFRONT_PRIVATE_KEY || !CLOUDFRONT_KEY_PAIR_ID) {
        throw new Error('CloudFront environment variables missing: CLOUDFRONT_MEDIA_DOMAIN, CLOUDFRONT_PRIVATE_KEY, or CLOUDFRONT_KEY_PAIR_ID. Please ensure they are set in your .env file.');
    }
    // Normalize the CloudFront path:
    // 1. Ensure it starts with a forward slash.
    // 2. Remove any multiple consecutive forward slashes (e.g., //, ///) to prevent issues.
    const normalizedPath = processedCloudFrontPath.startsWith('/')
        ? processedCloudFrontPath
        : `/${processedCloudFrontPath}`;
    const cleanPath = normalizedPath.replace(/\/+/g, '/'); // Replaces // with /
    // Construct the full resource URL that CloudFront will serve
    const resourceUrl = `https://${CLOUDFRONT_MEDIA_DOMAIN}${cleanPath}`;
    // OPTIONAL: Check if the file exists in S3 before generating the signed URL.
    // This helps in debugging 403 errors that might be due to non-existent files.
    // For files that are processed asynchronously (e.g., by AWS MediaConvert),
    // this check might initially fail, which is expected.
    if (checkFileExists) {
        // S3 key should not start with a leading slash for HeadObjectCommand
        const s3Key = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
        try {
            yield aws_1.s3Client.send(new client_s3_1.HeadObjectCommand({
                Bucket: aws_1.S3_BUCKET_NAME,
                Key: s3Key
            }));
            console.log(`✅ File verified in S3: ${s3Key}`);
        }
        catch (s3Error) {
            console.warn(`⚠️  File may not exist in S3: ${s3Key} - ${(s3Error === null || s3Error === void 0 ? void 0 : s3Error.message) || 'Unknown error'}. This might be expected if MediaConvert is still processing.`);
            // Do not throw an error here, as the file might be created by MediaConvert later.
        }
    }
    // Calculate expiration time for the signed URL.
    // A 2-year expiration is used here; adjust as per your security requirements.
    const currentTime = new Date();
    const expirationTime = new Date(currentTime.getTime() + (2 * 365 * 24 * 60 * 60 * 1000)); // 2 years from now
    console.log('=== CloudFront Signing Process ===');
    console.log('Path to be signed:', cleanPath);
    console.log('Full Resource URL:', resourceUrl);
    console.log('Current time (UTC):', currentTime.toISOString());
    console.log('Expiration time (UTC):', expirationTime.toISOString());
    console.log('Key Pair ID:', CLOUDFRONT_KEY_PAIR_ID);
    try {
        // CRITICAL FIX: Ensure the private key is correctly formatted with actual newlines.
        // Environment variables often escape newlines (e.g., `\n` instead of actual newline characters).
        let formattedPrivateKey = CLOUDFRONT_PRIVATE_KEY;
        // Replace escaped newlines with actual newline characters
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
        // Validate that the private key includes the necessary BEGIN/END markers.
        // This is a common source of 403 errors if the key is copied incorrectly.
        if (!formattedPrivateKey.includes('-----BEGIN') || !formattedPrivateKey.includes('-----END')) {
            throw new Error('CLOUDFRONT_PRIVATE_KEY must include "-----BEGIN PRIVATE KEY-----" and "-----END PRIVATE KEY-----" markers with proper newlines.');
        }
        // Generate the signed URL using the CloudFront signer library
        const signedUrl = (0, cloudfront_signer_1.getSignedUrl)({
            url: resourceUrl,
            keyPairId: CLOUDFRONT_KEY_PAIR_ID,
            privateKey: formattedPrivateKey,
            dateLessThan: expirationTime.toISOString(), // Use ISO string for consistency
        });
        // For debugging: Extract and log the 'Expires' parameter from the generated URL
        const urlParams = new URL(signedUrl);
        const expiresParam = urlParams.searchParams.get('Expires');
        if (expiresParam) {
            const expiresDate = new Date(parseInt(expiresParam) * 1000); // Expires is a Unix timestamp
            console.log('URL Expires parameter (Parsed Date):', expiresDate.toISOString());
        }
        console.log('✅ Successfully generated signed URL');
        console.log('=== End CloudFront Signing ===\n');
        return signedUrl;
    }
    catch (signingError) {
        console.error('❌ CloudFront signing failed:', signingError);
        // Provide detailed information to help diagnose the issue
        console.error('Private key format check details:', {
            hasBeginMarker: CLOUDFRONT_PRIVATE_KEY.includes('-----BEGIN'),
            hasEndMarker: CLOUDFRONT_PRIVATE_KEY.includes('-----END'),
            length: CLOUDFRONT_PRIVATE_KEY.length,
            keyPairIdLength: CLOUDFRONT_KEY_PAIR_ID.length,
            // Only log a snippet of the key, not the whole key for security
            privateKeySnippet: CLOUDFRONT_PRIVATE_KEY.substring(0, 50) + '...' + CLOUDFRONT_PRIVATE_KEY.substring(CLOUDFRONT_PRIVATE_KEY.length - 50)
        });
        throw new Error(`CloudFront signing failed: ${(signingError === null || signingError === void 0 ? void 0 : signingError.message) || 'Unknown signing error'}. Please check your private key format and CloudFront configuration.`);
    }
});
/**
 * Uploads a single media file to S3 and creates a corresponding database entry.
 * It also generates a CloudFront signed URL for the expected processed video path.
 *
 * @param fileBuffer The buffer of the file to upload.
 * @param originalname The original name of the file.
 * @param mimetype The MIME type of the file.
 * @param fileSize The size of the file in bytes.
 * @returns A promise that resolves with the media file metadata, including the signed CloudFront URL.
 * @throws An error if S3 upload or database operations fail.
 */
const uploadMedia = (fileBuffer, originalname, mimetype, fileSize) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // Generate a unique S3 key using a timestamp and a sanitized version of the original filename.
    const timestamp = Date.now();
    // Sanitize filename to remove characters that might cause issues in S3 keys or URLs.
    const sanitizedFilename = originalname.replace(/[^a-zA-Z0-9.-_]/g, '_');
    const s3Key = `uploads/${timestamp}_${sanitizedFilename}`;
    console.log(`🚀 Starting upload process for: ${originalname}`);
    console.log(`📁 S3 Key to be used: ${s3Key}`);
    // Define parameters for the S3 PutObjectCommand
    const params = {
        Bucket: aws_1.S3_BUCKET_NAME,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimetype,
        Metadata: {
            'original-name': originalname,
            'upload-timestamp': timestamp.toString()
        }
    };
    try {
        // Step 1: Upload the file to S3
        console.log(`📤 Uploading file to S3 bucket "${aws_1.S3_BUCKET_NAME}"...`);
        yield aws_1.s3Client.send(new client_s3_1.PutObjectCommand(params));
        console.log(`✅ S3 upload successful: ${s3Key}`);
        // Step 2: Create a database entry for the uploaded file
        console.log(`💾 Creating database entry for ${originalname}...`);
        const mediaFileEntry = yield Mediafile_model_1.default.create({
            originalName: originalname,
            s3Key: s3Key,
            s3Bucket: aws_1.S3_BUCKET_NAME,
            s3Region: aws_1.AWS_REGION,
            fileUrl: `s3://${aws_1.S3_BUCKET_NAME}/${s3Key}`, // S3 URI for the original file
            mimeType: mimetype,
            fileSize: fileSize,
        });
        console.log(`✅ Database entry created with ID: ${mediaFileEntry.id}`);
        // Step 3: Determine the expected path for the processed video (e.g., HLS output from MediaConvert).
        // This path is used to generate the CloudFront signed URL.
        // Based on S3 listing: processed-videos/TIMESTAMP_FILENAME/TIMESTAMP_FILENAME.m3u8
        const mediaConvertBaseName = ((_a = s3Key.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('.')[0]) || ''; // Extract "TIMESTAMP_FILENAME" from "uploads/TIMESTAMP_FILENAME.ext"
        if (!mediaConvertBaseName) {
            throw new Error('Could not derive base name for processed video from S3 key.');
        }
        const processedHlsPath = `/processed-videos/${mediaConvertBaseName}/${mediaConvertBaseName}.m3u8`;
        console.log(`🎬 Expected processed video path for CloudFront: ${processedHlsPath}`);
        // Step 4: Generate a CloudFront signed URL for the *expected* processed file.
        // We set `checkFileExists` to `false` here because MediaConvert will create this file asynchronously.
        console.log(`🔐 Generating CloudFront signed URL for processed path...`);
        const signedCloudFrontUrl = yield generateCloudFrontSignedUrl(processedHlsPath, false);
        console.log(`✅ Upload process completed successfully for ${originalname}`);
        // Return the database entry along with the signed CloudFront URL and other relevant paths.
        return Object.assign(Object.assign({}, mediaFileEntry.toJSON()), { fileUrl: signedCloudFrontUrl, processedPath: processedHlsPath, originalS3Key: s3Key // The S3 key for the original uploaded file
         });
    }
    catch (error) {
        console.error(`❌ Upload failed for ${originalname}:`, error);
        // Enhance error messages for common S3/CloudFront issues
        if ((error === null || error === void 0 ? void 0 : error.name) === 'NoSuchBucket') {
            throw new Error(`S3 bucket "${aws_1.S3_BUCKET_NAME}" does not exist or is not accessible. Check your S3_BUCKET_NAME configuration.`);
        }
        else if ((error === null || error === void 0 ? void 0 : error.name) === 'AccessDenied') {
            throw new Error('S3 access denied. Check IAM permissions for PutObject operation on your S3 bucket.');
        }
        else if ((_b = error === null || error === void 0 ? void 0 : error.message) === null || _b === void 0 ? void 0 : _b.includes('CloudFront')) {
            throw new Error(`CloudFront configuration or signing error during upload: ${error.message}`);
        }
        else if ((_c = error === null || error === void 0 ? void 0 : error.message) === null || _c === void 0 ? void 0 : _c.includes('signing')) {
            throw new Error(`URL signing failed during upload: ${error.message}. Check your CloudFront private key and key pair ID.`);
        }
        throw error; // Re-throw any other unhandled errors
    }
});
exports.uploadMedia = uploadMedia;
/**
 * Retrieves all media files from the database and generates CloudFront signed URLs for them.
 * This function handles potential errors during URL signing for individual files.
 *
 * @returns A promise that resolves with an array of media file metadata, each including a signed CloudFront URL or an error status.
 */
const getAllMedia = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`📋 Fetching all media files from database...`);
        const mediaFiles = yield Mediafile_model_1.default.findAll({
            order: [['createdAt', 'DESC']], // Order by creation date, newest first
        });
        console.log(`📊 Found ${mediaFiles.length} media files in database`);
        if (mediaFiles.length === 0) {
            return []; // Return an empty array if no files are found
        }
        // Process each media file to generate its signed CloudFront URL.
        // Using Promise.allSettled would be more robust if you need to continue processing
        // even if some promises fail, but Promise.all is fine if individual errors are handled.
        const mediaFilesWithSignedUrls = yield Promise.all(mediaFiles.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const fileData = file.toJSON();
            const originalFilename = fileData.originalName;
            console.log(`[${index + 1}/${mediaFiles.length}] Processing file: ${originalFilename || fileData.s3Key}`);
            // Basic validation: Ensure original filename exists for path generation
            if (!originalFilename) {
                console.warn(`⚠️  [${index + 1}] Missing original filename for s3Key: ${fileData.s3Key}. Cannot generate processed path.`);
                return Object.assign(Object.assign({}, fileData), { fileUrl: null, error: 'Missing original filename for processed path generation', status: 'error' // Indicate an error for this specific file
                 });
            }
            // Re-derive the processed HLS path consistently based on the stored s3Key.
            // Based on S3 listing: processed-videos/TIMESTAMP_FILENAME/TIMESTAMP_FILENAME.m3u8
            const mediaConvertBaseName = ((_a = fileData.s3Key.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('.')[0]) || '';
            if (!mediaConvertBaseName) {
                console.warn(`⚠️  [${index + 1}] Could not derive base name for processed video from s3Key: ${fileData.s3Key}.`);
                return Object.assign(Object.assign({}, fileData), { fileUrl: null, error: 'Could not derive processed video path from s3Key', status: 'error' });
            }
            const processedHlsPath = `/processed-videos/${mediaConvertBaseName}/${mediaConvertBaseName}.m3u8`;
            try {
                // Generate signed URL. Here, we set `checkFileExists` to `true`
                // because we expect these files to have been processed and exist in S3.
                const signedCloudFrontUrl = yield generateCloudFrontSignedUrl(processedHlsPath, true);
                console.log(`✅ [${index + 1}] Generated signed URL successfully for ${originalFilename}`);
                return Object.assign(Object.assign({}, fileData), { fileUrl: signedCloudFrontUrl, processedPath: processedHlsPath, status: 'ready' // Indicate successful processing
                 });
            }
            catch (signingError) {
                console.error(`❌ [${index + 1}] Signing failed for ${originalFilename}:`, (signingError === null || signingError === void 0 ? void 0 : signingError.message) || 'Unknown error');
                return Object.assign(Object.assign({}, fileData), { fileUrl: null, error: (signingError === null || signingError === void 0 ? void 0 : signingError.message) || 'Unknown signing error', processedPath: processedHlsPath, status: 'error' // Indicate an error for this specific file
                 });
            }
        })));
        // Log a summary of the processing results
        const successCount = mediaFilesWithSignedUrls.filter(f => f.status === 'ready').length;
        const errorCount = mediaFilesWithSignedUrls.filter(f => f.status === 'error').length;
        console.log(`📈 Media file processing complete - Successful: ${successCount}, Failed: ${errorCount}`);
        return mediaFilesWithSignedUrls;
    }
    catch (error) {
        console.error('❌ Error in getAllMedia service:', error);
        throw error; // Re-throw the error for higher-level handling
    }
});
exports.getAllMedia = getAllMedia;
/**
 * Deletes a media file from S3 and its corresponding entry from the database.
 *
 * @param fileId The ID of the media file to delete.
 * @returns A promise that resolves with a success message.
 * @throws An error if the file is not found or deletion fails.
 */
const deleteMedia = (fileId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find the media file in the database
        const mediaFile = yield Mediafile_model_1.default.findByPk(fileId);
        if (!mediaFile) {
            const error = new Error(`Media file with ID ${fileId} not found.`);
            error.statusCode = 404; // Custom status code for HTTP responses
            throw error;
        }
        // Define parameters for the S3 DeleteObjectCommand
        const params = {
            Bucket: mediaFile.s3Bucket,
            Key: mediaFile.s3Key, // S3 key of the original file
        };
        console.log(`🗑️ Deleting file from S3: ${mediaFile.s3Key}`);
        yield aws_1.s3Client.send(new client_s3_1.DeleteObjectCommand(params));
        console.log(`✅ Successfully deleted from S3.`);
        // Delete the entry from the database
        yield mediaFile.destroy();
        console.log(`✅ Successfully deleted media file entry from database: ${fileId}`);
        return { message: 'Media file deleted successfully.' };
    }
    catch (error) {
        console.error(`❌ Error in deleteMedia service for ID ${fileId}:`, error);
        throw error; // Re-throw the error
    }
});
exports.deleteMedia = deleteMedia;
/**
 * Handles the batch upload of multiple media files.
 * It iterates through the provided files, uploading each one individually.
 * Provides a summary of successful and failed uploads.
 *
 * @param files An array of multer.File objects to upload.
 * @returns A promise that resolves with an object containing successful uploads, failed uploads, and a summary.
 */
const uploadMultipleMedia = (files) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`🔄 Starting batch upload of ${files.length} files.`);
    const uploadedFilesMetadata = [];
    const errors = [];
    // Process files sequentially to manage resource usage and avoid potential rate limiting.
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileNumber = i + 1;
        console.log(`\n[${fileNumber}/${files.length}] Processing file: ${file.originalname}`);
        console.log(`📏 File size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`🎭 MIME type: ${file.mimetype}`);
        try {
            // Call the single file upload function
            const result = yield (0, exports.uploadMedia)(file.buffer, file.originalname, file.mimetype, file.size);
            uploadedFilesMetadata.push(Object.assign(Object.assign({}, result), { batchIndex: fileNumber, batchTotal: files.length }));
            console.log(`✅ [${fileNumber}/${files.length}] Successfully uploaded: ${file.originalname}`);
        }
        catch (error) {
            console.error(`❌ [${fileNumber}/${files.length}] Failed to upload: ${file.originalname}`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
            errors.push({
                filename: file.originalname,
                error: (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error',
                batchIndex: fileNumber,
                fileSize: file.size,
                mimeType: file.mimetype
            });
        }
        // Add a small delay between uploads to prevent overwhelming S3/CloudFront with requests.
        // Adjust the delay as needed based on your expected throughput and AWS service limits.
        if (i < files.length - 1) {
            yield new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        }
    }
    // Final summary of the batch upload operation
    console.log(`\n📊 Batch upload completed:`);
    console.log(`✅ Successful uploads: ${uploadedFilesMetadata.length}`);
    console.log(`❌ Failed uploads: ${errors.length}`);
    if (errors.length > 0) {
        console.log(`\n💥 Details of upload errors:`);
        errors.forEach((err, idx) => {
            console.log(`  ${idx + 1}. Filename: ${err.filename}, Error: ${err.error}`);
        });
    }
    return {
        successful: uploadedFilesMetadata,
        failed: errors,
        summary: {
            total: files.length,
            successful: uploadedFilesMetadata.length,
            failed: errors.length,
            successRate: files.length > 0 ? Math.round((uploadedFilesMetadata.length / files.length) * 100) : 0
        }
    };
});
exports.uploadMultipleMedia = uploadMultipleMedia;
// NEW UTILITY FUNCTIONS FOR DEBUGGING AND VALIDATION
/**
 * Tests CloudFront access for a given processed path by attempting to generate a signed URL
 * and optionally checking for file existence in S3.
 * This is a helpful diagnostic tool for CloudFront 403 issues.
 *
 * @param processedPath The CloudFront path to test (e.g., /processed-videos/myvideo/index.m3u8).
 * @returns An object indicating success/failure, the signed URL (if successful), error message, and file existence status.
 */
const testCloudFrontAccess = (processedPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`🧪 Initiating CloudFront access test for path: ${processedPath}`);
        // Derive S3 key from the processed path for file existence check
        const s3Key = processedPath.startsWith('/') ? processedPath.substring(1) : processedPath;
        let fileExists = false;
        // Check if the file exists in S3
        try {
            yield aws_1.s3Client.send(new client_s3_1.HeadObjectCommand({
                Bucket: aws_1.S3_BUCKET_NAME,
                Key: s3Key
            }));
            fileExists = true;
            console.log(`✅ File confirmed to exist in S3: ${s3Key}`);
        }
        catch (s3Error) {
            console.log(`❌ File NOT found in S3: ${s3Key} - ${(s3Error === null || s3Error === void 0 ? void 0 : s3Error.message) || 'Unknown S3 error'}`);
            // Do not throw, just report status
        }
        // Attempt to generate a signed URL (without re-checking file existence within generateCloudFrontSignedUrl)
        const signedUrl = yield generateCloudFrontSignedUrl(processedPath, false);
        return {
            success: true,
            signedUrl,
            fileExists,
            s3Key
        };
    }
    catch (error) {
        console.error(`❌ CloudFront access test failed for ${processedPath}:`, error);
        return {
            success: false,
            error: (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error during CloudFront access test',
            fileExists: false
        };
    }
});
exports.testCloudFrontAccess = testCloudFrontAccess;
/**
 * Validates the presence and basic format of critical CloudFront environment variables.
 * This helps in quickly identifying misconfigurations.
 *
 * @returns An object indicating validity, missing variables, and warnings about format.
 */
const validateEnvironmentVariables = () => {
    const required = [
        'CLOUDFRONT_MEDIA_DOMAIN',
        'CLOUDFRONT_PRIVATE_KEY',
        'CLOUDFRONT_KEY_PAIR_ID'
    ];
    const missing = [];
    const warnings = [];
    required.forEach(envVar => {
        const value = process.env[envVar];
        if (!value) {
            missing.push(envVar);
        }
        else {
            // Add specific validation checks for each environment variable
            if (envVar === 'CLOUDFRONT_PRIVATE_KEY') {
                if (!value.includes('-----BEGIN') || !value.includes('-----END')) {
                    warnings.push(`CLOUDFRONT_PRIVATE_KEY may be missing "-----BEGIN PRIVATE KEY-----" or "-----END PRIVATE KEY-----" markers. Ensure it's copied correctly.`);
                }
                if (!value.includes('\n') && value.includes('\\n')) {
                    warnings.push(`CLOUDFRONT_PRIVATE_KEY contains escaped newlines (\\n). Ensure these are properly converted to actual newlines in your environment setup or by the service logic.`);
                }
            }
            else if (envVar === 'CLOUDFRONT_MEDIA_DOMAIN') {
                if (value.startsWith('http://') || value.startsWith('https://')) {
                    warnings.push(`CLOUDFRONT_MEDIA_DOMAIN should generally not include protocol (http:// or https://). It should be just the domain name (e.g., 'd12345abcdef.cloudfront.net').`);
                }
            }
        }
    });
    return {
        valid: missing.length === 0,
        missing,
        warnings
    };
};
exports.validateEnvironmentVariables = validateEnvironmentVariables;
/**
 * Retrieves a single media file by its original filename from the database and generates a signed CloudFront URL for it.
 * Useful for debugging specific files.
 *
 * @param filename The original filename of the media file to retrieve.
 * @returns A promise that resolves with the media file metadata, including the signed URL, or an error status.
 * @throws An error if the media file is not found.
 */
const getMediaByFilename = (filename) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log(`🔍 Attempting to retrieve media file by filename: ${filename}`);
        const mediaFile = yield Mediafile_model_1.default.findOne({
            where: {
                originalName: filename
            }
        });
        if (!mediaFile) {
            throw new Error(`Media file not found with original filename: ${filename}`);
        }
        const fileData = mediaFile.toJSON();
        // Re-derive the processed HLS path consistently based on the stored s3Key.
        // Based on S3 listing: processed-videos/TIMESTAMP_FILENAME/TIMESTAMP_FILENAME.m3u8
        const mediaConvertBaseName = ((_a = fileData.s3Key.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('.')[0]) || '';
        if (!mediaConvertBaseName) {
            throw new Error('Could not derive base name for processed video from S3 key.');
        }
        const processedHlsPath = `/processed-videos/${mediaConvertBaseName}/${mediaConvertBaseName}.m3u8`;
        try {
            // Generate signed URL, checking for file existence
            const signedCloudFrontUrl = yield generateCloudFrontSignedUrl(processedHlsPath, true);
            console.log(`✅ Successfully retrieved and signed URL for ${filename}`);
            return Object.assign(Object.assign({}, fileData), { fileUrl: signedCloudFrontUrl, processedPath: processedHlsPath, status: 'ready' });
        }
        catch (signingError) {
            console.error(`❌ Signing failed for ${filename}:`, (signingError === null || signingError === void 0 ? void 0 : signingError.message) || 'Unknown error');
            return Object.assign(Object.assign({}, fileData), { fileUrl: null, error: (signingError === null || signingError === void 0 ? void 0 : signingError.message) || 'Unknown signing error', processedPath: processedHlsPath, status: 'error' });
        }
    }
    catch (error) {
        console.error(`❌ Error in getMediaByFilename service for ${filename}:`, error);
        throw error;
    }
});
exports.getMediaByFilename = getMediaByFilename;
