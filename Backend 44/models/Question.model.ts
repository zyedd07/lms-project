import { DataTypes } from "sequelize";
import { sequelize } from ".";

const Question = sequelize.define('Question', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    testId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Tests', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },

    // NEW: question type
    questionType: {
        type: DataTypes.ENUM('mcq', 'match_the_pair', 'image_based'),
        allowNull: false,
        defaultValue: 'mcq',
    },

    questionText: {
        type: DataTypes.TEXT,
        allowNull: false,
    },

    // NEW: optional image URL for image-based questions
    questionImageUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    // MCQ options (used for mcq and image_based)
    options: {
        type: DataTypes.JSONB,
        allowNull: true, // null for match_the_pair
    },

    correctAnswerIndex: {
        type: DataTypes.INTEGER,
        allowNull: true, // null for match_the_pair
    },

    // NEW: Match the pair — array of { left, right } objects
    // e.g. [{ left: "Dog", right: "Mammal" }, { left: "Eagle", right: "Bird" }]
    pairs: {
        type: DataTypes.JSONB,
        allowNull: true, // only used for match_the_pair
    },

    points: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
    },
    negativePoints: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        validate: { max: 0 },
    },
    answerDescription: {
    type: DataTypes.TEXT,
    allowNull: true, // optional — not all questions need an explanation
},
}, {
    timestamps: true,
    tableName: 'Questions',
});

export default Question;