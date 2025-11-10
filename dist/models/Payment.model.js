"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/Payment.model.ts (Updated with admin verification fields)
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
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    orderId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Orders',
            key: 'id'
        }
    },
    // Product IDs (duplicated from order for quick reference)
    courseId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
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
        unique: true,
    },
    gatewayTransactionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        comment: 'Actual UPI transaction ID verified by admin'
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'successful', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
    },
    // Admin verification fields
    verifiedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        },
        comment: 'Admin user ID who verified the payment'
    },
    verifiedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when payment was verified'
    },
    adminNotes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        comment: 'Notes added by admin during verification'
    },
    // Optional: Store raw payment proof (screenshot URL, etc.)
    paymentProofUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        comment: 'URL to payment screenshot/proof uploaded by user'
    },
}, {
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['orderId'] },
        { fields: ['status'] },
        { fields: ['transactionId'] },
        { fields: ['verifiedBy'] },
    ]
});
exports.default = Payment;
