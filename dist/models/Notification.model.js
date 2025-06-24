"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require("."); // Assuming sequelize instance is exported from the models index file
const User_model_1 = __importDefault(require("./User.model")); // Assuming a User model exists in the same directory
/**
 * Note: Using <any, any> for Model generics sacrifices some compile-time type safety.
 * This approach is simpler but less robust than using explicit interfaces for model attributes.
 */
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
        references: {
            model: User_model_1.default, // This creates a foreign key relationship to the 'users' table
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
Notification.belongsTo(User_model_1.default, { foreignKey: 'userId', as: 'user' });
User_model_1.default.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
exports.default = Notification;
