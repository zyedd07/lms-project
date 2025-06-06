import { DataTypes } from "sequelize";
import { sequelize } from ".";
import TestSeries from "./TestSeries.model"; // Import TestSeries model for association

const Test = sequelize.define('Test', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // Foreign key to TestSeries
    testSeriesId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'TestSeries', // References the 'TestSeries' table
            key: 'id',
        },
        onDelete: 'CASCADE', // If a TestSeries is deleted, all its associated Tests are also deleted
        onUpdate: 'CASCADE'
    },
    name: { // e.g., "Chapter 1 Quiz", "Midterm Exam"
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: { // Optional description for this specific test
        type: DataTypes.TEXT,
        allowNull: true,
    },
    durationMinutes: { // Duration for this specific test
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
        }
    },
    numberOfQuestions: { // The expected number of questions for this test (can be used for display, actual questions are in Question model)
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
        }
    },
    passMarkPercentage: { // Pass mark for this specific test
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0,
            max: 100,
        }
    },
    createdBy: { // Who created this specific Test (could be same as TestSeries creator or different)
        type: DataTypes.UUID,
        allowNull: false,
    },
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ["name", "testSeriesId"], // A TestSeries cannot have two tests with the same name
        },
    ],
    tableName: 'Tests' // Explicit table name
});

// Define associations
Test.belongsTo(TestSeries, { foreignKey: 'testSeriesId' });
TestSeries.hasMany(Test, { foreignKey: 'testSeriesId', onDelete: 'CASCADE' });

export default Test;
