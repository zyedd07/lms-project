"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/Brand.model.ts
const sequelize_1 = require("sequelize");
const _1 = require(".");
// Define the Brand model class
class Brand extends sequelize_1.Model {
}
Brand.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: false,
    },
    contents: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
    },
    brandCategoryId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'brand_categories', // Ensure this matches your BrandCategory table name
            key: 'id',
        },
    },
    companyId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'companies', // Ensure this matches your Company table name
            key: 'id',
        },
    },
    availability: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    recommended_by_vets: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
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
    tableName: 'brands',
    sequelize: _1.sequelize,
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ["name", "brandCategoryId", "companyId"],
        },
    ],
});
exports.default = Brand;
