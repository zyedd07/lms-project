import { DataTypes } from "sequelize";
import { sequelize } from ".";

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
    scheduledStartTime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    scheduledEndTime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    timerEnabled: {
        type: DataTypes.BOOLEAN,
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

// NO associations here — all associations are handled centrally in initAssociation()

export default Test;