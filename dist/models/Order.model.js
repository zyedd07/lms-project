"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/Order.model.ts
const sequelize_1 = require("sequelize");
const _1 = require(".");
const Order = _1.sequelize.define('Order', {
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
    // Product IDs - only one should be filled per order
    courseId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'courseid', // ✅ Map to lowercase column
        references: {
            model: 'courses',
            key: 'id'
        }
    },
    qbankId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'qbankid', // ✅ Map to lowercase column
        references: {
            model: 'qbanks',
            key: 'id'
        }
    },
    testSeriesId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'testseriesid', // ✅ Map to lowercase column
        references: {
            model: 'testseries',
            key: 'id'
        }
    },
    webinarId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'webinarid', // ✅ Map to lowercase column
        references: {
            model: 'webinars',
            key: 'id'
        }
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'successful', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
    },
    // Customer details captured from form
    customerName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'customername', // ✅ Map to lowercase column
    },
    customerEmail: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'customeremail', // ✅ Map to lowercase column
    },
    customerPhone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'customerphone', // ✅ Map to lowercase column
    },
    // Product metadata for easy reference
    productType: {
        type: sequelize_1.DataTypes.STRING, // 'course', 'qbank', 'testSeries', 'webinar'
        allowNull: true,
        field: 'producttype', // ✅ Map to lowercase column
    },
    productName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'productname', // ✅ Map to lowercase column
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
    tableName: 'orders', // ✅ Force lowercase table name
    freezeTableName: true, // ✅ Prevent pluralization
    timestamps: true,
    indexes: [
        { fields: ['userid'] },
        { fields: ['status'] },
        { fields: ['courseid'] },
        { fields: ['qbankid'] },
        { fields: ['testseriesid'] },
        { fields: ['webinarid'] },
    ]
});
exports.default = Order;
