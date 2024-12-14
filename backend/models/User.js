const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
//User.js
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('pharmacist', 'admin'),
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
    },
}, {
    tableName: 'users',
    timestamps: false, // Disable automatic timestamps like createdAt and updatedAt
    indexes: [
        {
            unique: true, // Unique index on username
            fields: ['username'],
            name: 'users_username_unique'
        },
        {
            unique: true, // Unique index on email
            fields: ['email'],
            name: 'users_email_unique'
        }
    ]
});

module.exports = User;
