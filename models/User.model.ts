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
    role: {
        type: DataTypes.STRING,    
        allowNull: false,        
        defaultValue: 'student'    
    },
    // --- New field for profile picture ---
    profilePicture: {
        type: DataTypes.STRING, // Store the URL of the profile picture
        allowNull: true,        // It's optional, so allow null
        defaultValue: null,     // Default value is null
    }
}, { timestamps: true });

export default User;