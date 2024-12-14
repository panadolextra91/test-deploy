const bcrypt = require('bcrypt');
const User = require('./models/User'); // Adjust path as necessary
const sequelize = require('./config/database');
//hashPasswords.js
async function hashPasswords() {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        const users = await User.findAll();
        for (let user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            user.password = hashedPassword;
            await user.save();
        }

        console.log('Passwords hashed successfully.');
    } catch (error) {
        console.error('Error hashing passwords:', error);
    } finally {
        sequelize.close();
    }
}

hashPasswords();
