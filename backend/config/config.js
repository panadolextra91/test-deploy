// config/config.js
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER   || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME   || 'pharmacy_management',
    host:     process.env.DB_HOST   || '127.0.0.1',
    port:     process.env.DB_PORT   || 3306,
    dialect:  'mysql'
  },
  test: {
    username: 'root',
    password: null,
    database: 'pharmacy_management_test',
    host:     '127.0.0.1',
    dialect:  'mysql'
  },
  production: {
    username: 'root',
    password: null,
    database: 'pharmacy_management_prod',
    host:     '127.0.0.1',
    dialect:  'mysql'
  }
};
