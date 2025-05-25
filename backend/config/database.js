require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log('Attempting to connect to database with following config:', {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql'
});

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        port: process.env.DB_PORT || 3306,
        logging: console.log,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        dialectOptions: {
            connectTimeout: 60000,
            // Add these options for detailed MySQL errors
            supportBigNumbers: true,
            bigNumberStrings: true,
            debug: true
        }
    }
);

// Test the connection and sync the model
const initializeDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        
        // Note: Database syncing disabled to prevent duplicate constraints
        // Use migrations for all schema changes instead of sync
        console.log('Database sync disabled - using migrations for schema management');
    } catch (error) {
        console.error('Unable to connect to the database:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            original: error.original
        });
        // Try alternative host if initial connection fails
        try {
            const alternativeHost = process.env.DB_HOST === 'localhost' ? '127.0.0.1' : 'localhost';
            console.log(`Trying alternative host: ${alternativeHost}`);
            sequelize.connectionManager.config.host = alternativeHost;
            await sequelize.authenticate();
            console.log('Connected successfully using alternative host');
        } catch (retryError) {
            console.error('Alternative connection also failed:', retryError.message);
        }
    }
};

// Initialize the database connection
initializeDatabase();

module.exports = sequelize;
