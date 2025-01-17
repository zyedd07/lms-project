import { DataTypes } from "sequelize";
import { sequelize } from ".";

const DemoVideo = sequelize.define('DemoVideo', {
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
    videoUrl: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, { timestamps: true });

export default DemoVideo;