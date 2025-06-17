// src/models/Brand.model.ts
import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from ".";
import BrandCategory from './BrandCategory.model';
import Company from './Company.model';

// Define the Brand model class
class Brand extends Model<InferAttributes<Brand>, InferCreationAttributes<Brand>> {
    public id!: CreationOptional<string>;
    public name!: string;
    public contents!: any[] | null; // JSON type, typically an array of objects, can be nullable
    public brandCategoryId!: string;
    public companyId!: string;
    public availability!: string; // Now a string for quantities
    public recommended_by_vets!: boolean;

    // timestamps!
    public readonly createdAt!: CreationOptional<Date>;
    public readonly updatedAt!: CreationOptional<Date>;
}

Brand.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
    },
    contents: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
    },
    brandCategoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'brand_categories', // Ensure this matches your BrandCategory table name
            key: 'id',
        },
    },
    companyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'companies', // Ensure this matches your Company table name
            key: 'id',
        },
    },
    availability: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    recommended_by_vets: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
    tableName: 'brands',
    sequelize,
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ["name", "brandCategoryId", "companyId"],
        },
    ],
});

export default Brand;