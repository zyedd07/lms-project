import { DataTypes } from 'sequelize';
// Adjust this import path to where your Sequelize instance (named `sequelize`) is initialized.
// For example: `import sequelize from '../config/database';`
import { sequelize } from '.'; // Placeholder import path, adjust as per your setup

const Webinar = sequelize.define('Webinar', { // No generic type for Model instance
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Automatically generate a UUID
    primaryKey: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255), // Explicit max length
    allowNull: false,
  },
  speaker: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  date: {
    type: DataTypes.STRING(50), // Storing as string (e.g., "June 5, 2025")
    allowNull: false,
  },
  time: {
    type: DataTypes.STRING(20), // Storing as string (e.g., "10:00 AM IST")
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING(500), // URL for image, can be longer
    allowNull: true, // Allow null if image isn't always available
  },
  isLive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Default to not live
    allowNull: false,
  },
  jitsiRoomName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true, // Ensure Jitsi room names are unique
  },
}, {
  tableName: 'webinars', // Name of the table in your PostgreSQL database
  timestamps: true, // Enable createdAt and updatedAt fields
});

export default Webinar;

