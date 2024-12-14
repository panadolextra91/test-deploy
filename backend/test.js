const sequelize = require('./config/database'); // Import your Sequelize instance

(async () => {
    try {
        const [results, metadata] = await sequelize.query(`
            SELECT Customer.id, Customer.name, Customer.email, SUM(Invoices.total_amount) AS total_spent
            FROM Customers AS Customer
            INNER JOIN invoices AS Invoices ON Customer.id = Invoices.customer_id
            WHERE Invoices.type = 'sale'
            GROUP BY Customer.id
            ORDER BY total_spent DESC
            LIMIT 5;
        `);

        console.log('Raw Query Results:', results);
    } catch (error) {
        console.error('Error executing raw SQL:', error);
    } finally {
        await sequelize.close(); // Close the database connection
    }
})();
