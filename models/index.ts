require('dotenv').config(); // Ensure dotenv is loaded first to access process.env.DATABASE_URL

import { Sequelize } from 'sequelize';
// You might not need to import 'config' from '../config/db.config' anymore
// if you're solely relying on DATABASE_URL for the main connection.
// If you use other settings from db.config, keep the import, but ensure they don't override the connection string.

// Log the DATABASE_URL that will be used for clarity
console.log("Attempting to connect using DATABASE_URL:", process.env.DATABASE_URL ? "URL is set" : "DATABASE_URL is NOT set!");

export const sequelize = new Sequelize(process.env.DATABASE_URL || '', {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,           // Supabase (and most hosted DBs) REQUIRES SSL
            rejectUnauthorized: false // Often needed for free/self-signed certs
        },
         family: 4
    },
    // You can keep other options like pool, logging, retry here if they are generic
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    logging: process.env.logging === "true" || false, // Still use this for logging if you want
    retry: {
        max: 3,
    },
});
console.log("Sequelize options at runtime:", JSON.stringify((sequelize as any).options, null, 2));


// Import and initialize your models here if they are defined after sequelize
// Example:
// import UserModel from './User';
// import CourseModel from './Course';
//
// UserModel.initialize(sequelize);
// CourseModel.initialize(sequelize);
//
// // Define associations
// UserModel.associate(sequelize.models);
// CourseModel.associate(sequelize.models);
//
// const db = {
//     sequelize,
//     Sequelize,
//     User: UserModel,
//     Course: CourseModel,
//     // ... other models
// };
//
// export default db;
