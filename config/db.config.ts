// src/config/db.config.ts

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv'; // Make sure dotenv is imported to load .env variables

dotenv.config(); // Load environment variables from your .env file at the top

// --- The configuration object is now defined directly here ---
// This was previously in a separate config.ts, but now it's merged.
export const config = {
    development: {
        db: {
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            dialect: 'postgres' as 'postgres', // Explicitly cast for dialect type safety
            dialectOptions: {}, // Disable SSL by providing an empty object if connecting to a non-SSL local DB
            logging: false // Optional: disables Sequelize console logs
        }
    }
    // You can define other environments (test, production) here if needed
};
// --- End of configuration object ---


// Determine the current environment (e.g., 'development', 'production', 'test')
const env = process.env.NODE_ENV || 'development';

// Get the database configuration specific to the current environment
// Using 'as keyof typeof config' for type safety when accessing config[env]
const dbConfig = config[env as keyof typeof config]?.db;

// Ensure configuration is found for the current environment
if (!dbConfig) {
    console.error(`Database configuration not found for environment: '${env}'. Please check your db.config.ts and NODE_ENV variable.`);
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
        logging: dbConfig.logging,
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
