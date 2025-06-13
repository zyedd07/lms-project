// src/models/webinar.model.ts

import { DataTypes, Model, Optional } from 'sequelize'; // Removed InferAttributes, InferCreationAttributes
import { sequelize } from '.'; // Crucial: Ensure this path is correct and 'sequelize' instance is validly exported.

// IMPORTANT: Using <any, any> for Model generics sacrifices type safety
// and reduces the benefits of using TypeScript with Sequelize.
// TypeScript will not validate the structure of your model's attributes.
class Webinar extends Model<any, any> { 
  // You still need to explicitly declare these properties so they are known on the class instance.
  // Their types here will be inferred or treated as 'any' by default.
  // '!' asserts that the property will be initialized.
  public id!: string; 
  public title!: string;
  public speaker!: string;
  public date!: string;
  public time!: string;
  public imageUrl?: string | null; // Mark as optional if nullable
  public status!: 'upcoming' | 'live' | 'recorded'; 
  public jitsiRoomName!: string;
  public price!: number;

  // Timestamps are automatically managed by Sequelize, but defining them here makes them accessible.
  public createdAt!: Date;
  public readonly updatedAt!: Date;
}

// --- Initialize the Model ---
Webinar.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
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
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.0,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'webinars',
  timestamps: true,
  modelName: 'Webinar'
});

export default Webinar;
