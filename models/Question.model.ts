// models/Question.model.ts (Example - ensure it matches your current file)

import { DataTypes } from "sequelize";
import { sequelize } from ".";
import Test from "./Test.model";

const Question = sequelize.define('Question', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    testId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Tests',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    questionText: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    options: {
        type: DataTypes.JSONB,
        allowNull: false,
        validate: {
            isArrayOfStrings(value: string[]) {
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
            isValidIndex(value: number) {
                const optionsArray = (this as any).options as string[];
                if (optionsArray && (value < 0 || value >= optionsArray.length)) {
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
    // --- ADD THIS NEW FIELD ---
    negativePoints: {
        type: DataTypes.INTEGER,
        allowNull: false, // Or true if it can be null, but generally 0 is a good default
        defaultValue: 0,
        validate: {
            min: 0 // Negative points should be 0 or a positive value to deduct
        }
    }
    // --- END NEW FIELD ---
}, {
    timestamps: true,
    tableName: 'Questions'
});

Question.belongsTo(Test, { foreignKey: 'testId' });
Test.hasMany(Question, { foreignKey: 'testId', onDelete: 'CASCADE', as: 'questions' });

export default Question;
