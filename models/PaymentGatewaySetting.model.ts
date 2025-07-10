// models/PaymentGatewaySetting.model.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '.'; // Your Sequelize instance

const PaymentGatewaySetting = sequelize.define('PaymentGatewaySetting', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    gatewayName: { // Matches gateway_name
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'gateway_name' // Explicitly map to snake_case column
    },
    apiKey: { // Matches api_key
        type: DataTypes.STRING,
        allowNull: true,
        field: 'api_key'
    },
    apiSecret: { // Matches api_secret
        type: DataTypes.STRING,
        allowNull: true,
        field: 'api_secret'
    },
    paymentUrl: { // Matches payment_url
        type: DataTypes.STRING,
        allowNull: true,
        field: 'payment_url'
    },
    successUrl: { // Matches success_url
        type: DataTypes.STRING,
        allowNull: true,
        field: 'success_url'
    },
    failureUrl: { // Matches failure_url
        type: DataTypes.STRING,
        allowNull: true,
        field: 'failure_url'
    },
    currency: { // Matches currency
        type: DataTypes.STRING,
        allowNull: true,
        field: 'currency'
    },
    testMode: { // Matches test_mode
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'test_mode'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        unique: true,
    },
    
    
}, {
    timestamps: true, // This will handle created_at and updated_at automatically
    tableName: 'payment_settings', 
    underscored: true, // This will automatically map camelCase model attributes to snake_case columns
});

export default PaymentGatewaySetting;