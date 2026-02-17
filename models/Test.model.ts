import { DataTypes } from "sequelize";
import { sequelize } from ".";
import TestSeries from "./TestSeries.model";

const Test = sequelize.define('Test', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    testSeriesId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'TestSeries', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 }
    },
    numberOfQuestions: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 }
    },
    passMarkPercentage: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: { min: 0, max: 100 }
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
    },

    // --- NEW SCHEDULING FIELDS ---

    // The exact datetime the test window opens (e.g., 2025-06-01T12:00:00Z)
    scheduledStartTime: {
        type: DataTypes.DATE,
        allowNull: true, // null = no scheduling, always accessible
    },
    // The exact datetime the test window closes (e.g., 2025-06-01T13:00:00Z)
    scheduledEndTime: {
        type: DataTypes.DATE,
        allowNull: true, // null = no end boundary
    },
    // Whether the countdown timer is shown to the student during the test
    timerEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true, // timer ON by default
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
        // Ensure endTime is after startTime if both are set
        scheduleConsistency() {
            if (
                (this as any).scheduledStartTime &&
                (this as any).scheduledEndTime &&
                new Date((this as any).scheduledEndTime) <= new Date((this as any).scheduledStartTime)
            ) {
                throw new Error("scheduledEndTime must be after scheduledStartTime");
            }
        }
    }
});

Test.belongsTo(TestSeries, { foreignKey: 'testSeriesId' });
TestSeries.hasMany(Test, { foreignKey: 'testSeriesId', as: 'tests', onDelete: 'CASCADE' });

export default Test;