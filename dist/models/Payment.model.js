"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Revised Payment.model.ts to handle multiple product types
const sequelize_1 = require("sequelize");
const _1 = require(".");
const Payment = _1.sequelize.define('Payment', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    // Make product IDs nullable, only one should be filled per payment
    courseId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true, // Allow null if it's not a course payment
    },
    qbankId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    testSeriesId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    webinarId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    gatewayName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    transactionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true, // Ensures unique transaction IDs from gateway
    },
    gatewayTransactionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'successful', 'failed', 'refunded'), // Added 'refunded'
        allowNull: false,
        defaultValue: 'pending', // Default status for new payments
    },
    // Consider adding a 'metadata' JSONB field for raw webhook payloads for debugging
    // webhookPayload: {
    //     type: DataTypes.JSONB,
    //     allowNull: true,
    // },
}, { timestamps: true });
exports.default = Payment;
