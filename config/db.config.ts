// src/config/database.ts

import { Sequelize } from 'sequelize';
// Import your configuration object. Adjust the path if your config.ts is elsewhere.
import { config } from './config';

// Determine the current environment (e.g., 'development', 'production', 'test')
// It's good practice to set NODE_ENV in your environment or start scripts
const env = process.env.NODE_ENV || 'development';

// Get the database configuration specific to the current environment
const dbConfig = config[env as keyof typeof config]?.db;

// Ensure configuration is found for the current environment
if (!dbConfig) {
    console.error(`Database configuration not found for environment: ${env}`);
    process.exit(1); // Exit if config is missing
}

// Create a new Sequelize instance using the extracted configuration
const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        dialectOptions: dbConfig.dialectOptions,
        logging: dbConfig.logging, // Uses the logging setting from your config
        pool: { // Example pool settings, adjust as needed for performance
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Test the database connection
async function connectToDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        // It's good practice to exit the process if the database connection fails at startup
        process.exit(1);
    }
}

// Call the connection function to ensure the database is connected when the app starts
connectToDatabase();

export default sequelize; // Export the configured Sequelize instance
