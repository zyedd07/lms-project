import { DataTypes } from "sequelize";
import { sequelize } from "."; // Assuming your sequelize instance is exported from here
import User from './User.model';
import Course from './Course.model'; // Assuming you have a Course model

const UserCourse = sequelize.define('UserCourse', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    courseId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Course,
            key: 'id'
        }
    },
    // --- NEW FIELD ADDED ---
    status: {
        type: DataTypes.ENUM('active', 'completed', 'dropped'),
        allowNull: false,
        defaultValue: 'active' // It's good practice to set a default status
    }
}, {
    timestamps: true, // This will add createdAt and updatedAt fields
    tableName: 'user_courses'
});


export default UserCourse;
