require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME, // Database name
    process.env.DB_USER, // Database username
    process.env.DB_PASSWORD, // Database password
    {
        host: process.env.DB_HOST, // Database host
        dialect: 'mysql',
        port: process.env.DB_PORT || 3306, // Database port, default to 3306
        logging: false, // Set to true if you want to see SQL queries in the console
    }
);

module.exports = sequelize;
