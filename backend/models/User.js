const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');
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
        unique: true,
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
        unique: true,
        validate: {
            isEmail: true
        }
    },
    role: {
        type: DataTypes.ENUM('admin', 'pharmacist'),
        defaultValue: 'pharmacist',
        allowNull: false,
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    avatarPublicId: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    avatarUrl: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.avatar; // Now returns the full Cloudinary URL
        }
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
    ],
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

module.exports = User;
