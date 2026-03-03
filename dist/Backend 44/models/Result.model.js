"use strict";
// models/Result.model.ts
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
const Result = _1.sequelize.define('Result', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    testId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Tests',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    score: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    totalPossiblePoints: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    correctCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    incorrectCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    skippedCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    totalQuestions: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    percentageScore: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    hasPassed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    timeTaken: {
        type: sequelize_1.DataTypes.INTEGER, // in seconds
        allowNull: true,
    },
    userAnswers: {
        type: sequelize_1.DataTypes.JSONB, // Store all user answers with question IDs
        allowNull: false,
    },
    completedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    }
}, {
    timestamps: true,
    tableName: 'Results'
});
// ✅ REMOVED ALL ASSOCIATIONS FROM HERE
// Associations are defined in models/associations/index.ts
exports.default = Result;
