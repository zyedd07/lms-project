import { DataTypes } from 'sequelize';
import { sequelize } from '.'; // Adjust the import path to your sequelize instance

const TermsSection = sequelize.define('TermsSection', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: new DataTypes.STRING(255),
    allowNull: false,
    comment: 'e.g., "1. Acceptance of Terms"',
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: 'The main paragraph text for the section.',
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Controls the display order; lower numbers appear first.',
  },
}, {
  tableName: 'TermsSections',
  timestamps: true, // This will add createdAt and updatedAt fields
});

export default TermsSection;
