import { DataTypes } from "sequelize";
import { sequelize } from ".";
import User from './User.model';
// FIX: Changed the import to use the correct model name 'QuestionBank'
import QuestionBank from './QuestionBank.model'; 

const UserQbank = sequelize.define('UserQbank', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    qbankId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            // FIX: The model reference now correctly points to QuestionBank
            model: QuestionBank,
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'dropped'),
        allowNull: false,
        defaultValue: 'active'
    }
}, {
    timestamps: true,
    tableName: 'user_qbanks'
});

export default UserQbank;
