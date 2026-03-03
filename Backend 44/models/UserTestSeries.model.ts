import { DataTypes } from "sequelize";
import { sequelize } from ".";
import User from './User.model';
import TestSeries from './TestSeries.model'; // Assuming you have a TestSeries model

const UserTestSeries = sequelize.define('UserTestSeries', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    testSeriesId: {
        // Assuming your TestSeries model also uses a UUID primary key
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: TestSeries,
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'dropped'),
        allowNull: false,
        defaultValue: 'active'
    }
}, {
    timestamps: true,
    tableName: 'user_test_series'
});

export default UserTestSeries;
