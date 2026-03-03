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
            isEmail: true,
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
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'student'
    },
    profilePicture: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
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
    passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    permissions: {
        type: DataTypes.JSONB,
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
    },
    // === NEW DEVICE TOKEN FIELDS ===
    deviceToken: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Unique token for current active device session'
    },
    deviceId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Device identifier from client'
    },
    lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp of last successful login'
    },
    lastLoginDevice: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Device information from last login'
    }
}, {
    timestamps: true,
});

export default User;