"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/BrandCategory.model.ts
const sequelize_1 = require("sequelize");
const _1 = require("."); // Assuming './index' contains your sequelize instance
// Define the BrandCategory model class
class BrandCategory extends sequelize_1.Model {
}
BrandCategory.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
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
    tableName: 'brand_categories',
    sequelize: _1.sequelize,
    timestamps: true,
});
exports.default = BrandCategory;
