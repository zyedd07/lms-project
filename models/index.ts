import { Sequelize } from 'sequelize';
import { config } from '../config/db.config'; // Adjust path as needed

const env = 'development';
const { db } = config[env];

// Initialize Sequelize without a database to create the database
export const sequelize = new Sequelize(db.database as string, db.username as string, db.password, {
    host: db.host,
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false, // Allow self-signed certs (if any)
        },
    },
    port: db.port ?? 5432,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    logging: process.env.logging == "true" || false, // Disable logging in production
    retry: {
        max: 3, // Retry a failed query up to 3 times
    },
});
