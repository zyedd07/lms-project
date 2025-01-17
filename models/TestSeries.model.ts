import { DataTypes } from "sequelize";
import { sequelize } from ".";

const TestSeries = sequelize.define('TestSeries', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    totalMarks: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    duration: {
        type: DataTypes.INTEGER, // Duration in minutes
        allowNull: false,
    },
}, { timestamps: true });

export default TestSeries;