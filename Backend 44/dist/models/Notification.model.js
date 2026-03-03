"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
class Notification extends sequelize_1.Model {
}
// --- Initialize the Model ---
Notification.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        // The 'references' key is still important for defining the foreign key constraint at the database level.
        references: {
            model: 'Users', // Reference the table name directly as a string.
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('message', 'file', 'update', 'webinar', 'system'),
        allowNull: false,
    },
    text: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    isRead: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    link: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: _1.sequelize, // Pass the sequelize instance
    tableName: 'notifications',
    timestamps: true,
    modelName: 'Notification',
});
exports.default = Notification;
