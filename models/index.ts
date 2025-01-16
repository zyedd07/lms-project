import { Sequelize } from 'sequelize';
import { config } from '../config/db.config'; // Adjust path as needed

const env = 'development';
const { db } = config[env];

// Initialize Sequelize without a database to create the database
export const sequelize = new Sequelize(db.database as string, db.username as string, db.password, {
    host: db.host,
    dialect: 'mysql',
    port: db.port ?? 3306,
    pool: {
        max: 10, // Maximum number of connections in the pool
        min: 0, // Minimum number of connections in the pool
        acquire: 50000, // Maximum time (ms) Sequelize will try to get a connection before throwing an error
        idle: 10000, // Maximum time (ms) a connection can be idle before being released
    },
    logging: false, // Disable logging in production
    retry: {
        max: 3, // Retry a failed query up to 3 times
    },
});
