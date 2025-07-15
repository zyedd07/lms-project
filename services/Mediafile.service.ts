
import { s3, S3_BUCKET_NAME, AWS_REGION } from '../config/aws'; // AWS S3 configuration
import MediaFile from '../models/Mediafile.model'; // Import the MediaFile model

// Function to upload a file to S3 and save its metadata to the database
export const uploadMedia = async (fileBuffer: Buffer, originalname: string, mimetype: string, fileSize: number): Promise<any> => { // Changed return type to any
  // Generate a unique key for S3 to avoid overwrites
  const s3Key = `uploads/${Date.now()}_${originalname.replace(/\s/g, '_')}`;

  const params: AWS.S3.PutObjectRequest = {
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: mimetype,
    ACL: 'public-read', // Make the object publicly readable via CloudFront
  };

  try {
    // Upload file to S3
    const s3UploadResult = await s3.upload(params).promise();

    // Construct the public URL using the CloudFront domain
    const CLOUDFRONT_MEDIA_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN;
    if (!CLOUDFRONT_MEDIA_DOMAIN) {
      throw new Error('CLOUDFRONT_MEDIA_DOMAIN environment variable is not set.');
    }
    const fileUrl = `https://${CLOUDFRONT_MEDIA_DOMAIN}/${s3UploadResult.Key}`;

    // Save metadata to the RDS database
    const mediaFileEntry = await MediaFile.create({
      originalName: originalname,
      s3Key: s3Key,
      s3Bucket: S3_BUCKET_NAME,
      s3Region: AWS_REGION,
      fileUrl: fileUrl,
      mimeType: mimetype,
      fileSize: fileSize,
      // uploadedByAdminId: adminId, // Uncomment if tracking admin uploads
    });

    return mediaFileEntry.toJSON(); // Return plain object (type will be 'any')
  } catch (error) {
    console.error('Error in uploadMedia service:', error);
    throw error; // Re-throw to be caught by the controller
  }
};

// Function to get all media file metadata from the database
export const getAllMedia = async (): Promise<any[]> => { // Changed return type to any[]
  try {
    const mediaFiles = await MediaFile.findAll({
      order: [['createdAt', 'DESC']], // Order by most recent first
    });
    return mediaFiles.map(file => file.toJSON()); // Convert instances to plain objects (types will be 'any')
  } catch (error) {
    console.error('Error in getAllMedia service:', error);
    throw error;
  }
};

// Function to delete a media file from S3 and its metadata from the database
export const deleteMedia = async (fileId: string): Promise<{ message: string }> => {
  try {
    const mediaFile = await MediaFile.findByPk(fileId); // This returns a MediaFile instance or null

    if (!mediaFile) {
      const error = new Error('Media file not found.');
      (error as any).statusCode = 404; // Custom status code for controller
      throw error;
    }

    // Access properties directly from the Sequelize model instance
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: (mediaFile as any).s3Bucket, // Cast to any to bypass type checking
      Key: (mediaFile as any).s3Key,       // Cast to any to bypass type checking
    };
    await s3.deleteObject(params).promise();

    // Delete from DB
    await mediaFile.destroy();

    return { message: 'Media file deleted successfully.' };
  } catch (error) {
    console.error('Error in deleteMedia service:', error);
    throw error;
  }
};