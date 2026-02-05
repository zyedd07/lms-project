import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from ".";
import User from "./User.model";
import Test from "./Test.model";

// Define the attributes interface
interface UserTestAttemptAttributes {
    id: string;
    userId: string;
    testId: string;
    allowedAttempts: number;
    attemptsUsed: number;
    hasStarted: boolean;
    hasCompleted: boolean;
    lastAttemptAt: Date | null;
    grantedBy: string | null;
    grantReason: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define creation attributes (optional fields)
interface UserTestAttemptCreationAttributes 
    extends Optional<UserTestAttemptAttributes, 'id' | 'allowedAttempts' | 'attemptsUsed' | 'hasStarted' | 'hasCompleted' | 'lastAttemptAt' | 'grantedBy' | 'grantReason'> {}

// Define the model class
class UserTestAttemptModel extends Model<UserTestAttemptAttributes, UserTestAttemptCreationAttributes> 
    implements UserTestAttemptAttributes {
    public id!: string;
    public userId!: string;
    public testId!: string;
    public allowedAttempts!: number;
    public attemptsUsed!: number;
    public hasStarted!: boolean;
    public hasCompleted!: boolean;
    public lastAttemptAt!: Date | null;
    public grantedBy!: string | null;
    public grantReason!: string | null;
    
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

UserTestAttemptModel.init({
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
    sequelize,
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ["userId", "testId"],
        },
    ],
    tableName: 'UserTestAttempts',
    modelName: 'UserTestAttempt'
});

// Define associations
UserTestAttemptModel.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserTestAttemptModel.belongsTo(Test, { foreignKey: 'testId', as: 'test' });
UserTestAttemptModel.belongsTo(User, { foreignKey: 'grantedBy', as: 'admin' });

export default UserTestAttemptModel;