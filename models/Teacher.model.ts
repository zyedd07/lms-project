import { DataTypes } from "sequelize";
import { sequelize } from ".";

const Teacher = sequelize.define('Teacher', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expertise: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    phone:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    }
}, { timestamps: true });

export default Teacher;