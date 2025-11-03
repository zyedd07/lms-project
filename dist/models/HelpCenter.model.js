"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require("."); // Adjust the import path to your sequelize instance
const HelpCenterSection = _1.sequelize.define('HelpCenterSection', {
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: new sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    order: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Lower numbers appear first',
    },
}, {
    tableName: 'HelpCenterSections',
    timestamps: true // This will add createdAt and updatedAt fields
});
exports.default = HelpCenterSection;
