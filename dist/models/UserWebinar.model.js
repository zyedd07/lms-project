"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require("."); // Assuming your sequelize instance is exported from here
const User_model_1 = __importDefault(require("./User.model")); // Assuming you have a User model
const webinar_model_1 = __importDefault(require("./webinar.model")); // Assuming you have a Webinar model
const types_1 = require("../utils/types"); // Import the enum for type safety
/**
 * Defines the UserWebinar model, representing the many-to-many relationship
 * between users and webinars, including the enrollment status.
 */
const UserWebinar = _1.sequelize.define('UserWebinar', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID, // Assuming User IDs are UUIDs
        allowNull: false,
        references: {
            model: User_model_1.default, // References the User model
            key: 'id'
        }
    },
    webinarId: {
        type: sequelize_1.DataTypes.UUID, // Assuming Webinar IDs are UUIDs
        allowNull: false,
        references: {
            model: webinar_model_1.default, // References the Webinar model
            key: 'id'
        }
    },
    status: {
        // Use the imported enum values for the ENUM type in Sequelize
        type: sequelize_1.DataTypes.ENUM(types_1.WebinarEnrollmentStatus.ACTIVE, types_1.WebinarEnrollmentStatus.COMPLETED, types_1.WebinarEnrollmentStatus.DROPPED, types_1.WebinarEnrollmentStatus.REGISTERED, types_1.WebinarEnrollmentStatus.ATTENDED, types_1.WebinarEnrollmentStatus.CANCELLED),
        allowNull: false,
        defaultValue: types_1.WebinarEnrollmentStatus.REGISTERED // Set a sensible default status
    }
}, {
    timestamps: true, // This will automatically add `createdAt` and `updatedAt` fields
    tableName: 'user_webinars' // Define the table name in the database
});
exports.default = UserWebinar;
