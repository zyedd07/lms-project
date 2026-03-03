"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/Company.model.ts
const sequelize_1 = require("sequelize");
const _1 = require("."); // Assuming your sequelize instance is exported from index.ts
// Extend Sequelize's Model class
class Company extends sequelize_1.Model {
}
// Initialize the model
Company.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    // FIX: Explicitly add createdAt and updatedAt attribute definitions
    // even though timestamps: true will manage their values.
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false, // These columns are typically not nullable
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false, // These columns are typically not nullable
    },
}, {
    tableName: 'companies',
    sequelize: _1.sequelize, // Pass the sequelize instance
    timestamps: true, // This option ensures Sequelize manages createdAt/updatedAt values
    modelName: 'Company', // Must match the class name
});
exports.default = Company;
