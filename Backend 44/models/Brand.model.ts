// src/models/Brand.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from ".";

class Brand extends Model<
    { // Attributes of the Brand instance
        id: string;
        name: string;
        contents: any[] | null;
        brandCategoryId: string;
        companyId: string;
        availability: string;
        recommended_by_vets: boolean;
        details: object;
        createdAt: Date;
        updatedAt: Date;
    },
    { // Attributes that are optional when creating a new instance
        id?: string;
        name: string;
        contents?: any[] | null;
        brandCategoryId: string;
        companyId: string;
        availability: string;
        recommended_by_vets?: boolean;
        details?: object;
        createdAt?: Date;
        updatedAt?: Date;
    }
> {
    public id!: string;
    public name!: string;
    public contents!: any[] | null;
    public brandCategoryId!: string;
    public companyId!: string;
    public availability!: string;
    public recommended_by_vets!: boolean;
    public details!: object;
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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
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
        details: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
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
        // --- REMOVE THE ENTIRE 'indexes' BLOCK HERE ---
        // indexes: [
        //     {
        //         unique: true,
        //         fields: ['name', 'brandCategoryId', 'companyId'],
        //         name: 'brands_name_brand_category_id_company_id_unique_index',
        //     },
        // ],
        // ---------------------------------------------
    }
);

export default Brand;