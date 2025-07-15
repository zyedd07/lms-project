"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AWS_REGION = exports.S3_BUCKET_NAME = exports.s3Client = void 0;
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
// Correct way to export multiple named items from an object literal in TypeScript
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
exports.S3_BUCKET_NAME = S3_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION; // Still useful for metadata storage
exports.AWS_REGION = AWS_REGION;
