"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require("."); // Assuming your sequelize instance is exported from here
class Article extends sequelize_1.Model {
}
Article.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    imageUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    content: {
        type: sequelize_1.DataTypes.TEXT, // Using TEXT for longer content
        allowNull: false,
    },
    doctorName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    batchYear: {
        type: sequelize_1.DataTypes.STRING(50), // e.g., "2020-2024"
        allowNull: true,
    },
}, {
    sequelize: _1.sequelize,
    tableName: 'articles',
    timestamps: true,
    modelName: 'Article',
});
exports.default = Article;
