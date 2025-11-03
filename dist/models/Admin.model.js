"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
const constants_1 = require("../utils/constants");
const Admin = _1.sequelize.define('Admin', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM(constants_1.Role.ADMIN, constants_1.Role.TEACHER, constants_1.Role.STUDENT),
        allowNull: false,
        defaultValue: constants_1.Role.ADMIN, // Set a default role, perhaps 'admin' for new Admin records
    },
}, { timestamps: true });
exports.default = Admin;
