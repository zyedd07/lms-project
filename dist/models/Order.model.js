"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/Order.model.ts
const sequelize_1 = require("sequelize");
const _1 = require("."); // Your Sequelize instance
// Removed imports for OrderAttributes, OrderCreationAttributes, OrderInstance as per request
// Define the Order model without explicit generic types
// Sequelize will now infer the model attributes based on the column definitions provided.
// This will result in Model<any, any> for instances if not explicitly handled elsewhere.
const Order = _1.sequelize.define('Order', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID, // Assuming user IDs are UUIDs
        allowNull: false,
        field: 'user_id' // Explicitly map to snake_case column
    },
    courseId: {
        type: sequelize_1.DataTypes.UUID, // Assuming course IDs are UUIDs
        allowNull: true, // Allow null as it might be a testSeries, qbank, or webinar
        field: 'course_id' // Explicitly map to snake_case column
    },
    testSeriesId: {
        type: sequelize_1.DataTypes.UUID, // Assuming testSeries IDs are UUIDs
        allowNull: true, // Allow null
        field: 'test_series_id' // Explicitly map to snake_case column
    },
    qbankId: {
        type: sequelize_1.DataTypes.UUID, // Assuming qbank IDs are UUIDs
        allowNull: true, // Allow null
        field: 'qbank_id' // Explicitly map to snake_case column
    },
    webinarId: {
        type: sequelize_1.DataTypes.UUID, // Assuming webinar IDs are UUIDs
        allowNull: true, // Allow null
        field: 'webinar_id' // Explicitly map to snake_case column
    },
    price: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2), // Precision for price
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'successful', 'failed', 'refunded'), // Added 'refunded'
        allowNull: false,
        defaultValue: 'pending', // Default status for new payments
    },
    transactionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'transaction_id' // Explicitly map to snake_case column
    },
    gatewayName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'gateway_name' // Explicitly map to snake_case column
    },
}, {
    tableName: 'orders', // Table name in your database
    timestamps: true, // Automatically adds createdAt and updatedAt columns
    underscored: true, // Automatically maps camelCase attributes to snake_case columns
});
exports.default = Order;
