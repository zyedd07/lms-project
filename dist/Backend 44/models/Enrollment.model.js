"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
const Enrollment = _1.sequelize.define('Enrollment', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    courseId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'completed', 'dropped'),
        allowNull: false,
    },
}, { timestamps: true });
exports.default = Enrollment;
