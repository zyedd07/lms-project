import { DataTypes } from "sequelize";
import { sequelize } from ".";

const CourseTestSeries = sequelize.define('CourseTestSeries', {
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
    testSeriesId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'TestSeries',
            key: 'id',
        },
    },
}, { timestamps: true });

export default CourseTestSeries;