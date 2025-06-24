import { DataTypes, Model } from 'sequelize';
import { sequelize } from '.'; // Assuming sequelize instance is exported from the models index file
import User from './User.model'; // Assuming a User model exists in the same directory

/**
 * Note: Using <any, any> for Model generics sacrifices some compile-time type safety.
 * This approach is simpler but less robust than using explicit interfaces for model attributes.
 */
class Notification extends Model<any, any> {
  // --- Public Class Properties ---
  // These properties are declared to be accessible on the model instances.
  // The '!' asserts that these will be definitely assigned by Sequelize.
  public id!: string;
  public userId!: string;
  public type!: 'message' | 'file' | 'update' | 'webinar' | 'system';
  public text!: string;
  public isRead!: boolean;
  public link?: string | null; // Optional link to navigate to

  // Timestamps are automatically managed by Sequelize, but defining them makes them type-accessible.
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// --- Initialize the Model ---
Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User, // This creates a foreign key relationship to the 'users' table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM('message', 'file', 'update', 'webinar', 'system'),
      allowNull: false,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize, // Pass the sequelize instance
    tableName: 'notifications',
    timestamps: true,
    modelName: 'Notification',
  }
);

Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

export default Notification;
