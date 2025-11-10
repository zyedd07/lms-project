"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/PaymentGatewaySetting.model.ts (Complete with UPI fields)
const sequelize_1 = require("sequelize");
const _1 = require(".");
const PaymentGatewaySetting = _1.sequelize.define('PaymentGatewaySetting', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    gatewayName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'gateway_name',
        comment: 'Unique name for the payment gateway (e.g., "UPI", "PhonePe")'
    },
    // UPI-specific fields (NEW - for QR code generation)
    merchantUpiId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'merchant_upi_id',
        comment: 'Merchant UPI ID for receiving payments (e.g., merchant@okicici)'
    },
    merchantName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'merchant_name',
        comment: 'Merchant/Business name displayed to customers in UPI apps'
    },
    // Existing fields
    apiKey: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'api_key',
        comment: 'Hashed API Key for automated payment gateways'
    },
    apiSecret: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'api_secret',
        comment: 'Hashed API Secret for automated payment gateways'
    },
    paymentUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'payment_url',
        comment: 'Payment gateway API endpoint URL'
    },
    successUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'success_url',
        comment: 'Success redirect URL'
    },
    failureUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'failure_url',
        comment: 'Failure redirect URL'
    },
    currency: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'INR',
        field: 'currency',
        comment: 'Currency code (INR, USD, etc.)'
    },
    testMode: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'test_mode',
        comment: 'Whether gateway is in test/sandbox mode'
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
        comment: 'Whether this gateway is active and available'
    },
    isDefault: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_default',
        comment: 'Whether this is the default gateway'
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'description',
        comment: 'Description or notes about this gateway'
    },
    webhookUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'webhook_url',
        comment: 'Webhook URL for payment notifications'
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'created_at'
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'updated_at'
    }
}, {
    timestamps: true,
    tableName: 'payment_settings',
    underscored: true,
    indexes: [
        { fields: ['gateway_name'], unique: true },
        { fields: ['is_active'] },
        { fields: ['is_default'] }
    ]
});
exports.default = PaymentGatewaySetting;
