"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const index_1 = require("./index"); // Assuming your sequelize instance is exported from './index'
const QuestionBank = index_1.sequelize.define('QuestionBank', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true, // Question bank names should probably be unique
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    filePath: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    fileName: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    price: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2), // Example: up to 10 total digits, 2 after decimal (e.g., 99999999.99)
        allowNull: false, // Assuming price is always required
        defaultValue: 0.00, // Default to 0.00 if not provided
    },
    uploadedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true, // Assuming an uploader is always required
        references: {
            model: 'Users', // This should match your actual Users table name
            key: 'id',
        },
        // onDelete: 'SET NULL', // Optional: What happens if the uploader user is deleted
        // onUpdate: 'CASCADE'  // Optional: What happens if the uploader user's ID changes
    },
    uploadDate: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW, // Automatically set creation date
        allowNull: false,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt columns automatically
    tableName: 'QuestionBanks', // Explicitly define table name
});
exports.default = QuestionBank;
