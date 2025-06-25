import { DataTypes, Model } from 'sequelize';
import { sequelize } from '.'; 

/**
 * This model stores dynamic content for the main home screen of the app.
 * It's designed to have only one row, acting as a central configuration point.
 */
class HomeContent extends Model<any, any> {
    public id!: string;
    
    /**
     * An array of image URLs for the main slider.
     * e.g., ["https://example.com/slide1.jpg", "https://example.com/slide2.jpg"]
     */
    public sliderImages!: string[];

    /**
     * A JSON object representing the Question of the Day.
     * This flexible format allows for storing question text, options, correct answers, etc.
     */
    public questionOfTheDay!: object;

    /**
     * The text content for the dedicated "About Us" section.
     */
    public aboutUsText!: string;

    /**
     * An array of custom content sections for the home page.
     * Allows admins to add sections like "Our Mission", "Vision", etc.
     * Example: [{ "title": "Our Mission", "content": "Our mission is..." }]
     */
    public customSections!: object[];

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
            type: DataTypes.ARRAY(DataTypes.STRING), // Array of strings for image URLs
            allowNull: false,
            defaultValue: [],
        },
        questionOfTheDay: {
            type: DataTypes.JSONB, // Flexible JSON for the question structure
            allowNull: false,
            defaultValue: {},
        },
        aboutUsText: {
            type: DataTypes.TEXT, // Dedicated TEXT field for the "About Us" content
            allowNull: false,
            defaultValue: 'Welcome! Edit this section from the admin panel.',
        },
        customSections: {
            type: DataTypes.JSONB, // Allows for an array of other custom sections
            allowNull: false,
            defaultValue: [], // Default to an empty array
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
