"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
const CourseTestSeries = _1.sequelize.define('CourseTestSeries', {
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
    testSeriesId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'TestSeries',
            key: 'id',
        },
    },
}, { timestamps: true });
exports.default = CourseTestSeries;
