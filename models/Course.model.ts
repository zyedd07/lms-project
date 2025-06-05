// src/models/Course.model.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from "."; // Assuming this imports your configured Sequelize instance

// Define the structure of a single content item
// This helps TypeScript understand the shape of objects within the 'contents' JSONB array
export interface CourseContentItem {
    id: string; // We'll use UUID to uniquely identify each item in the array
    title: string;
    video_url: string;
    description?: string | null; // Allow description to be optional or null
    order: number;
    type: string; // e.g., 'video', 'quiz', 'text', 'assignment'
    created_at: string; // ISO date string (e.g., new Date().toISOString())
}

// Define the attributes for the Course model for TypeScript
// This mirrors the structure of your database table columns
export interface CourseAttributes {
    id: string;
    name: string;
    description?: string | null;
    price?: number | null;
    demoVideoUrl?: string | null;
    imageUrl?: string | null;
    categoryId: string;
    courseType: 'live' | 'recorded'; // Using literal types for ENUM
    active: boolean;
    syllabus?: any[] | null; // Your existing syllabus, allowing for null or empty array
    // --- ADDED: The new contents field ---
    contents: CourseContentItem[]; // An array of CourseContentItem objects
    // --- END ADDED ---
    createdAt?: Date; // Sequelize auto-generates these
    updatedAt?: Date; // Sequelize auto-generates these
}

// Define the structure for creating a Course instance
// This indicates which attributes are optional during creation
interface CourseCreationAttributes extends Omit<CourseAttributes, 'id' | 'createdAt' | 'updatedAt'> {
    // For `contents`, ensure it's optional for creation, as it might start empty
    contents?: CourseContentItem[];
    // For `syllabus`, if it's optional on creation
    syllabus?: any[];
    // `active` is also defaulted, so it can be optional in creation
    active?: boolean;
}

// Define the Course model class extending Sequelize's Model
// This provides type safety when interacting with Course instances
class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
    public id!: string;
    public name!: string;
    public description!: string | null;
    public price!: number | null;
    public demoVideoUrl!: string | null;
    public imageUrl!: string | null;
    public categoryId!: string;
    public courseType!: 'live' | 'recorded';
    public active!: boolean;
    public syllabus!: any[] | null;
    public contents!: CourseContentItem[]; // Ensure this is correctly typed

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // You can define associations here if you use them, e.g.:
    // public static associate(models: any) {
    //   Course.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    //   Course.belongsToMany(models.Teacher, { through: 'CourseTeacher', foreignKey: 'courseId', as: 'teachers' });
    // }
}

// Initialize the Course model with its attributes and options
Course.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    demoVideoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Categories', // Ensure this matches your Category model's table name or modelName
            key: 'id',
        },
    },
    courseType: {
        type: DataTypes.ENUM('live', 'recorded'),
        allowNull: false,
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    syllabus: {
        type: DataTypes.JSONB, // Consider changing this from JSON to JSONB for better performance
        allowNull: true,
        defaultValue: [],
    },
    // --- ADDED: The new contents field ---
    contents: {
        type: DataTypes.JSONB, // **Highly recommended to use JSONB over JSON for performance**
        allowNull: false,      // `contents` array should always exist, even if empty
        defaultValue: [],      // Default to an empty array
    }
}, {
    sequelize, // Pass the sequelize instance
    modelName: 'Course', // Define the model name
    tableName: 'courses', // Ensure this matches your actual table name in the database
    timestamps: true, // `createdAt` and `updatedAt` columns
    indexes: [
        {
            unique: true,
            fields: ["name", "categoryId"],
        },
    ],
});

export default Course;
