"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require("."); // Assuming './index' exports your Sequelize instance
const User = _1.sequelize.define('User', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true, // Add email validation
        }
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        unique: true,
        // Consider adding a custom validator for phone number format if needed
    },
    // The 'designation' from the form maps to this 'role' field
    role: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'student'
    },
    profilePicture: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    // --- NEW FIELD FOR APPROVAL STATUS ---
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'approved', 'rejected'), // Define possible statuses
        allowNull: false,
        defaultValue: 'pending', // New users start as pending, especially teachers
        // For students, you might set this to 'approved' directly in your registration logic
        // For admins, it would also be 'approved' by default or during initial setup
    },
    // --- ADDITIONAL USER DETAILS ---
    dateOfBirth: {
        type: sequelize_1.DataTypes.DATEONLY, // Use DATEONLY if you only need the date part
        allowNull: true,
    },
    address: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    rollNo: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    collegeName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    university: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    country: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    // --- PASSWORD RESET FIELDS ---
    passwordResetToken: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    passwordResetExpires: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    // --- PERMISSIONS FIELD ---
    permissions: {
        type: sequelize_1.DataTypes.JSONB, // JSONB is generally preferred over JSON for performance with querying
        allowNull: true,
        defaultValue: {
            courses: true,
            tests: true,
            qbank: true,
            webinars: true,
            drugIndex: true,
            article: true,
            brand: true,
            mediaLibrary: true
        }
    }
}, {
    timestamps: true, // This will automatically add `createdAt` and `updatedAt` fields
    // You can add other model options here, like `tableName` if your table name differs
    // tableName: 'users_table', // Example if your table is not 'users'
});
exports.default = User;
