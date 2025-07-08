"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const _1 = require(".");
const TestSeries = _1.sequelize.define('TestSeries', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    // New price field
    price: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false, // As requested: "no nullable"
        defaultValue: 0.0, // Ensures a default value if not provided
    },
    createdBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users', // This should match your actual Users table name
            key: 'id',
        },
        // onDelete: 'SET NULL',
        // onUpdate: 'CASCADE'
    },
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ["name", "createdBy"],
        },
    ],
});
exports.default = TestSeries;
