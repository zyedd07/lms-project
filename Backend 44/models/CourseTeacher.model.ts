import { DataTypes } from "sequelize";
import { sequelize } from ".";

const CourseTeacher = sequelize.define('CourseTeacher', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    courseId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Courses',
            key: 'id',
        },
    },
    teacherId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Teachers',
            key: 'id',
        },
    },
}, { timestamps: true });

export default CourseTeacher;