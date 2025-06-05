
// Recommended approach: Create a new model
// src/models/QuestionBank.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "./index"; // Assuming 'index.js' exports your sequelize instance

const QuestionBank = sequelize.define('QuestionBank', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    uploadedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        // references: { model: 'Users', key: 'id' },
    },
    uploadDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
}, {
    timestamps: true,
    tableName: 'QuestionBanks', // Clear and correct table name
});

export default QuestionBank;
