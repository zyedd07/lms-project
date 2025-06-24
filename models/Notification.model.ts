import { DataTypes, Model } from 'sequelize';
import { sequelize } from '.'; 

class Notification extends Model<any, any> {
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
      // The 'references' key is still important for defining the foreign key constraint at the database level.
      references: {
        model: 'Users', // Reference the table name directly as a string.
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

export default Notification;
