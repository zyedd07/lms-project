import { DataTypes } from "sequelize";
import { sequelize } from ".";
import Test from "./Test.model"; // Import the new Test model for association

const Question = sequelize.define('Question', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // Direct link to the 'Test' model
    testId: { // Renamed from testSeriesId to testId
        type: DataTypes.UUID,
        allowNull: false, // A question must belong to a Test
        references: {
            model: 'Tests', // References the 'Tests' table
            key: 'id',
        },
        onDelete: 'CASCADE', // If a Test is deleted, its questions are also deleted
        onUpdate: 'CASCADE'
    },
    questionText: { // Renamed from 'text' for consistency and clarity
        type: DataTypes.TEXT,
        allowNull: false,
    },
    options: {
        type: DataTypes.JSONB, // Using JSONB for better performance in PostgreSQL
        allowNull: false,
        validate: {
            isArrayOfStrings(value) {
                if (!Array.isArray(value) || value.length < 2 || value.some(opt => typeof opt !== 'string' || opt.trim() === '')) {
                    throw new Error('Options must be an array of at least two non-empty strings.');
                }
            }
        }
    },
    correctAnswerIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0,
            isValidIndex(value) {
                if (this.options && (value < 0 || value >= this.options.length)) {
                    throw new Error('Correct answer index must be within the bounds of the options array.');
                }
            }
        }
    },
    points: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1,
        }
    },
}, {
    timestamps: true,
    tableName: 'Questions'
});

// Define associations
Question.belongsTo(Test, { foreignKey: 'testId' }); // Question belongs to a Test
Test.hasMany(Question, { foreignKey: 'testId', onDelete: 'CASCADE' }); // A Test has many Questions

export default Question;
