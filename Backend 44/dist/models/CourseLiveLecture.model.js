"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
const CourseLiveLecture = _1.sequelize.define('CourseLiveLecture', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    courseId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Courses',
            key: 'id',
        },
    },
    liveLectureId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'LiveLectures',
            key: 'id',
        },
    },
}, { timestamps: true });
exports.default = CourseLiveLecture;
