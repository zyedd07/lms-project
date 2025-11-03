"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
const User_model_1 = __importDefault(require("./User.model"));
// FIX: Changed the import to use the correct model name 'QuestionBank'
const QuestionBank_model_1 = __importDefault(require("./QuestionBank.model"));
const UserQbank = _1.sequelize.define('UserQbank', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: User_model_1.default,
            key: 'id'
        }
    },
    qbankId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            // FIX: The model reference now correctly points to QuestionBank
            model: QuestionBank_model_1.default,
            key: 'id'
        }
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'completed', 'dropped'),
        allowNull: false,
        defaultValue: 'active'
    }
}, {
    timestamps: true,
    tableName: 'user_qbanks'
});
exports.default = UserQbank;
