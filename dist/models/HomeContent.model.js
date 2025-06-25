"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
class HomeContent extends sequelize_1.Model {
}
HomeContent.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    sliderImages: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
    },
    questionOfTheDay: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
    aboutUsText: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        defaultValue: 'Welcome! Edit this section from the admin panel.',
    },
    customSections: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    // --- NEW FIELD DEFINITIONS ---
    topRatedCourses: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [], // Default to an empty array
    },
    topRatedTests: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    topRatedQbanks: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
}, {
    sequelize: _1.sequelize,
    tableName: 'home_content',
    timestamps: true,
    modelName: 'HomeContent',
});
exports.default = HomeContent;
