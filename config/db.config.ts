require('dotenv').config(); // For environment variables

export const config = {
  development: {
    db: {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      dialect: 'postgres',
      dialectOptions: {}, // Disable SSL by providing an empty object
      logging: false // Optional: disables Sequelize console logs
    }
  }

  // Define other environments (test, production) if needed
}
