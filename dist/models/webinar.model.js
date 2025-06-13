"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
// Adjust this import path to where your Sequelize instance (named `sequelize`) is initialized.
const _1 = require("."); // Placeholder import path, adjust as per your setup
const Webinar = _1.sequelize.define('Webinar', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4, // Automatically generate a UUID
        primaryKey: true,
        allowNull: false,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(255), // Explicit max length
        allowNull: false,
    },
    speaker: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    date: {
        type: sequelize_1.DataTypes.STRING(50), // Storing as string (e.g., "June 5, 2025")
        allowNull: false,
    },
    time: {
        type: sequelize_1.DataTypes.STRING(20), // Storing as string (e.g., "10:00 AM IST")
        allowNull: false,
    },
    imageUrl: {
        type: sequelize_1.DataTypes.STRING(500), // URL for image, can be longer
        allowNull: true, // Allow null if image isn't always available
    },
    // --- UPDATED: Changed isLive to status enum ---
    status: {
        type: sequelize_1.DataTypes.ENUM('upcoming', 'live', 'recorded'), // Define possible states
        defaultValue: 'upcoming', // Default status for new webinars
        allowNull: false,
    },
    // --- END UPDATED ---
    jitsiRoomName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true, // Ensure Jitsi room names are unique
    },
    // --- NEW: Price Field ---
    price: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2), // Use FLOAT for decimal numbers (e.g., currency)
        defaultValue: 0.0, // Default price
        allowNull: false,
    },
    // --- END NEW ---
}, {
    tableName: 'webinars', // Name of the table in your PostgreSQL database
    timestamps: true, // Enable createdAt and updatedAt fields
});
exports.default = Webinar;
