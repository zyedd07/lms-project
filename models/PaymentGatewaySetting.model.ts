// models/PaymentGatewaySetting.model.ts (Complete with UPI fields)
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '.';

const PaymentGatewaySetting = sequelize.define('PaymentGatewaySetting', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    gatewayName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'gateway_name',
        comment: 'Unique name for the payment gateway (e.g., "UPI", "PhonePe")'
    },
    // UPI-specific fields (NEW - for QR code generation)
    merchantUpiId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'merchant_upi_id',
        comment: 'Merchant UPI ID for receiving payments (e.g., merchant@okicici)'
    },
    merchantName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'merchant_name',
        comment: 'Merchant/Business name displayed to customers in UPI apps'
    },
    // Existing fields
    apiKey: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'api_key',
        comment: 'Hashed API Key for automated payment gateways'
    },
    apiSecret: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'api_secret',
        comment: 'Hashed API Secret for automated payment gateways'
    },
    paymentUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'payment_url',
        comment: 'Payment gateway API endpoint URL'
    },
    successUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'success_url',
        comment: 'Success redirect URL'
    },
    failureUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'failure_url',
        comment: 'Failure redirect URL'
    },
    currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'INR',
        field: 'currency',
        comment: 'Currency code (INR, USD, etc.)'
    },
    testMode: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'test_mode',
        comment: 'Whether gateway is in test/sandbox mode'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
        comment: 'Whether this gateway is active and available'
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_default',
        comment: 'Whether this is the default gateway'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'description',
        comment: 'Description or notes about this gateway'
    },
    webhookUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'webhook_url',
        comment: 'Webhook URL for payment notifications'
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at'
    },
    updatedAt: {
        type: DataTypes.DATE,
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

export default PaymentGatewaySetting;