// src/models/webinar.model.ts

import { DataTypes, Model, Optional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '.'; // Adjust this import path to where your Sequelize instance (named `sequelize`) is initialized.
// Make sure this path is correct: 'index' or 'sequelize' depending on how you export it.

// --- 1. Define Attributes Interface ---
// This interface describes the shape of a row in your database table.
interface WebinarAttributes {
  id: string; // UUID is typically a string in TypeScript
  title: string;
  speaker: string;
  date: string;
  time: string;
  imageUrl?: string; // Optional field
  status: 'upcoming' | 'live' | 'recorded'; // Matches your ENUM values
  jitsiRoomName: string;
  price: number; // DECIMAL maps to number in JS/TS
  createdAt?: Date; // Sequelize adds these automatically
  updatedAt?: Date; // Sequelize adds these automatically
}

// --- 2. Define Creation Attributes Interface (Optional) ---
// This interface describes the attributes that are required for model creation.
// 'id' and 'status', 'price' can be omitted during creation because they have default values.
interface WebinarCreationAttributes extends Optional<WebinarAttributes, 'id' | 'status' | 'price' | 'createdAt' | 'updatedAt' | 'imageUrl'> {}
// You might only need 'id' | 'status' | 'price' | 'imageUrl' if createdAt/updatedAt are always handled by Sequelize.

// --- 3. Define the Model Class ---
// We extend Model and pass our interfaces.
// InferAttributes makes sure properties like 'createdAt' and 'updatedAt' are included,
// while InferCreationAttributes lets you define which attributes are optional when creating a new record.
class Webinar extends Model<InferAttributes<WebinarAttributes>, InferCreationAttributes<WebinarCreationAttributes>> implements WebinarAttributes {
  // We need to explicitly define the properties that are *not* optional in the interface
  public id!: string;
  public title!: string;
  public speaker!: string;
  public date!: string;
  public time!: string;
  public imageUrl?: string; // This is optional
  public status!: 'upcoming' | 'live' | 'recorded';
  public jitsiRoomName!: string;
  public price!: number;

  // Timestamps are automatically managed by Sequelize, but defining them here makes them type-safe
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// --- 4. Initialize the Model ---
Webinar.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Automatically generate a UUID
    primaryKey: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  speaker: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  date: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  time: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'live', 'recorded'),
    defaultValue: 'upcoming',
    allowNull: false,
  },
  jitsiRoomName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2), // Maps to number in JS/TS
    defaultValue: 0.0,
    allowNull: false,
  },
}, {
  sequelize, // Pass the sequelize instance
  tableName: 'webinars', // Name of the table in your PostgreSQL database
  timestamps: true, // Enable createdAt and updatedAt fields
});

export default Webinar;