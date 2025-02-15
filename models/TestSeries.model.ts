import { DataTypes } from "sequelize";
import { sequelize } from ".";

const TestSeries = sequelize.define('TestSeries', {
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
    createdBy: {
        type: DataTypes.UUID, 
        allowNull: false,
    },
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ["name", "createdBy"],
        },
    ],
});

export default TestSeries;

