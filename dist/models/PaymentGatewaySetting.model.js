"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/PaymentGatewaySetting.model.ts
const sequelize_1 = require("sequelize");
const _1 = require("."); // Your Sequelize instance
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
        field: 'gateway_name' // Explicitly map to snake_case column
    },
    apiKey: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'api_key'
    },
    apiSecret: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'api_secret'
    },
    paymentUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'payment_url'
    },
    successUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'success_url'
    },
    failureUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'failure_url'
    },
    currency: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'currency'
    },
    testMode: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'test_mode'
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    isDefault: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        unique: true,
    },
}, {
    timestamps: true, // This will handle created_at and updated_at automatically
    tableName: 'payment_settings',
    underscored: true, // This will automatically map camelCase model attributes to snake_case columns
});
exports.default = PaymentGatewaySetting;
