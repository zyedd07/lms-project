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
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    // Product IDs - only one should be filled per order
    courseId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Courses',
            key: 'id'
        }
    },
    qbankId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Qbanks',
            key: 'id'
        }
    },
    testSeriesId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'TestSeries',
            key: 'id'
        }
    },
    webinarId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Webinars',
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
    },
    customerEmail: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    customerPhone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Product metadata for easy reference
    productType: {
        type: DataTypes.STRING, // 'course', 'qbank', 'testSeries', 'webinar'
        allowNull: true,
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, { 
    tableName: 'orders',      // ✅ Force lowercase table name
    freezeTableName: true,     // ✅ Prevent Sequelize from modifying the name
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['status'] },
        { fields: ['courseId'] },
        { fields: ['qbankId'] },
        { fields: ['testSeriesId'] },
        { fields: ['webinarId'] },
    ]
});

export default Order;