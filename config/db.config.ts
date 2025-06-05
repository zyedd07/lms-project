// src/config/db.config.ts

import { Sequelize } from 'sequelize';
require('dotenv').config(); // Load environment variables at the top

export const config = {
    development: {
        db: {
            username: process.env.DB_USER || '',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || '',
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT || '5432'),
            dialect: 'postgres' as 'postgres',
            dialectOptions: {},
            logging: false,
            // --- ADDED POOL CONFIGURATION HERE ---
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
            // --- END ADDED POOL CONFIGURATION ---
        }
    }
    // No 'production' or 'test' environment defined here, as per your request.
};

// Force the environment to 'development' regardless of what process.env.NODE_ENV is set to.
// This ensures that the 'development' configuration block is always selected.
const env = 'development';

const dbConfig = config[env as keyof typeof config]?.db;

if (!dbConfig) {
    console.error(`ERROR: The 'development' database configuration is missing in db.config.ts. This should not happen.`);
    process.exit(1);
}

let sequelize: Sequelize;

// Sequelize's constructor automatically prioritizes DATABASE_URL if it's set in process.env.
// This logic combines that behavior with using your explicitly defined 'development' options.
if (process.env.DATABASE_URL) {
    console.log("Connecting using DATABASE_URL (from .env).");
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        // Pass pool directly here, as it's now guaranteed to exist on dbConfig
        pool: dbConfig.pool,
        dialectOptions: {
            ...dbConfig.dialectOptions,
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });
} else {
    console.log("DATABASE_URL not found. Connecting using individual credentials from 'development' config.");
    sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        {
            host: dbConfig.host,
            port: dbConfig.port,
            dialect: dbConfig.dialect,
            dialectOptions: dbConfig.dialectOptions,
            logging: dbConfig.logging,
            // Pass pool directly here, as it's now guaranteed to exist on dbConfig
            pool: dbConfig.pool,
        }
    );
}

// Test the database connection
async function connectToDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

connectToDatabase();

export default sequelize;
