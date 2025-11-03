"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require("."); // Assuming your sequelize instance is exported from here
/**
 * Represents a category for drugs in the database, e.g., "Antibiotics", "Analgesics".
 */
class DrugCategory extends sequelize_1.Model {
}
DrugCategory.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true, // Category names should be unique
    },
}, {
    sequelize: _1.sequelize,
    tableName: 'drug_categories', // Using snake_case for table names is a common convention
    timestamps: true,
    modelName: 'DrugCategory',
});
exports.default = DrugCategory;
