"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
const Question = _1.sequelize.define('Question', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    testId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: 'Tests', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    // NEW: question type
    questionType: {
        type: sequelize_1.DataTypes.ENUM('mcq', 'match_the_pair', 'image_based'),
        allowNull: false,
        defaultValue: 'mcq',
    },
    questionText: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    // NEW: optional image URL for image-based questions
    questionImageUrl: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    // MCQ options (used for mcq and image_based)
    options: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true, // null for match_the_pair
    },
    correctAnswerIndex: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true, // null for match_the_pair
    },
    // NEW: Match the pair — array of { left, right } objects
    // e.g. [{ left: "Dog", right: "Mammal" }, { left: "Eagle", right: "Bird" }]
    pairs: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true, // only used for match_the_pair
    },
    points: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
    },
    negativePoints: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        validate: { max: 0 },
    },
}, {
    timestamps: true,
    tableName: 'Questions',
});
exports.default = Question;
