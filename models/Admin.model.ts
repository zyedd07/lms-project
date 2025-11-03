import { DataTypes } from "sequelize";
import { sequelize } from ".";
import { Role } from "../utils/constants";

const Admin = sequelize.define('Admin', {
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
     role: {
        type: DataTypes.ENUM(Role.ADMIN, Role.TEACHER, Role.STUDENT), 
        allowNull: false,
        defaultValue: Role.ADMIN, // Set a default role, perhaps 'admin' for new Admin records
    },
}, { timestamps: true });

export default Admin;
