// models/Result.model.ts

import { DataTypes } from "sequelize";
import { sequelize } from ".";

const Result = sequelize.define('Result', {
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
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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
    score: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    totalPossiblePoints: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    correctCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    incorrectCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    skippedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    totalQuestions: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    percentageScore: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    hasPassed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    timeTaken: {
        type: DataTypes.INTEGER, // in seconds
        allowNull: true,
    },
    userAnswers: {
        type: DataTypes.JSONB, // Store all user answers with question IDs
        allowNull: false,
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
}, {
    timestamps: true,
    tableName: 'Results'
});

// ✅ REMOVED ALL ASSOCIATIONS FROM HERE
// Associations are defined in models/associations/index.ts

export default Result;