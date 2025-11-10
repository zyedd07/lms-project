// models/Payment.model.ts (Fixed with proper field mappings)
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
        field: 'userid',  // ✅ Map to lowercase column
        references: {
            model: 'users',
            key: 'id'
        }
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'orderid',  // ✅ Map to lowercase column
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    // Product IDs (duplicated from order for quick reference)
    courseId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'courseid',  // ✅ Map to lowercase column
    },
    qbankId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'qbankid',  // ✅ Map to lowercase column
    },
    testSeriesId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'testseriesid',  // ✅ Map to lowercase column
    },
    webinarId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'webinarid',  // ✅ Map to lowercase column
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    gatewayName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'gatewayname',  // ✅ Map to lowercase column
    },
    transactionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'transactionid',  // ✅ Map to lowercase column
    },
    gatewayTransactionId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'gatewaytransactionid',  // ✅ Map to lowercase column
        comment: 'Actual UPI transaction ID verified by admin'
    },
    status: {
        type: DataTypes.ENUM('pending', 'successful', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
    },
    // Admin verification fields
    verifiedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'verifiedby',  // ✅ Map to lowercase column
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'Admin user ID who verified the payment'
    },
    verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'verifiedat',  // ✅ Map to lowercase column
        comment: 'Timestamp when payment was verified'
    },
    adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'adminnotes',  // ✅ Map to lowercase column
        comment: 'Notes added by admin during verification'
    },
    // Optional: Store raw payment proof (screenshot URL, etc.)
    paymentProofUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'paymentproofurl',  // ✅ Map to lowercase column
        comment: 'URL to payment screenshot/proof uploaded by user'
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
    tableName: 'payments',      // ✅ Force lowercase table name
    freezeTableName: true,      // ✅ Prevent pluralization
    timestamps: true,
    indexes: [
        { fields: ['userid'] },
        { fields: ['orderid'] },
        { fields: ['status'] },
        { fields: ['transactionid'] },
        { fields: ['verifiedby'] },
    ]
});

export default Payment;