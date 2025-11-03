import { DataTypes } from "sequelize";
import { sequelize } from "."; // Assuming your sequelize instance is exported from here
import User from './User.model'; // Assuming you have a User model
import Webinar from './webinar.model'; // Assuming you have a Webinar model
import { WebinarEnrollmentStatus } from '../utils/types'; // Import the enum for type safety

/**
 * Defines the UserWebinar model, representing the many-to-many relationship
 * between users and webinars, including the enrollment status.
 */
const UserWebinar = sequelize.define('UserWebinar', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID, // Assuming User IDs are UUIDs
        allowNull: false,
        references: {
            model: User, // References the User model
            key: 'id'
        }
    },
    webinarId: {
        type: DataTypes.UUID, // Assuming Webinar IDs are UUIDs
        allowNull: false,
        references: {
            model: Webinar, // References the Webinar model
            key: 'id'
        }
    },
    status: {
        // Use the imported enum values for the ENUM type in Sequelize
        type: DataTypes.ENUM(
            WebinarEnrollmentStatus.ACTIVE,
            WebinarEnrollmentStatus.COMPLETED,
            WebinarEnrollmentStatus.DROPPED,
            WebinarEnrollmentStatus.REGISTERED,
            WebinarEnrollmentStatus.ATTENDED,
            WebinarEnrollmentStatus.CANCELLED
        ),
        allowNull: false,
        defaultValue: WebinarEnrollmentStatus.REGISTERED // Set a sensible default status
    }
}, {
    timestamps: true, // This will automatically add `createdAt` and `updatedAt` fields
    tableName: 'user_webinars' // Define the table name in the database
});


export default UserWebinar;
