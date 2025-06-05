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
    },
    // --- ADD THE PRODUCTION CONFIGURATION HERE ---
    production: {
        db: {
            // Sequelize can directly use the DATABASE_URL connection string.
            // When DATABASE_URL is provided to the Sequelize constructor directly,
            // it parses all the host, port, user, password, database details from it.
            // You typically don't need to specify individual fields if using DATABASE_URL.
            url: process.env.DATABASE_URL || '', // Your DATABASE_URL from .env
            dialect: 'postgres' as 'postgres',
            logging: false, // Keep logging off in production
            dialectOptions: {
                ssl: { // Supabase usually requires SSL
                    require: true,
                    rejectUnauthorized: false // Often needed for cloud providers like Supabase
                }
            },
            pool: { // Standard pool settings
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        }
    },
    // You can also add a 'test' environment if needed for automated testing
    test: {
        db: {
            // Example for a test environment, often an in-memory SQLite or separate test DB
            username: process.env.TEST_DB_USER || '',
            password: process.env.TEST_DB_PASSWORD || '',
            database: process.env.TEST_DB_NAME || 'lms_test_db',
            host: process.env.TEST_DB_HOST || 'localhost',
            port: Number(process.env.TEST_DB_PORT || '5433'),
            dialect: 'postgres' as 'postgres',
            dialectOptions: {},
            logging: false
        }
    }
};

const env = process.env.NODE_ENV || 'development';

const dbConfig = config[env as keyof typeof config]?.db;

if (!dbConfig) {
    console.error(`Database configuration not found for environment: '${env}'. Please check your db.config.ts and NODE_ENV variable.`);
    process.exit(1);
}

// --- IMPORTANT: Adjust the Sequelize instantiation logic ---
let sequelize: Sequelize;

if (dbConfig.url) { // If a 'url' property is present (like in production config)
    sequelize = new Sequelize(dbConfig.url, {
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        dialectOptions: dbConfig.dialectOptions,
        pool: dbConfig.pool,
    });
} else { // Otherwise, use individual fields (like in development/test configs)
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
