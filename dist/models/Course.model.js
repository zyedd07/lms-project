"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
const Course = _1.sequelize.define('Course', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    price: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    demoVideoUrl: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    imageUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    categoryId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Categories',
            key: 'id',
        },
    },
    courseType: {
        type: sequelize_1.DataTypes.ENUM('live', 'recorded'),
        allowNull: false,
    },
    active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    syllabus: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
    },
    // --- ADD THIS NEW FIELD ---
    contents: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        defaultValue: [], // Default to an empty array
    },
    uploaderId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true, // Assuming an uploader is always required
        references: {
            model: 'Users', // This should match your actual Users table name
            key: 'id',
        },
        // onDelete: 'SET NULL', // Optional: What happens if the uploader user is deleted
        // onUpdate: 'CASCADE'  // Optional: What happens if the uploader user's ID changes
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ["name", "categoryId"],
        },
    ],
});
exports.default = Course;
