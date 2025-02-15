import { DataTypes } from "sequelize";
import { sequelize } from ".";
import TestSeries from "./TestSeries.model";

const Question = sequelize.define('Question', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    testSeriesId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'TestSeries', 
            key: 'id',
        },
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
