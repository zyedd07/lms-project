"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
const Test = _1.sequelize.define('Test', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    testSeriesId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: 'TestSeries', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    durationMinutes: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 }
    },
    numberOfQuestions: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 }
    },
    passMarkPercentage: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        validate: { min: 0, max: 100 }
    },
    createdBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    scheduledStartTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    scheduledEndTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    timerEnabled: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ["name", "testSeriesId"],
        },
    ],
    tableName: 'Tests',
    validate: {
        scheduleConsistency() {
            if (this.scheduledStartTime &&
                this.scheduledEndTime &&
                new Date(this.scheduledEndTime) <= new Date(this.scheduledStartTime)) {
                throw new Error("scheduledEndTime must be after scheduledStartTime");
            }
        }
    }
});
// NO associations here — all associations are handled centrally in initAssociation()
exports.default = Test;
