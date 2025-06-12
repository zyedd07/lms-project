"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
const TestSeries_model_1 = __importDefault(require("./TestSeries.model")); // Import TestSeries model for association
const Test = _1.sequelize.define('Test', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    // Foreign key to TestSeries
    testSeriesId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'TestSeries', // References the 'TestSeries' table
            key: 'id',
        },
        onDelete: 'CASCADE', // If a TestSeries is deleted, all its associated Tests are also deleted
        onUpdate: 'CASCADE'
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    durationMinutes: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
        }
    },
    numberOfQuestions: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
        }
    },
    passMarkPercentage: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0,
            max: 100,
        }
    },
    createdBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ["name", "testSeriesId"], // A TestSeries cannot have two tests with the same name
        },
    ],
    tableName: 'Tests' // Explicit table name
});
// Define associations
Test.belongsTo(TestSeries_model_1.default, { foreignKey: 'testSeriesId' });
TestSeries_model_1.default.hasMany(Test, { foreignKey: 'testSeriesId', onDelete: 'CASCADE' });
exports.default = Test;
