"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
/**
 * This model stores dynamic content for the main home screen of the app.
 * It's designed to have only one row, acting as a central configuration point.
 */
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
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING), // Array of strings for image URLs
        allowNull: false,
        defaultValue: [],
    },
    questionOfTheDay: {
        type: sequelize_1.DataTypes.JSONB, // Flexible JSON for the question structure
        allowNull: false,
        defaultValue: {},
    },
    aboutUsText: {
        type: sequelize_1.DataTypes.TEXT, // Dedicated TEXT field for the "About Us" content
        allowNull: false,
        defaultValue: 'Welcome! Edit this section from the admin panel.',
    },
    customSections: {
        type: sequelize_1.DataTypes.JSONB, // Allows for an array of other custom sections
        allowNull: false,
        defaultValue: [], // Default to an empty array
    },
}, {
    sequelize: _1.sequelize,
    tableName: 'home_content',
    timestamps: true,
    modelName: 'HomeContent',
});
exports.default = HomeContent;
