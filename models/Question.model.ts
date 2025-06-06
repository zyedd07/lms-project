import { DataTypes } from "sequelize";
import { sequelize } from ".";
import TestSeries from "./TestSeries.model"; // Make sure TestSeries.model.js is imported

const Question = sequelize.define('Question', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // Direct link to TestSeries, as discussed
    testSeriesId: {
        type: DataTypes.UUID,
        allowNull: false, // A question must belong to a test series
        references: {
            model: 'TestSeries', // References the 'TestSeries' table
            key: 'id',
        },
        onDelete: 'CASCADE', // If a TestSeries is deleted, its questions are also deleted
        onUpdate: 'CASCADE'
    },
    // The actual question text
    questionText: { // Renamed from 'text' for clarity and consistency with frontend
        type: DataTypes.TEXT,
        allowNull: false,
    },
    // Options for the MCQ
    options: {
        type: DataTypes.JSON, // Stores an array of strings like ['Option A', 'Option B', 'Option C']
        allowNull: false,
        validate: {
            // Custom validator to ensure it's an array with at least 2 non-empty options
            isArrayOfStrings(value) {
                if (!Array.isArray(value) || value.length < 2 || value.some(opt => typeof opt !== 'string' || opt.trim() === '')) {
                    throw new Error('Options must be an array of at least two non-empty strings.');
                }
            }
        }
    },
    // Index of the correct answer in the 'options' array (0-based)
    correctAnswerIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0,
            // Custom validator to ensure the index is within the bounds of the options array
            isValidIndex(value) {
                if (this.options && (value < 0 || value >= this.options.length)) {
                    throw new Error('Correct answer index must be within the bounds of the options array.');
                }
            }
        }
    },
    // Points for this question
    points: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1, // Default points for a question
        validate: {
            min: 1, // Questions should be worth at least 1 point
        }
    },
}, {
    timestamps: true,
    tableName: 'Questions' // Explicit table name
});

// Define the associations
Question.belongsTo(TestSeries, { foreignKey: 'testSeriesId' });
TestSeries.hasMany(Question, { foreignKey: 'testSeriesId', onDelete: 'CASCADE' });

export default Question;
