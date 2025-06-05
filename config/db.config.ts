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
            logging: false
        }
    }
    // IMPORTANT: No 'production' or 'test' environment is defined here,
    // as per your request to only have 'development'.
};

// --- CRITICAL ADJUSTMENT FOR "DEVELOPMENT ONLY" IN DEPLOYMENT ---
// Force the environment to 'development' regardless of what process.env.NODE_ENV is set to.
// This ensures that the 'development' configuration block is always selected.
const env = 'development';
// --- END CRITICAL ADJUSTMENT ---

const dbConfig = config[env as keyof typeof config]?.db;

// This check should now always pass, as 'development' config is explicitly set above.
if (!dbConfig) {
    console.error(`ERROR: The 'development' database configuration is missing in db.config.ts. This should not happen.`);
    process.exit(1); // Exit if even the 'development' config is invalid.
}

let sequelize: Sequelize;

// Sequelize's constructor automatically prioritizes DATABASE_URL if it's set in process.env.
// This logic combines that behavior with using your explicitly defined 'development' options.
if (process.env.DATABASE_URL) {
    console.log("Connecting using DATABASE_URL (from .env).");
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        pool: dbConfig.pool,
        // Merge dialectOptions from the config, and add SSL for cloud databases (like Supabase).
        // The logs indicate Sequelize already applies SSL options when DATABASE_URL is used,
        // but explicitly including it ensures it's always configured.
        dialectOptions: {
            ...dbConfig.dialectOptions, // Merge any other dialectOptions you might have in config
            ssl: { // This is crucial for connecting to cloud PostgreSQL (like Supabase)
                require: true,
                rejectUnauthorized: false // Often necessary for dev/staging, adjust for strict production
            }
        }
    });
} else {
    console.log("DATABASE_URL not found. Connecting using individual credentials from 'development' config.");
    // Fallback to individual credentials from the forced 'development' config if DATABASE_URL is not set
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
