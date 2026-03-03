import { DataTypes } from "sequelize";
import { sequelize } from ".";

const UserTestAttempt = sequelize.define('UserTestAttempt', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    testId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Tests',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    allowedAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 0,
        }
    },
    attemptsUsed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        }
    },
    hasStarted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    hasCompleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    lastAttemptAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    grantedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id',
        },
    },
    grantReason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ["userId", "testId"],
        },
    ],
    tableName: 'UserTestAttempts'
});

export default UserTestAttempt;