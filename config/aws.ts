// Import S3Client from AWS SDK v3
import { S3Client } from '@aws-sdk/client-s3';

// Configure AWS with your credentials and region
// AWS SDK v3 clients are configured directly.
// It's best practice to load these from environment variables.
const s3Client = new S3Client({
  region: process.env.AWS_REGION as string, // Region is directly passed to the client
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

// Define separate bucket names for raw and processed videos
const RAW_VIDEO_BUCKET_NAME: string = process.env.RAW_VIDEO_BUCKET_NAME as string;
const PROCESSED_VIDEO_BUCKET_NAME: string = process.env.PROCESSED_VIDEO_BUCKET_NAME as string;
const STATIC_ASSETS_BUCKET_NAME: string = process.env.STATIC_ASSETS_BUCKET_NAME as string;

const AWS_REGION: string = process.env.AWS_REGION as string; // Still useful for metadata storage

export {
  s3Client, // Export the new v3 S3Client instance
  RAW_VIDEO_BUCKET_NAME,
  PROCESSED_VIDEO_BUCKET_NAME,
    STATIC_ASSETS_BUCKET_NAME, // Export the new static assets bucket name

  AWS_REGION,
};
