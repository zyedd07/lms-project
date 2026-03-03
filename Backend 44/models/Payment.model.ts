// Payment.model.ts
import { DataTypes } from "sequelize";
import { sequelize } from ".";

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'userid',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'orderid',
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    courseId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'courseid',
    },
    qbankId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'qbankid',
    },
    testSeriesId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'testseriesid',
    },
    webinarId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'webinarid',
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    gatewayName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'gatewayname',
    },
    transactionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'transactionid',
    },
    gatewayTransactionId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'gatewaytransactionid',
    },
    status: {
        type: DataTypes.ENUM('pending', 'successful', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
        // ✅ NO indexes defined here - they're in the model options below
    },
    verifiedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'verifiedby',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'verifiedat',
    },
    adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'adminnotes',
    },
    paymentProofUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'paymentproofurl',
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'createdat',
    },
    updatedAt: {
        type: DataTypes.DATE,
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
            name: 'payments_userid_idx',  // Give them unique names
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

export default Payment;