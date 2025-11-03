// src/models/Company.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "."; // Assuming your sequelize instance is exported from index.ts

// Extend Sequelize's Model class
class Company extends Model<
    { // Attributes of the Company instance (what it looks like when retrieved from DB)
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    },
    { // Attributes that are optional when creating a new instance
        id?: string;
        name: string;
        createdAt?: Date; // Optional for creation, as Sequelize sets it
        updatedAt?: Date; // Optional for creation, as Sequelize sets it
    }
> {
    // These are the actual properties that will exist on a Company instance.
    public id!: string;
    public name!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

// Initialize the model
Company.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        // FIX: Explicitly add createdAt and updatedAt attribute definitions
        // even though timestamps: true will manage their values.
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false, // These columns are typically not nullable
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false, // These columns are typically not nullable
        },
    },
    {
        tableName: 'companies',
        sequelize, // Pass the sequelize instance
        timestamps: true, // This option ensures Sequelize manages createdAt/updatedAt values
        modelName: 'Company', // Must match the class name
    }
);

export default Company;
