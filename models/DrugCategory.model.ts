import { DataTypes, Model } from 'sequelize';
import { sequelize } from '.'; // Assuming your sequelize instance is exported from here

/**
 * Represents a category for drugs in the database, e.g., "Antibiotics", "Analgesics".
 */
class DrugCategory extends Model<any, any> {
    public id!: string;
    public name!: string;

    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

DrugCategory.init(
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
            unique: true, // Category names should be unique
        },
    },
    {
        sequelize,
        tableName: 'drug_categories', // Using snake_case for table names is a common convention
        timestamps: true,
        modelName: 'DrugCategory',
    }
);

export default DrugCategory;
