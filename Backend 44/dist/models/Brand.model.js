"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/Brand.model.ts
const sequelize_1 = require("sequelize");
const _1 = require(".");
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
    },
    contents: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
    },
    brandCategoryId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    companyId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    availability: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    recommended_by_vets: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    details: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
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
    modelName: 'Brand',
    // --- REMOVE THE ENTIRE 'indexes' BLOCK HERE ---
    // indexes: [
    //     {
    //         unique: true,
    //         fields: ['name', 'brandCategoryId', 'companyId'],
    //         name: 'brands_name_brand_category_id_company_id_unique_index',
    //     },
    // ],
    // ---------------------------------------------
});
exports.default = Brand;
