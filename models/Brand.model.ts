// src/models/Brand.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "."; // Assuming your sequelize instance is exported from index.ts

class Brand extends Model<
    { // Attributes of the Brand instance
        id: string;
        name: string; // RE-ADDED: name field
        contents: any[] | null;
        brandCategoryId: string;
        companyId: string;
        availability: string;
        recommended_by_vets: boolean;
        createdAt: Date;
        updatedAt: Date;
    },
    { // Attributes that are optional when creating a new instance
        id?: string;
        name: string; // RE-ADDED: name field (required for creation)
        contents?: any[] | null;
        brandCategoryId: string;
        companyId: string;
        availability: string;
        recommended_by_vets?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
    }
> {
    public id!: string;
    public name!: string; // RE-ADDED: name property
    public contents!: any[] | null;
    public brandCategoryId!: string;
    public companyId!: string;
    public availability!: string;
    public recommended_by_vets!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Brand.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: { // RE-ADDED: name attribute definition
            type: DataTypes.STRING,
            allowNull: false,
            unique: false, // Part of a composite unique index
        },
        contents: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
        },
        brandCategoryId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        companyId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        availability: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        recommended_by_vets: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: 'brands',
        sequelize,
        timestamps: true,
        modelName: 'Brand',
        indexes: [
            {
                unique: true,
                // REVERTED: Unique index to include 'name'
                fields: ['name', 'brandCategoryId', 'companyId'],
                name: 'brands_name_brand_category_id_company_id_unique_index',
            },
        ],
    }
);

export default Brand;