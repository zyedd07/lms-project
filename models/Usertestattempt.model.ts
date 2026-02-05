import { DataTypes } from "sequelize";
import { sequelize } from ".";
import User from "./User.model";
import Test from "./Test.model";

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
    // Total attempts allowed for this user for this specific test
    allowedAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1, // By default, users get 1 attempt
        validate: {
            min: 0,
        }
    },
    // Number of attempts already used
    attemptsUsed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        }
    },
    // Whether the user has started the test at least once
    hasStarted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    // Whether the user has completed the test
    hasCompleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    // Last attempt date
    lastAttemptAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    // Admin who granted extra attempts (if applicable)
    grantedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id',
        },
    },
    // Reason for granting extra attempts
    grantReason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ["userId", "testId"], // Each user can have only one record per test
        },
    ],
    tableName: 'UserTestAttempts'
});

// Define associations
UserTestAttempt.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserTestAttempt.belongsTo(Test, { foreignKey: 'testId', as: 'test' });
UserTestAttempt.belongsTo(User, { foreignKey: 'grantedBy', as: 'admin' });

User.hasMany(UserTestAttempt, { foreignKey: 'userId' });
Test.hasMany(UserTestAttempt, { foreignKey: 'testId' });

export default UserTestAttempt;