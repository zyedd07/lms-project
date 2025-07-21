

import { DataTypes } from "sequelize";
import { sequelize } from "."; // Assuming './index' exports your Sequelize instance

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true, // Add email validation
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        // Consider adding a custom validator for phone number format if needed
    },
    // The 'designation' from the form maps to this 'role' field
   role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'student'
    },
    profilePicture: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // --- NEW FIELD FOR APPROVAL STATUS ---
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'), // Define possible statuses
        allowNull: false,
        defaultValue: 'pending', // New users start as pending, especially teachers
        // For students, you might set this to 'approved' directly in your registration logic
        // For admins, it would also be 'approved' by default or during initial setup
    },
    // --- ADDITIONAL USER DETAILS ---
    dateOfBirth: {
        type: DataTypes.DATEONLY, // Use DATEONLY if you only need the date part
        allowNull: true,
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    rollNo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    collegeName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    university: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // --- PASSWORD RESET FIELDS ---
    passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    // --- PERMISSIONS FIELD ---
    permissions: {
        type: DataTypes.JSONB, // JSONB is generally preferred over JSON for performance with querying
        allowNull: true,
        defaultValue: {
            courses: true,
            tests: true,
            qbank: true,
            webinars: true,
            drugIndex: true,
            article: true,
            brand: true,
            mediaLibrary: true
        }
    }
}, {
    timestamps: true, // This will automatically add `createdAt` and `updatedAt` fields
    // You can add other model options here, like `tableName` if your table name differs
    // tableName: 'users_table', // Example if your table is not 'users'
});

export default User;