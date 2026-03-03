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
            isEmail: true,
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
    },
    role: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'student'
    },
    profilePicture: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
    },
    dateOfBirth: {
        type: sequelize_1.DataTypes.DATEONLY,
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
    passwordResetToken: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    passwordResetExpires: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    permissions: {
        type: sequelize_1.DataTypes.JSONB,
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
    },
    // === NEW DEVICE TOKEN FIELDS ===
    deviceToken: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        comment: 'Unique token for current active device session'
    },
    deviceId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        comment: 'Device identifier from client'
    },
    lastLoginAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp of last successful login'
    },
    lastLoginDevice: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
        comment: 'Device information from last login'
    }
}, {
    timestamps: true,
});
exports.default = User;
