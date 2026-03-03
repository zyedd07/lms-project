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
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
    },
    // Thumbnail image URL for the test series
    thumbnailUrl: {
        type: DataTypes.STRING(2048),  // Long enough for any URL
        allowNull: true,
        defaultValue: null,
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id',
        },
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