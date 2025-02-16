import { DataTypes } from "sequelize";
import { sequelize } from ".";
import Question from "./Question.model";

const Option = sequelize.define('TestOption', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    questionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Questions', 
            key: 'id',
        },
    },
    text: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    isCorrect: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: true,
    tableName: 'TestOptions'
});

export default Option;

