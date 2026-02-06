"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Payment.model.ts
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
        field: 'userid',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    orderId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'orderid',
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    courseId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'courseid',
    },
    qbankId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'qbankid',
    },
    testSeriesId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'testseriesid',
    },
    webinarId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'webinarid',
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    gatewayName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        field: 'gatewayname',
    },
    transactionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'transactionid',
    },
    gatewayTransactionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'gatewaytransactionid',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'successful', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
        // ✅ NO indexes defined here - they're in the model options below
    },
    verifiedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'verifiedby',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    verifiedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'verifiedat',
    },
    adminNotes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'adminnotes',
    },
    paymentProofUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'paymentproofurl',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'createdat',
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'updatedat',
    },
}, {
    tableName: 'payments',
    freezeTableName: true,
    timestamps: true,
    // ✅ Define indexes here at the model level
    indexes: [
        {
            name: 'payments_userid_idx', // Give them unique names
            fields: ['userid']
        },
        {
            name: 'payments_orderid_idx',
            fields: ['orderid']
        },
        {
            name: 'payments_status_idx',
            fields: ['status']
        },
        {
            name: 'payments_transactionid_idx',
            fields: ['transactionid']
        },
        {
            name: 'payments_verifiedby_idx',
            fields: ['verifiedby']
        },
    ]
});
exports.default = Payment;
