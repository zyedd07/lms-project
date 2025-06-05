// src/config/db.config.ts

import { Sequelize } from 'sequelize';
require('dotenv').config();

export const config = {
  development: {
    db: {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      dialect: 'postgres',
      dialectOptions: {}, 
      logging: false 
    }
  }

  
}
const env = process.env.NODE_ENV || 'development';

const dbConfig = config[env as keyof typeof config]?.db;

if (!dbConfig) {
    console.error(`Database configuration not found for environment: '${env}'. Please check your db.config.ts and NODE_ENV variable.`);
    process.exit(1);
}

// Create a new Sequelize instance
const sequelize = new Sequelize(
    // Now these arguments are guaranteed to be 'string' due to the fallbacks above
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        dialectOptions: dbConfig.dialectOptions,
        logging: dbConfig.logging,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

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
