import { DataTypes } from "sequelize";
import { sequelize } from ".";

const CourseDemoVideo = sequelize.define('CourseDemoVideo', {
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
    demoVideoId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'DemoVideos',
            key: 'id',
        },
    },
}, { timestamps: true });

export default CourseDemoVideo;