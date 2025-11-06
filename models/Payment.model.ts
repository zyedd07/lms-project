// models/Payment.model.ts (Updated with admin verification fields)
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
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Orders',
            key: 'id'
        }
    },
    // Product IDs (duplicated from order for quick reference)
    courseId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    qbankId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    testSeriesId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    webinarId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    gatewayName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    transactionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    gatewayTransactionId: {
        type: DataTypes.STRING,
        allowNull: true,
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
        references: {
            model: 'Users',
            key: 'id'
        },
        comment: 'Admin user ID who verified the payment'
    },
    verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when payment was verified'
    },
    adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notes added by admin during verification'
    },
    // Optional: Store raw payment proof (screenshot URL, etc.)
    paymentProofUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL to payment screenshot/proof uploaded by user'
    },
}, { 
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['orderId'] },
        { fields: ['status'] },
        { fields: ['transactionId'] },
        { fields: ['verifiedBy'] },
    ]
});

export default Payment;