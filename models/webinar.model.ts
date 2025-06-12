import { DataTypes } from 'sequelize';
// Adjust this import path to where your Sequelize instance (named `sequelize`) is initialized.
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
  // --- UPDATED: Changed isLive to status enum ---
  status: {
    type: DataTypes.ENUM('upcoming', 'live', 'recorded'), // Define possible states
    defaultValue: 'upcoming', // Default status for new webinars
    allowNull: false,
  },
  // --- END UPDATED ---
  jitsiRoomName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true, // Ensure Jitsi room names are unique
  },
  // --- NEW: Price Field ---
  price: {
    type: DataTypes.DECIMAL(10, 2), // Use FLOAT for decimal numbers (e.g., currency)
    defaultValue: 0.0, // Default price
    allowNull: false,
  },
  // --- END NEW ---
}, {
  tableName: 'webinars', // Name of the table in your PostgreSQL database
  timestamps: true, // Enable createdAt and updatedAt fields
});

export default Webinar;

