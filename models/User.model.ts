// models/User.js (or your equivalent file path)

import { DataTypes } from "sequelize";
import { sequelize } from ".";

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
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
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
    // --- NEW FIELDS TO ADD ---
    dateOfBirth: {
        type: DataTypes.STRING, // Storing as a string (e.g., "DD/MM/YYYY")
        allowNull: true, // Set to false if it's a mandatory field
    },
    address: {
        type: DataTypes.TEXT, // TEXT is better for potentially long addresses
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
    }
}, { timestamps: true });

export default User;