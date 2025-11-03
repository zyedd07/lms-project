import { DataTypes } from "sequelize";
import { sequelize } from ".";

const CourseLiveLecture = sequelize.define('CourseLiveLecture', {
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
    liveLectureId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'LiveLectures',
            key: 'id',
        },
    },
}, { timestamps: true });

export default CourseLiveLecture;