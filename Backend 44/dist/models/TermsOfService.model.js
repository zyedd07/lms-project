"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require("."); // Adjust the import path to your sequelize instance
const TermsSection = _1.sequelize.define('TermsSection', {
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: new sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        comment: 'e.g., "1. Acceptance of Terms"',
    },
    content: {
        type: sequelize_1.DataTypes.TEXT('long'),
        allowNull: false,
        comment: 'The main paragraph text for the section.',
    },
    order: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Controls the display order; lower numbers appear first.',
    },
}, {
    tableName: 'TermsSections',
    timestamps: true, // This will add createdAt and updatedAt fields
});
exports.default = TermsSection;
