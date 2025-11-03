// Revised Payment.model.ts to handle multiple product types
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
    },
    // Make product IDs nullable, only one should be filled per payment
    courseId: {
        type: DataTypes.UUID,
        allowNull: true, // Allow null if it's not a course payment
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
    gatewayName: { // e.g., 'phonepe', 'stripe'
        type: DataTypes.STRING,
        allowNull: false,
    },
    transactionId: { // This would be the merchantTransactionId from PhonePe
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Ensures unique transaction IDs from gateway
    },
    gatewayTransactionId: { // The actual transaction ID from the payment gateway (e.g., PhonePe's transactionId)
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'successful', 'failed', 'refunded'), // Added 'refunded'
        allowNull: false,
        defaultValue: 'pending', // Default status for new payments
    },
    // Consider adding a 'metadata' JSONB field for raw webhook payloads for debugging
    // webhookPayload: {
    //     type: DataTypes.JSONB,
    //     allowNull: true,
    // },
}, { timestamps: true });


export default Payment;