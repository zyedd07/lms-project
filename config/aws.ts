
import * as AWS from 'aws-sdk'; // Use import * as AWS for TypeScript

// Configure AWS with your credentials and region
// It's best practice to load these from environment variables
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Correct way to export multiple named items from an object literal in TypeScript
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME as string;
const AWS_REGION = process.env.AWS_REGION as string;

export {
  s3,
  S3_BUCKET_NAME,
  AWS_REGION,
};