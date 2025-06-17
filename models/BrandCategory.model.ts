// src/models/BrandCategory.model.ts
import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "."; // Assuming './index' contains your sequelize instance

// Define the BrandCategory model class
class BrandCategory extends Model<InferAttributes<BrandCategory>, InferCreationAttributes<BrandCategory>> {
    public id!: CreationOptional<string>;
    public name!: string;

    // timestamps!
    public readonly createdAt!: CreationOptional<Date>;
    public readonly updatedAt!: CreationOptional<Date>;
}

BrandCategory.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
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
    tableName: 'brand_categories',
    sequelize,
    timestamps: true,
});

export default BrandCategory;
