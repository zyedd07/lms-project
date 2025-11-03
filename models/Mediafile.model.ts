
import { DataTypes } from 'sequelize';
import { sequelize } from '.'; // Your Sequelize instance

const MediaFile = sequelize.define('MediaFile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Generates a UUID automatically
    primaryKey: true,
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  s3Key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Ensure unique S3 keys
  },
  s3Bucket: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  s3Region: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileUrl: { // This will store the CloudFront URL for the file
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // URL should be unique
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: true, // e.g., 'image/jpeg', 'video/mp4', 'application/pdf'
  },
  fileSize: { // Size in bytes
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  uploadedByUserId: {
    type: DataTypes.UUID,
    references: {
      model: 'Users', // Assuming your Admin table is named 'Admins'
      key: 'id',
    },
    allowNull: true,
  },
}, {
  tableName: 'MediaFiles', // Explicitly name the table in the database
  timestamps: true,        // Adds createdAt and updatedAt columns automatically
});

export default MediaFile;