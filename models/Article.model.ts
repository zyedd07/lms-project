import { DataTypes, Model } from 'sequelize';
import { sequelize } from '.'; // Assuming your sequelize instance is exported from here

class Article extends Model<any, any> {
    public id!: string;
    public imageUrl!: string;
    public title!: string; // This will be the "topic"
    public content!: string;
    public doctorName!: string;
    public batchYear!: string;

    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Article.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        imageUrl: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT, // Using TEXT for longer content
            allowNull: false,
        },
        doctorName: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        batchYear: {
            type: DataTypes.STRING(50), // e.g., "2020-2024"
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'articles',
        timestamps: true,
        modelName: 'Article',
    }
);

export default Article;
