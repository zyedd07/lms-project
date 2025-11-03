"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
const User_model_1 = __importDefault(require("./User.model"));
const TestSeries_model_1 = __importDefault(require("./TestSeries.model")); // Assuming you have a TestSeries model
const UserTestSeries = _1.sequelize.define('UserTestSeries', {
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
    testSeriesId: {
        // Assuming your TestSeries model also uses a UUID primary key
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: TestSeries_model_1.default,
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
    tableName: 'user_test_series'
});
exports.default = UserTestSeries;
