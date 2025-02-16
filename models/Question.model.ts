import { DataTypes } from "sequelize";
import { sequelize } from ".";
import TestSeries from "./TestSeries.model";

const Question = sequelize.define('Question', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    testId: {
        type: DataTypes.UUID,
        allowNull: true, 
        references: {
            model: 'Tests',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    text: {  
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    timestamps: true,
    tableName: 'Questions'
});

export default Question;
