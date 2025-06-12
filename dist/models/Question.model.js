"use strict";
// models/Question.model.ts (Example - ensure it matches your current file)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
const Test_model_1 = __importDefault(require("./Test.model"));
const Question = _1.sequelize.define('Question', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
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
    questionText: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    options: {
        type: sequelize_1.DataTypes.JSONB,
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
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0,
            isValidIndex(value) {
                const optionsArray = this.options;
                if (optionsArray && (value < 0 || value >= optionsArray.length)) {
                    throw new Error('Correct answer index must be within the bounds of the options array.');
                }
            }
        }
    },
    points: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1,
        }
    },
    // --- ADD THIS NEW FIELD ---
    negativePoints: {
        type: sequelize_1.DataTypes.INTEGER,
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
Question.belongsTo(Test_model_1.default, { foreignKey: 'testId' });
Test_model_1.default.hasMany(Question, { foreignKey: 'testId', onDelete: 'CASCADE', as: 'questions' });
exports.default = Question;
