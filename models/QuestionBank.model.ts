import { DataTypes } from "sequelize";
import { sequelize } from "./index"; // Assuming your sequelize instance is exported from './index'
import User from './User.model';

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
        type: DataTypes.TEXT,
        allowNull: false,
    },
    fileName: { // Stores just the original file name for display
        type: DataTypes.TEXT,
        allowNull: false,
    },
    price: { // New price field
        type: DataTypes.DECIMAL(10, 2), // Example: up to 10 total digits, 2 after decimal (e.g., 99999999.99)
        allowNull: false, // Assuming price is always required
        defaultValue: 0.00, // Default to 0.00 if not provided
    },
    uploadedBy: { // Define this as a foreign key
        type: DataTypes.UUID,
        allowNull: true, // Assuming an uploader is always required
        references: {
            model: 'Users', // This should match your actual Users table name
            key: 'id',
        },
        // onDelete: 'SET NULL', // Optional: What happens if the uploader user is deleted
        // onUpdate: 'CASCADE'  // Optional: What happens if the uploader user's ID changes
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
