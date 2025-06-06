import { DataTypes } from "sequelize";
import { sequelize } from "./index"; // Assuming your sequelize instance is exported from './index'

const QuestionBank = sequelize.define('QuestionBank', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Question bank names should probably be unique
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    filePath: { // Stores the path to the uploaded PDF file
        type: DataTypes.STRING,
        allowNull: false,
    },
    fileName: { // Stores just the original file name for display
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: { // New price field
        type: DataTypes.DECIMAL(10, 2), // Example: up to 10 total digits, 2 after decimal (e.g., 99999999.99)
        allowNull: false, // Assuming price is always required
        defaultValue: 0.00, // Default to 0.00 if not provided
    },
    uploadedBy: {
        type: DataTypes.UUID,
        allowNull: true, // Can be null if not linked to a uploader
        // If you have a User or Admin model, you would define the association here:
        // references: {
        //     model: 'Users', // Or 'Admins' if you have a separate admin table
        //     key: 'id',
        // },
        // onDelete: 'SET NULL',
        // onUpdate: 'CASCADE'
    },
    uploadDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Automatically set creation date
        allowNull: false,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt columns automatically
    tableName: 'QuestionBanks', // Explicitly define table name
});

export default QuestionBank;
