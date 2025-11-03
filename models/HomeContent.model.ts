import { DataTypes, Model } from 'sequelize';
import { sequelize } from '.'; 

class HomeContent extends Model<any, any> {
    public id!: string;
    public sliderImages!: string[];
    public questionOfTheDay!: object;
    public aboutUsText!: string;
    public customSections!: object[];
    // --- NEW FIELDS ---
    public topRatedCourses!: object[];
    public topRatedTests!: object[];
    public topRatedQbanks!: object[];

    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

HomeContent.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        sliderImages: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
            defaultValue: [],
        },
        questionOfTheDay: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        aboutUsText: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'Welcome! Edit this section from the admin panel.',
        },
        customSections: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
        // --- NEW FIELD DEFINITIONS ---
        topRatedCourses: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [], // Default to an empty array
        },
        topRatedTests: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
        topRatedQbanks: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
    },
    {
        sequelize,
        tableName: 'home_content',
        timestamps: true,
        modelName: 'HomeContent',
    }
);

export default HomeContent;
