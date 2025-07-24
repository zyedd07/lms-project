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
// CRITICAL: Fixed CloudFront signing with proper error handling and file existence check
const generateCloudFrontSignedUrl = (processedCloudFrontPath_1, ...args_1) => __awaiter(void 0, [processedCloudFrontPath_1, ...args_1], void 0, function* (processedCloudFrontPath, checkFileExists = true) {
    const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
    const CLOUDFRONT_PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY;
    const CLOUDFRONT_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID;
    // Validate environment variables
    if (!CLOUDFRONT_MEDIA_DOMAIN || !CLOUDFRONT_PRIVATE_KEY || !CLOUDFRONT_KEY_PAIR_ID) {
        throw new Error('CloudFront environment variables missing: CLOUDFRONT_MEDIA_DOMAIN, CLOUDFRONT_PRIVATE_KEY, or CLOUDFRONT_KEY_PAIR_ID');
    }
    // Normalize path - ensure it starts with forward slash and remove any double slashes
    const normalizedPath = processedCloudFrontPath.startsWith('/')
        ? processedCloudFrontPath
        : `/${processedCloudFrontPath}`;
    const cleanPath = normalizedPath.replace(/\/+/g, '/'); // Remove double slashes
    const resourceUrl = `https://${CLOUDFRONT_MEDIA_DOMAIN}${cleanPath}`;
    // OPTIONAL: Check if file exists in S3 before signing (helps with debugging)
    if (checkFileExists) {
        const s3Key = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
        try {
            yield aws_1.s3Client.send(new client_s3_1.HeadObjectCommand({
                Bucket: aws_1.S3_BUCKET_NAME,
                Key: s3Key
            }));
            console.log(`✅ File verified in S3: ${s3Key}`);
        }
        catch (s3Error) {
            console.warn(`⚠️  File may not exist in S3: ${s3Key} - ${(s3Error === null || s3Error === void 0 ? void 0 : s3Error.message) || 'Unknown error'}`);
            // Don't throw error here - file might be created by MediaConvert later
        }
    }
    // FIXED: Proper UTC time handling for signing
    const currentTime = new Date();
    const expirationTime = new Date(currentTime.getTime() + (2 * 365 * 24 * 60 * 60 * 1000)); // 2 years from now
    console.log('=== CloudFront Signing ===');
    console.log('Path:', cleanPath);
    console.log('Resource URL:', resourceUrl);
    console.log('Current time (UTC):', currentTime.toISOString());
    console.log('Expiration time (UTC):', expirationTime.toISOString());
    console.log('Key Pair ID:', CLOUDFRONT_KEY_PAIR_ID);
    try {
        // FIXED: Ensure private key is properly formatted
        let formattedPrivateKey = CLOUDFRONT_PRIVATE_KEY;
        if (!formattedPrivateKey.includes('-----BEGIN') || !formattedPrivateKey.includes('-----END')) {
            throw new Error('CLOUDFRONT_PRIVATE_KEY must include BEGIN and END markers');
        }
        // Replace any escaped newlines with actual newlines
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
        const signedUrl = (0, cloudfront_signer_1.getSignedUrl)({
            url: resourceUrl,
            keyPairId: CLOUDFRONT_KEY_PAIR_ID,
            privateKey: formattedPrivateKey,
            dateLessThan: expirationTime.toISOString(),
        });
        // Extract and log the expires parameter for debugging
        const urlParams = new URL(signedUrl);
        const expiresParam = urlParams.searchParams.get('Expires');
        if (expiresParam) {
            const expiresDate = new Date(parseInt(expiresParam) * 1000);
            console.log('URL Expires parameter:', expiresDate.toISOString());
        }
        console.log('✅ Successfully generated signed URL');
        console.log('=== End Signing ===\n');
        return signedUrl;
    }
    catch (signingError) {
        console.error('❌ CloudFront signing failed:', signingError);
        console.error('Private key format check:', {
            hasBeginMarker: CLOUDFRONT_PRIVATE_KEY.includes('-----BEGIN'),
            hasEndMarker: CLOUDFRONT_PRIVATE_KEY.includes('-----END'),
            length: CLOUDFRONT_PRIVATE_KEY.length,
            keyPairIdLength: CLOUDFRONT_KEY_PAIR_ID.length
        });
        throw new Error(`CloudFront signing failed: ${(signingError === null || signingError === void 0 ? void 0 : signingError.message) || 'Unknown signing error'}`);
    }
});
// FIXED: Enhanced upload with better path handling and validation
const uploadMedia = (fileBuffer, originalname, mimetype, fileSize) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Generate timestamp-based S3 key
    const timestamp = Date.now();
    const sanitizedFilename = originalname.replace(/[^a-zA-Z0-9.-_]/g, '_'); // Remove special chars
    const s3Key = `uploads/${timestamp}_${sanitizedFilename}`;
    console.log(`🚀 Starting upload process for: ${originalname}`);
    console.log(`📁 S3 Key: ${s3Key}`);
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
        // Upload to S3
        console.log(`📤 Uploading to S3...`);
        yield aws_1.s3Client.send(new client_s3_1.PutObjectCommand(params));
        console.log(`✅ S3 upload successful: ${s3Key}`);
        // Create database entry
        console.log(`💾 Creating database entry...`);
        const mediaFileEntry = yield Mediafile_model_1.default.create({
            originalName: originalname,
            s3Key: s3Key,
            s3Bucket: aws_1.S3_BUCKET_NAME,
            s3Region: aws_1.AWS_REGION,
            fileUrl: `s3://${aws_1.S3_BUCKET_NAME}/${s3Key}`,
            mimeType: mimetype,
            fileSize: fileSize,
        });
        console.log(`✅ Database entry created with ID: ${mediaFileEntry.id}`);
        // Generate processed video path (MediaConvert output location)
        const filenameWithoutExtension = sanitizedFilename
            .split('.')
            .slice(0, -1)
            .join('.');
        const processedHlsPath = `/processed-videos/${filenameWithoutExtension}/index.m3u8`;
        console.log(`🎬 Expected processed video path: ${processedHlsPath}`);
        // Generate signed URL (don't check file existence yet - MediaConvert will create it)
        console.log(`🔐 Generating CloudFront signed URL...`);
        const signedCloudFrontUrl = yield generateCloudFrontSignedUrl(processedHlsPath, false);
        console.log(`✅ Upload process completed successfully`);
        return Object.assign(Object.assign({}, mediaFileEntry.toJSON()), { fileUrl: signedCloudFrontUrl, processedPath: processedHlsPath, originalS3Key: s3Key });
    }
    catch (error) {
        console.error(`❌ Upload failed for ${originalname}:`, error);
        // Enhanced error handling with specific error types
        if ((error === null || error === void 0 ? void 0 : error.name) === 'NoSuchBucket') {
            throw new Error(`S3 bucket "${aws_1.S3_BUCKET_NAME}" does not exist or is not accessible`);
        }
        else if ((error === null || error === void 0 ? void 0 : error.name) === 'AccessDenied') {
            throw new Error('S3 access denied. Check IAM permissions for PutObject operation');
        }
        else if ((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes('CloudFront')) {
            throw new Error(`CloudFront configuration error: ${error.message}`);
        }
        else if ((_b = error === null || error === void 0 ? void 0 : error.message) === null || _b === void 0 ? void 0 : _b.includes('signing')) {
            throw new Error(`URL signing failed: ${error.message}`);
        }
        throw error;
    }
});
exports.uploadMedia = uploadMedia;
// FIXED: Enhanced getAllMedia with robust error handling and file validation
const getAllMedia = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`📋 Fetching all media files from database...`);
        const mediaFiles = yield Mediafile_model_1.default.findAll({
            order: [['createdAt', 'DESC']],
        });
        console.log(`📊 Found ${mediaFiles.length} media files in database`);
        if (mediaFiles.length === 0) {
            return [];
        }
        // Process each file with signed URL generation
        const mediaFilesWithSignedUrls = yield Promise.all(mediaFiles.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const fileData = file.toJSON();
            const originalFilename = fileData.originalName;
            console.log(`[${index + 1}/${mediaFiles.length}] Processing: ${originalFilename}`);
            if (!originalFilename) {
                console.warn(`⚠️  [${index + 1}] Missing original filename for s3Key: ${fileData.s3Key}`);
                return Object.assign(Object.assign({}, fileData), { fileUrl: null, error: 'Missing original filename', status: 'error' });
            }
            // FIXED: Better filename sanitization matching upload process
            const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.-_]/g, '_');
            const filenameWithoutExtension = sanitizedFilename
                .split('.')
                .slice(0, -1)
                .join('.');
            const processedHlsPath = `/processed-videos/${filenameWithoutExtension}/index.m3u8`;
            try {
                // Generate signed URL with file existence check
                const signedCloudFrontUrl = yield generateCloudFrontSignedUrl(processedHlsPath, true);
                console.log(`✅ [${index + 1}] Generated signed URL successfully`);
                return Object.assign(Object.assign({}, fileData), { fileUrl: signedCloudFrontUrl, processedPath: processedHlsPath, status: 'ready' });
            }
            catch (signingError) {
                console.error(`❌ [${index + 1}] Signing failed for ${originalFilename}:`, (signingError === null || signingError === void 0 ? void 0 : signingError.message) || 'Unknown error');
                return Object.assign(Object.assign({}, fileData), { fileUrl: null, error: (signingError === null || signingError === void 0 ? void 0 : signingError.message) || 'Unknown signing error', processedPath: processedHlsPath, status: 'error' });
            }
        })));
        // Log summary
        const successCount = mediaFilesWithSignedUrls.filter(f => f.status === 'ready').length;
        const errorCount = mediaFilesWithSignedUrls.filter(f => f.status === 'error').length;
        console.log(`📈 Processing complete - Success: ${successCount}, Errors: ${errorCount}`);
        return mediaFilesWithSignedUrls;
    }
    catch (error) {
        console.error('❌ Error in getAllMedia service:', error);
        throw error;
    }
});
exports.getAllMedia = getAllMedia;
const deleteMedia = (fileId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mediaFile = yield Mediafile_model_1.default.findByPk(fileId);
        if (!mediaFile) {
            const error = new Error('Media file not found.');
            error.statusCode = 404;
            throw error;
        }
        // Delete from S3
        const params = {
            Bucket: mediaFile.s3Bucket,
            Key: mediaFile.s3Key,
        };
        console.log(`Deleting from S3: ${mediaFile.s3Key}`);
        yield aws_1.s3Client.send(new client_s3_1.DeleteObjectCommand(params));
        // Delete from database
        yield mediaFile.destroy();
        console.log(`Successfully deleted media file: ${fileId}`);
        return { message: 'Media file deleted successfully.' };
    }
    catch (error) {
        console.error('Error in deleteMedia service:', error);
        throw error;
    }
});
exports.deleteMedia = deleteMedia;
// FIXED: Enhanced multiple file upload with better error handling
const uploadMultipleMedia = (files) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`🔄 Starting batch upload of ${files.length} files`);
    const uploadedFilesMetadata = [];
    const errors = [];
    // Process files sequentially to avoid overwhelming S3/CloudFront
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileNumber = i + 1;
        console.log(`\n[${fileNumber}/${files.length}] Processing: ${file.originalname}`);
        console.log(`📏 File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`🎭 MIME type: ${file.mimetype}`);
        try {
            const result = yield (0, exports.uploadMedia)(file.buffer, file.originalname, file.mimetype, file.size);
            uploadedFilesMetadata.push(Object.assign(Object.assign({}, result), { batchIndex: fileNumber, batchTotal: files.length }));
            console.log(`✅ [${fileNumber}/${files.length}] Success: ${file.originalname}`);
        }
        catch (error) {
            console.error(`❌ [${fileNumber}/${files.length}] Failed: ${file.originalname}`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
            errors.push({
                filename: file.originalname,
                error: (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error',
                batchIndex: fileNumber,
                fileSize: file.size,
                mimeType: file.mimetype
            });
        }
        // Add small delay between uploads to prevent rate limiting
        if (i < files.length - 1) {
            yield new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    // Final summary
    console.log(`\n📊 Batch upload completed:`);
    console.log(`✅ Successful uploads: ${uploadedFilesMetadata.length}`);
    console.log(`❌ Failed uploads: ${errors.length}`);
    if (errors.length > 0) {
        console.log(`\n💥 Upload errors:`);
        errors.forEach((err, idx) => {
            console.log(`  ${idx + 1}. ${err.filename}: ${err.error}`);
        });
    }
    // Return results with error information included
    return {
        successful: uploadedFilesMetadata,
        failed: errors,
        summary: {
            total: files.length,
            successful: uploadedFilesMetadata.length,
            failed: errors.length,
            successRate: Math.round((uploadedFilesMetadata.length / files.length) * 100)
        }
    };
});
exports.uploadMultipleMedia = uploadMultipleMedia;
// NEW: Utility functions for debugging and validation
const testCloudFrontAccess = (processedPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`🧪 Testing CloudFront access for: ${processedPath}`);
        // Check if file exists in S3
        const s3Key = processedPath.startsWith('/') ? processedPath.substring(1) : processedPath;
        let fileExists = false;
        try {
            yield aws_1.s3Client.send(new client_s3_1.HeadObjectCommand({
                Bucket: aws_1.S3_BUCKET_NAME,
                Key: s3Key
            }));
            fileExists = true;
            console.log(`✅ File exists in S3: ${s3Key}`);
        }
        catch (s3Error) {
            console.log(`❌ File not found in S3: ${s3Key}`);
        }
        // Test signed URL generation
        const signedUrl = yield generateCloudFrontSignedUrl(processedPath, false);
        return {
            success: true,
            signedUrl,
            fileExists,
            s3Key
        };
    }
    catch (error) {
        return {
            success: false,
            error: (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error',
            fileExists: false
        };
    }
});
exports.testCloudFrontAccess = testCloudFrontAccess;
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
            // Additional validation
            if (envVar === 'CLOUDFRONT_PRIVATE_KEY') {
                if (!value.includes('-----BEGIN') || !value.includes('-----END')) {
                    warnings.push('CLOUDFRONT_PRIVATE_KEY may be missing BEGIN/END markers');
                }
            }
            else if (envVar === 'CLOUDFRONT_MEDIA_DOMAIN') {
                if (value.includes('http://') || value.includes('https://')) {
                    warnings.push('CLOUDFRONT_MEDIA_DOMAIN should not include protocol (http/https)');
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
// NEW: Function to get media by filename (useful for debugging specific files)
const getMediaByFilename = (filename) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mediaFile = yield Mediafile_model_1.default.findOne({
            where: {
                originalName: filename
            }
        });
        if (!mediaFile) {
            throw new Error(`Media file not found: ${filename}`);
        }
        const fileData = mediaFile.toJSON();
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-_]/g, '_');
        const filenameWithoutExtension = sanitizedFilename.split('.').slice(0, -1).join('.');
        const processedHlsPath = `/processed-videos/${filenameWithoutExtension}/index.m3u8`;
        try {
            const signedCloudFrontUrl = yield generateCloudFrontSignedUrl(processedHlsPath, true);
            return Object.assign(Object.assign({}, fileData), { fileUrl: signedCloudFrontUrl, processedPath: processedHlsPath, status: 'ready' });
        }
        catch (signingError) {
            return Object.assign(Object.assign({}, fileData), { fileUrl: null, error: (signingError === null || signingError === void 0 ? void 0 : signingError.message) || 'Unknown signing error', processedPath: processedHlsPath, status: 'error' });
        }
    }
    catch (error) {
        console.error('Error in getMediaByFilename:', error);
        throw error;
    }
});
exports.getMediaByFilename = getMediaByFilename;
