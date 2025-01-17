import { DataTypes } from "sequelize";
import { sequelize } from ".";

const Course = sequelize.define('Course', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    duration: {
        type: DataTypes.INTEGER, // Duration in hours
        allowNull: false,
    },
}, { timestamps: true });

export default Course;