import { DataTypes } from "sequelize";
import { sequelize } from ".";

const Enrollment = sequelize.define('Enrollment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    courseId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'dropped'),
        allowNull: false,
    },
}, { timestamps: true });

export default Enrollment;