const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const News = sequelize.define('News', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 255]
        }
    },
    category: {
        type: DataTypes.ENUM('Live Healthily', 'Moms and Babies', 'Nutrition', 'Sex Education', 'Beauty', 'Hospitals'),
        allowNull: false,
        validate: {
            notEmpty: true,
            isIn: [['Live Healthily', 'Moms and Babies', 'Nutrition', 'Sex Education', 'Beauty', 'Hospitals']]
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    image: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    image_public_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    reading_time: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    summary: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_feature: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    imageUrl: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.image;
        }
    }
}, {
    tableName: 'news',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeValidate: (news, options) => {
            if (news.content) {
                // Calculate reading time based on words (assuming average reading speed of 200 words per minute)
                const wordCount = news.content.split(/\s+/).length;
                news.reading_time = Math.max(1, Math.ceil(wordCount / 200));
            }
        }
    }
});

module.exports = News; 