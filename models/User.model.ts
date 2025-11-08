// models/Order.model.ts
import { DataTypes } from "sequelize";
import { sequelize } from ".";

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'userid',  // ✅ Map to lowercase column
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // Product IDs - only one should be filled per order
    courseId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'courseid',  // ✅ Map to lowercase column
        references: {
            model: 'courses',
            key: 'id'
        }
    },
    qbankId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'qbankid',  // ✅ Map to lowercase column
        references: {
            model: 'qbanks',
            key: 'id'
        }
    },
    testSeriesId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'testseriesid',  // ✅ Map to lowercase column
        references: {
            model: 'testseries',
            key: 'id'
        }
    },
    webinarId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'webinarid',  // ✅ Map to lowercase column
        references: {
            model: 'webinars',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'successful', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
    },
    // Customer details captured from form
    customerName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'customername',  // ✅ Map to lowercase column
    },
    customerEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'customeremail',  // ✅ Map to lowercase column
    },
    customerPhone: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'customerphone',  // ✅ Map to lowercase column
    },
    // Product metadata for easy reference
    productType: {
        type: DataTypes.STRING, // 'course', 'qbank', 'testSeries', 'webinar'
        allowNull: true,
        field: 'producttype',  // ✅ Map to lowercase column
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'productname',  // ✅ Map to lowercase column
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'createdat',  // ✅ Map to lowercase column
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updatedat',  // ✅ Map to lowercase column
    },
}, { 
    tableName: 'orders',       // ✅ Force lowercase table name
    freezeTableName: true,     // ✅ Prevent pluralization
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

export default Order;