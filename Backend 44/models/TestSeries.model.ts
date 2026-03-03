import { DataTypes } from "sequelize";
import { sequelize } from ".";
import User from './User.model';

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
    createdBy: { // This field will now be a foreign key
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users', // This should match your actual Users table name
            key: 'id',
        },
        // onDelete: 'SET NULL',
        // onUpdate: 'CASCADE'
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
