import { DataTypes } from "sequelize";
import { sequelize } from ".";
import TestSeries from "./TestSeries.model";

const Test = sequelize.define('Test', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
 
}, {
  timestamps: true,
  tableName: 'Tests'
});

export default Test;
