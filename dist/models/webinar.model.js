"use strict";
// src/models/webinar.model.ts
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize"); // Removed InferAttributes, InferCreationAttributes
const _1 = require("."); // Crucial: Ensure this path is correct and 'sequelize' instance is validly exported.
// IMPORTANT: Using <any, any> for Model generics sacrifices type safety
// and reduces the benefits of using TypeScript with Sequelize.
// TypeScript will not validate the structure of your model's attributes.
class Webinar extends sequelize_1.Model {
}
// --- Initialize the Model ---
Webinar.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    speaker: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    date: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    time: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    imageUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('upcoming', 'live', 'recorded'),
        defaultValue: 'upcoming',
        allowNull: false,
    },
    jitsiRoomName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    price: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: false,
    },
}, {
    sequelize: _1.sequelize,
    tableName: 'webinars',
    timestamps: true,
    modelName: 'Webinar'
});
exports.default = Webinar;
