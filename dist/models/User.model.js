"use strict";
// models/User.js (or your equivalent file path)
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
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
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true
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
    // --- NEW FIELDS TO ADD ---
    dateOfBirth: {
        type: sequelize_1.DataTypes.STRING, // Storing as a string (e.g., "DD/MM/YYYY")
        allowNull: true, // Set to false if it's a mandatory field
    },
    address: {
        type: sequelize_1.DataTypes.TEXT, // TEXT is better for potentially long addresses
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
    }
}, { timestamps: true });
exports.default = User;
