"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require("."); // Your Sequelize instance
const MediaFile = _1.sequelize.define('MediaFile', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4, // Generates a UUID automatically
        primaryKey: true,
    },
    originalName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    s3Key: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true, // Ensure unique S3 keys
    },
    s3Bucket: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    s3Region: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    fileUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true, // URL should be unique
    },
    mimeType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true, // e.g., 'image/jpeg', 'video/mp4', 'application/pdf'
    },
    fileSize: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    uploadedByUserId: {
        type: sequelize_1.DataTypes.UUID,
        references: {
            model: 'Users', // Assuming your Admin table is named 'Admins'
            key: 'id',
        },
        allowNull: true,
    },
}, {
    tableName: 'MediaFiles', // Explicitly name the table in the database
    timestamps: true, // Adds createdAt and updatedAt columns automatically
});
exports.default = MediaFile;
