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
    // New price field
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,      // As requested: "no nullable"
        defaultValue: 0.0,     // Ensures a default value if not provided
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
