import { DataTypes, Model } from 'sequelize';
import { sequelize } from '.'; 
import DrugCategory from './DrugCategory.model';

/**
 * Represents a single drug entry in the Drug Index.
 */
class Drug extends Model<any, any> {
    public id!: string;
    public name!: string;
    public categoryId!: string; // Foreign key for DrugCategory
    
    /**
     * Stores various details about the drug, such as "Actions", "Indications", "Dose", etc.
     * Using JSONB allows for a flexible structure.
     * Example: { "Actions": "Blocks...", "Dose": "500mg twice daily" }
     */
    public details!: object;

    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Drug.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        categoryId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: DrugCategory,
                key: 'id',
            },
        },
        details: {
            type: DataTypes.JSONB, // Using JSONB for flexible, structured data
            allowNull: false,
            defaultValue: {},
        },
    },
    {
        sequelize,
        tableName: 'drugs',
        timestamps: true,
        modelName: 'Drug',
        indexes: [
            {
                fields: ['name'], // Adding an index on the name for faster searching
            },
        ],
    }
);



export default Drug;
