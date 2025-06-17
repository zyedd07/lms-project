"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/Company.model.ts
const sequelize_1 = require("sequelize");
const _1 = require("."); // Assuming './index' contains your sequelize instance
// Define the Company model class
class Company extends sequelize_1.Model {
}
Company.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    website: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    logoUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    // FIX: Add createdAt and updatedAt explicitly here
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: 'companies',
    sequelize: _1.sequelize,
    timestamps: true,
});
exports.default = Company;
