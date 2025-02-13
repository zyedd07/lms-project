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
        allowNull: true,
    },
    demoVideoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Categories',
            key: 'id',
        },
    },
    courseType: {
        type: DataTypes.ENUM('live', 'recorded'),
        allowNull: false,
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }


}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ["name", "categoryId"],
        },
    ],
});

export default Course;