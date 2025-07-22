import { DataTypes } from "sequelize";
import { sequelize } from ".";
import User from './User.model';

const Course = sequelize.define('Course', {
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
        references: {
            model: 'Categories',
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
        type: DataTypes.JSON, 
        allowNull: true, 
        defaultValue: [], 
    },
    // --- ADD THIS NEW FIELD ---
    contents: {
        type: DataTypes.JSON, 
        allowNull: true, 
        defaultValue: [], // Default to an empty array
    },
    uploaderId: { // Define the new column for the uploader
        type: DataTypes.UUID,
        allowNull: true, // Assuming an uploader is always required
        references: {
            model: 'Users', // This should match your actual Users table name
            key: 'id',
        },
        // onDelete: 'SET NULL', // Optional: What happens if the uploader user is deleted
        // onUpdate: 'CASCADE'  // Optional: What happens if the uploader user's ID changes
    }

}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ["name", "categoryId"],
        },
    ],
});

export default Course;
