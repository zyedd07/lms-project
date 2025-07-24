"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AWS_REGION = exports.STATIC_ASSETS_BUCKET_NAME = exports.PROCESSED_VIDEO_BUCKET_NAME = exports.RAW_VIDEO_BUCKET_NAME = exports.s3Client = void 0;
// Import S3Client from AWS SDK v3
const client_s3_1 = require("@aws-sdk/client-s3");
// Configure AWS with your credentials and region
// AWS SDK v3 clients are configured directly.
// It's best practice to load these from environment variables.
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION, // Region is directly passed to the client
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
exports.s3Client = s3Client;
// Define separate bucket names for raw and processed videos
const RAW_VIDEO_BUCKET_NAME = process.env.RAW_VIDEO_BUCKET_NAME;
exports.RAW_VIDEO_BUCKET_NAME = RAW_VIDEO_BUCKET_NAME;
const PROCESSED_VIDEO_BUCKET_NAME = process.env.PROCESSED_VIDEO_BUCKET_NAME;
exports.PROCESSED_VIDEO_BUCKET_NAME = PROCESSED_VIDEO_BUCKET_NAME;
const STATIC_ASSETS_BUCKET_NAME = process.env.STATIC_ASSETS_BUCKET_NAME;
exports.STATIC_ASSETS_BUCKET_NAME = STATIC_ASSETS_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION; // Still useful for metadata storage
exports.AWS_REGION = AWS_REGION;
