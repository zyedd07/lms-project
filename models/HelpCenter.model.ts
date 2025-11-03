import { DataTypes } from 'sequelize';
import { sequelize } from '.'; // Adjust the import path to your sequelize instance

const HelpCenterSection = sequelize.define('HelpCenterSection', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: new DataTypes.STRING(255),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Lower numbers appear first',
  },
}, {
  tableName: 'HelpCenterSections',
  timestamps: true // This will add createdAt and updatedAt fields
});

export default HelpCenterSection;
