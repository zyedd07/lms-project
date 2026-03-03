"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require('dotenv').config(); // For environment variables
exports.config = {
    development: {
        db: {
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            dialect: 'postgres',
            dialectOptions: {
                ssl: {
                    require: true, // Ensures SSL is used
                    rejectUnauthorized: false // IMPORTANT for RDS. This tells Node.js to accept the connection even if it can't verify the RDS certificate chain against a known CA. This is common for AWS RDS. For strict production, you'd download the RDS CA bundle and set `ca: [fs.readFileSync('path/to/rds-ca-bundle.pem')]` and `rejectUnauthorized: true`. For now, `false` is simpler for initial setup.
                }
            },
            logging: true
        }
    }
};
