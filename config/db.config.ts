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
      dialectOptions: {}, 
      logging: false 
    }
  }

  
}
