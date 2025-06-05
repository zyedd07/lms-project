// src/models/Course.model.ts

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.config'; // Assuming you have your Sequelize instance configured here

// --- Import the new types for JSONB fields ---
import { SyllabusSection, CourseContentItem } from '../utils/types';
// --- END NEW IMPORTS ---

// Define the attributes for the Course model
// These are the properties that a Course instance will have
interface CourseAttributes {
    id: string;
    name: string;
    description: string | null; // Can be null in DB if allowNull: true
    imageUrl: string | null;
    categoryId: string;
    price: number | null; // Can be null in DB if allowNull: true, or will default
    demoVideoUrl: string | null;
    courseType: string; // 'live' | 'recorded'
    active: boolean;
    syllabus: SyllabusSection[]; // JSONB array, ensure this matches your type
    contents: CourseContentItem[]; // JSONB array, ensure this matches your type
    createdAt?: Date; // Sequelize automatically adds this if timestamps: true
    updatedAt?: Date; // Sequelize automatically adds this if timestamps: true
}

// Define the attributes that are required for creating a new Course instance
// 'id', 'createdAt', and 'updatedAt' are always optional for creation (handled by Optional<...>)
// We also need to list any other attributes that have 'allowNull: true' or 'defaultValue'
// as they are also optional during the creation process.
interface CourseCreationAttributes extends Optional<CourseAttributes,
    'id' | 'createdAt' | 'updatedAt' |
    'description' | 'imageUrl' | 'price' | 'demoVideoUrl' | // From allowNull: true
    'active' | 'syllabus' | 'contents' // From defaultValue
> {}

// Extend Model and implement the CourseAttributes interface
class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
    public id!: string;
    public name!: string;
    public description!: string | null;
    public imageUrl!: string | null;
    public categoryId!: string;
    public price!: number | null;
    public demoVideoUrl!: string | null;
    public courseType!: 'live' | 'recorded'; // Specific literal type
    public active!: boolean;
    public syllabus!: SyllabusSection[]; // Type for the JSONB array
    public contents!: CourseContentItem[]; // Type for the JSONB array

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

// Initialize the Course model
Course.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true, // Assuming course names are unique per category or globally
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        imageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        categoryId: {
            type: DataTypes.UUID,
            allowNull: false,
            // You might want to add a foreign key constraint here if not already in associations
            // references: {
            //     model: 'categories', // 'categories' table name
            //     key: 'id',
            // },
            // onDelete: 'CASCADE',
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true, // Price can be optional/free
            defaultValue: 0.00,
        },
        demoVideoUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        courseType: {
            type: DataTypes.ENUM('live', 'recorded'), // Define allowed course types
            allowNull: false,
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true, // Courses are active by default
        },
        syllabus: {
            type: DataTypes.JSONB, // For PostgreSQL, use JSONB for better performance with queries
            allowNull: false, // False means it must be present, but defaultValue handles missing on creation
            defaultValue: [], // Default to an empty array if not provided
        },
        contents: {
            type: DataTypes.JSONB, // For PostgreSQL, use JSONB
            allowNull: false,
            defaultValue: [], // Default to an empty array
        }
    },
    {
        tableName: 'courses',
        sequelize, // Pass the Sequelize instance
        timestamps: true, // Enable createdAt and updatedAt fields
    }
);

export default Course;
