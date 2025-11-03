"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require("."); // Assuming your sequelize instance is exported from here
const User_model_1 = __importDefault(require("./User.model"));
const Course_model_1 = __importDefault(require("./Course.model")); // Assuming you have a Course model
const UserCourse = _1.sequelize.define('UserCourse', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: User_model_1.default,
            key: 'id'
        }
    },
    courseId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: Course_model_1.default,
            key: 'id'
        }
    },
    // --- NEW FIELD ADDED ---
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'completed', 'dropped'),
        allowNull: false,
        defaultValue: 'active' // It's good practice to set a default status
    }
}, {
    timestamps: true, // This will add createdAt and updatedAt fields
    tableName: 'user_courses'
});
exports.default = UserCourse;
