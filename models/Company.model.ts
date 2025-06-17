// src/models/Company.model.ts
import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "."; // Assuming './index' contains your sequelize instance

// Define the Company model class
class Company extends Model<InferAttributes<Company>, InferCreationAttributes<Company>> {
    public id!: CreationOptional<string>;
    public name!: string;
    public website!: string | null;
    public logoUrl!: string | null;
    public address!: string | null;

    // timestamps!
    public readonly createdAt!: CreationOptional<Date>;
    public readonly updatedAt!: CreationOptional<Date>;
}

Company.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    logoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // FIX: Add createdAt and updatedAt explicitly here
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: 'companies',
    sequelize,
    timestamps: true,
});

export default Company;