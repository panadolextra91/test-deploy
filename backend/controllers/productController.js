const { Op }       = require('sequelize');
const Supplier      = require('../models/Supplier');
const Product       = require('../models/Product');
const User          = require('../models/User');
const Pharmacy      = require('../models/Pharmacy');
const { parse }     = require('csv-parse/sync');
const fs            = require('fs').promises;
const nodemailer    = require('nodemailer');

// 1) List all products with each supplier's contact_info
exports.listProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{ model: Supplier, attributes: ['id', 'name', 'contact_info'] }]
    });
    res.json(products);
  } catch (err) {
    console.error('Error listing products:', err);
    res.status(500).json({ error: 'Failed to list products' });
  }
};

// 2) Search products by name via query param ?q=
exports.searchProducts = async (req, res) => {
  try {
    const q = req.query.q || '';
    const products = await Product.findAll({
      where: { name: { [Op.like]: `%${q}%` } },
      include: [{ model: Supplier, attributes: ['id', 'name', 'contact_info'] }]
    });
    res.json(products);
  } catch (err) {
    console.error('Error searching products:', err);
    res.status(500).json({ error: 'Failed to search products' });
  }
};

// 3) Bulk import products from CSV
exports.importCsv = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });
  try {
    const content = await fs.readFile(req.file.path);
    const records = parse(content, { columns: true, skip_empty_lines: true });
    let imported = 0;
    for (const row of records) {
      const { supplierName, brand, name, price, expiry_date } = row;
      const supplier = await Supplier.findOne({ where: { name: supplierName } });
      if (!supplier) continue;
      await Product.upsert({
        supplier_id: supplier.id,
        brand,
        name,
        price: parseFloat(price),
        expiry_date: new Date(expiry_date)
      }, {
        where: { supplier_id: supplier.id, brand, name }
      });
      imported++;
    }
    await fs.unlink(req.file.path);
    res.json({ imported });
  } catch (err) {
    console.error('Error importing CSV:', err);
    res.status(500).json({ error: 'Failed to import CSV', details: err.message });
  }
};

// 4) Send purchase order email (bulk), CC'ing the requester
exports.emailBulkOrder = async (req, res) => {
  try {
    const { items } = req.body; // [{ id: number, quantity: number }]
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No products selected' });
    }

    const user = await User.findByPk(req.user.id, { include: [{ model: Pharmacy, as: 'Pharmacy' }] });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const productIds = items.map(item => item.id);
    const quantityMap = Object.fromEntries(items.map(item => [item.id, item.quantity]));

    const products = await Product.findAll({
      where: { id: productIds },
      include: [{ model: Supplier, attributes: ['id', 'name', 'contact_info'] }]
    });

    if (!products.length) return res.status(404).json({ error: 'No matching products found' });

    const bySupplier = products.reduce((map, product) => {
      const sup = product.Supplier;
      const qty = quantityMap[product.id] || 1;
      if (!map[sup.id]) map[sup.id] = { supplier: sup, items: [] };
      map[sup.id].items.push({ ...product.toJSON(), quantity: qty });
      return map;
    }, {});

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'webappanhthu@gmail.com',
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const sentTo = [];
    for (const { supplier, items } of Object.values(bySupplier)) {
      const listItems = items
        .map(i => `<li><strong>${i.brand} ${i.name}</strong> — $${parseFloat(i.price).toFixed(2)} x ${i.quantity} (exp ${new Date(i.expiry_date).toISOString().slice(0,10)})</li>`)
        .join('');

      const html = `
        <h2>Purchase Order from ${user.Pharmacy.name}</h2>
        <p><strong>Requested by:</strong> ${user.name} (${user.role})</p>
        <p><strong>Ship to:</strong><br/>${user.Pharmacy.name}<br/>${user.Pharmacy.address.replace(/\n/g,'<br/>')}</p>
        <h3>Order Items:</h3><ul>${listItems}</ul>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_USER || 'webappanhthu@gmail.com',
        to: supplier.contact_info,
        cc: user.email,
        subject: `Order Request from ${user.Pharmacy.name}`,
        html
      });

      sentTo.push(supplier.contact_info);
    }

    res.json({ success: true, emailedTo: sentTo });
  } catch (err) {
    console.error('Error sending bulk order email:', err);
    res.status(500).json({ error: 'Failed to send order email', details: err.message });
  }
};

