"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
const DrugCategory_model_1 = __importDefault(require("./DrugCategory.model"));
/**
 * Represents a single drug entry in the Drug Index.
 */
class Drug extends sequelize_1.Model {
}
Drug.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    categoryId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: DrugCategory_model_1.default,
            key: 'id',
        },
    },
    details: {
        type: sequelize_1.DataTypes.JSONB, // Using JSONB for flexible, structured data
        allowNull: false,
        defaultValue: {},
    },
}, {
    sequelize: _1.sequelize,
    tableName: 'drugs',
    timestamps: true,
    modelName: 'Drug',
    indexes: [
        {
            fields: ['name'], // Adding an index on the name for faster searching
        },
    ],
});
exports.default = Drug;
