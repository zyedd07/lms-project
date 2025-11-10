"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/Payment.model.ts (Fixed with proper field mappings)
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
        field: 'userid', // ✅ Map to lowercase column
        references: {
            model: 'users',
            key: 'id'
        }
    },
    orderId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'orderid', // ✅ Map to lowercase column
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    // Product IDs (duplicated from order for quick reference)
    courseId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'courseid', // ✅ Map to lowercase column
    },
    qbankId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'qbankid', // ✅ Map to lowercase column
    },
    testSeriesId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'testseriesid', // ✅ Map to lowercase column
    },
    webinarId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'webinarid', // ✅ Map to lowercase column
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    gatewayName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        field: 'gatewayname', // ✅ Map to lowercase column
    },
    transactionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'transactionid', // ✅ Map to lowercase column
    },
    gatewayTransactionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'gatewaytransactionid', // ✅ Map to lowercase column
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
        field: 'verifiedby', // ✅ Map to lowercase column
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'Admin user ID who verified the payment'
    },
    verifiedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'verifiedat', // ✅ Map to lowercase column
        comment: 'Timestamp when payment was verified'
    },
    adminNotes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'adminnotes', // ✅ Map to lowercase column
        comment: 'Notes added by admin during verification'
    },
    // Optional: Store raw payment proof (screenshot URL, etc.)
    paymentProofUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'paymentproofurl', // ✅ Map to lowercase column
        comment: 'URL to payment screenshot/proof uploaded by user'
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'createdat', // ✅ Map to lowercase column
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'updatedat', // ✅ Map to lowercase column
    },
}, {
    tableName: 'payments', // ✅ Force lowercase table name
    freezeTableName: true, // ✅ Prevent pluralization
    timestamps: true,
    indexes: [
        { fields: ['userid'] },
        { fields: ['orderid'] },
        { fields: ['status'] },
        { fields: ['transactionid'] },
        { fields: ['verifiedby'] },
    ]
});
exports.default = Payment;
