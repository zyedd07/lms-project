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
            model: 'users',  // ✅ Also lowercase
            key: 'id'
        }
    },
    courseId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'courses',  // ✅ Lowercase
            key: 'id'
        }
    },
    qbankId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'qbanks',  // ✅ Lowercase
            key: 'id'
        }
    },
    testSeriesId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'test_series',  // ✅ Snake case
            key: 'id'
        }
    },
    webinarId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'webinars',  // ✅ Lowercase
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
    productType: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, { 
    tableName: 'orders',
    freezeTableName: true,
    underscored: true,        // ✅ Convert camelCase to snake_case
    timestamps: true,
    indexes: [
        { fields: ['user_id'] },      // ✅ Use snake_case in indexes
        { fields: ['status'] },
        { fields: ['course_id'] },
        { fields: ['qbank_id'] },
        { fields: ['test_series_id'] },
        { fields: ['webinar_id'] },
    ]
});

export default Order;