const { Op }       = require('sequelize');
const Supplier      = require('../models/Supplier');
const Product       = require('../models/Product');
const User          = require('../models/User');
const Pharmacy      = require('../models/Pharmacy');
const Notification  = require('../models/Notification');
const PharmaSalesRep = require('../models/PharmaSalesRep');
const { parse }     = require('csv-parse/sync');
const fs            = require('fs').promises;
const nodemailer    = require('nodemailer');

// 1) List all products with each supplier's contact_info and pharma_sales_rep's email
exports.listProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        { 
          model: Supplier, 
          attributes: ['id', 'name', 'contact_info'] 
        },
        {
          model: PharmaSalesRep,
          attributes: ['id', 'name', 'email'],
          //as: 'salesRep'
        }
      ]
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

// 3) Bulk import products from CSV (no upsert — allows monthly snapshot)
exports.importCsv = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });
  try {
    const content = await fs.readFile(req.file.path);
    const records = parse(content, { 
      columns: true, 
      skip_empty_lines: true,
      trim: true
    });
    let imported = 0;
    let errors = [];

    for (const row of records) {
      try {
        const { supplierName, brand, name, price, expiry_date, pharmaSalesRepName } = row;
        
        // Find supplier
        const supplier = await Supplier.findOne({ 
          where: { 
            name: supplierName.trim() 
          }
        });
        if (!supplier) {
          errors.push(`Supplier not found: ${supplierName}`);
          continue;
        }

        // Find sales rep
        let pharma_sales_rep_id = null;
        if (pharmaSalesRepName) {
          const salesRep = await PharmaSalesRep.findOne({ 
            where: { 
              name: pharmaSalesRepName.trim(),
              supplier_id: supplier.id 
            }
          });
          if (!salesRep) {
            errors.push(`Sales rep not found: ${pharmaSalesRepName} for supplier ${supplierName}`);
          } else {
            pharma_sales_rep_id = salesRep.id;
          }
        }

        // Create product
        await Product.create({
          supplier_id: supplier.id,
          brand: brand.trim(),
          name: name.trim(),
          price: parseFloat(price),
          expiry_date: new Date(expiry_date),
          pharma_sales_rep_id
        });
        imported++;
      } catch (err) {
        errors.push(`Error processing row: ${JSON.stringify(row)} - ${err.message}`);
      }
    }

    await fs.unlink(req.file.path);
    res.json({ 
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('Error importing CSV:', err);
    res.status(500).json({ error: 'Failed to import CSV', details: err.message });
  }
};

// 4) Send purchase order email (bulk), CC'ing the requester and pharma sales rep
exports.emailBulkOrder = async (req, res) => {
  try {
    const { items } = req.body; // [{ id: number, quantity: number }]
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No products selected' });
    }

    const user = await User.findByPk(req.user.id, { include: [{ model: Pharmacy, as: 'pharmacy' }] });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const productIds = items.map(item => item.id);
    const quantityMap = Object.fromEntries(items.map(item => [item.id, item.quantity]));

    const products = await Product.findAll({
      where: { id: productIds },
      include: [
        { model: Supplier, attributes: ['id', 'name', 'contact_info'] },
        { model: PharmaSalesRep, attributes: ['id', 'name', 'email'], as: 'salesRep' }
      ]
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
        .map(i => `<li>
          <strong>${i.brand} ${i.name}</strong> — $${parseFloat(i.price).toFixed(2)} x ${i.quantity} (exp ${new Date(i.expiry_date).toISOString().slice(0,10)})
          ${i.salesRep ? `<br/>Sales Rep: ${i.salesRep.name}` : ''}
        </li>`)
        .join('');

      const html = `
        <h2>Purchase Order from ${user.pharmacy.name}</h2>
        <p><strong>Requested by:</strong> ${user.name} (${user.role})</p>
        <p><strong>Ship to:</strong><br/>${user.pharmacy.name}<br/>${user.pharmacy.address.replace(/\n/g,'<br/>')}</p>
        <h3>Order Items:</h3><ul>${listItems}</ul>
      `;

      // Get unique sales rep emails from items
      const salesRepEmails = [...new Set(items
        .filter(item => item.salesRep?.email)
        .map(item => item.salesRep.email))];

      await transporter.sendMail({
        from: process.env.SMTP_USER || 'webappanhthu@gmail.com',
        to: supplier.contact_info,
        cc: [user.email, ...salesRepEmails].filter(Boolean),
        subject: `Order Request from ${user.pharmacy.name}`,
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

// 5) Filter products by supplier and month
exports.filterBySupplierAndMonth = async (req, res) => {
  try {
    const { supplierId, month } = req.query;

    const where = {};
    if (supplierId) where.supplier_id = supplierId;

    if (month) {
      const [year, m] = month.split('-');
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 1); // first day of next month

      where.created_at = { [Op.gte]: start, [Op.lt]: end };
    }

    const products = await Product.findAll({
      where,
      include: [{ model: Supplier, attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']]
    });

    res.json(products);
  } catch (err) {
    console.error('Error filtering products:', err);
    res.status(500).json({ error: 'Failed to filter products' });
  }
};

// 6) External CSV import for pharma sales reps (no authentication required)
exports.importCsvExternal = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });
  
  try {
    // Always require pharmacy_id for all cases
    const { pharmacy_id } = req.body;
    if (!pharmacy_id) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        error: 'Target pharmacy selection required',
        message: 'Please select a target pharmacy to send your products to',
        required_field: 'pharmacy_id',
        hint: 'Use GET /api/products/pharmacies to get list of available pharmacies'
      });
    }

    // Validate pharmacy exists early
    const targetPharmacy = await Pharmacy.findByPk(pharmacy_id);
    if (!targetPharmacy) {
      await fs.unlink(req.file.path);
      return res.status(404).json({ 
        error: 'Selected pharmacy not found',
        pharmacy_id_provided: pharmacy_id,
        message: 'Please select a valid pharmacy from the available list'
      });
    }

    const content = await fs.readFile(req.file.path);
    const records = parse(content, { 
      columns: true, 
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    // Extract pharmaSalesName and supplierName from first row
    const firstRow = records[0];
    const { pharmaSalesRepName, supplierName } = firstRow;

    if (!pharmaSalesRepName || !supplierName) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ 
        error: 'CSV must contain pharmaSalesRepName and supplierName columns' 
      });
    }

    // Check if supplier exists
    let supplier = await Supplier.findOne({ 
      where: { name: supplierName.trim() }
    });

    // If supplier doesn't exist, check if supplier info is provided
    if (!supplier) {
      const { 
        supplier_name, 
        supplier_contact_info, 
        supplier_address,
        name, 
        email, 
        phone,
        pharmacy_id
      } = req.body;
      
      if (!supplier_name || !supplier_contact_info || !supplier_address || !name || !email || !phone || !pharmacy_id) {
        await fs.unlink(req.file.path);
        return res.status(400).json({
          error: 'Supplier not found. Please provide the following information:',
          required_fields: {
            supplier_name: 'Supplier company name',
            supplier_contact_info: 'Supplier contact email',
            supplier_address: 'Supplier address',
            name: 'Your full name',
            email: 'Your email address',
            phone: 'Your phone number'
          },
          supplier_name_from_csv: supplierName,
          sales_rep_name_from_csv: pharmaSalesRepName,
          note: 'Pharmacy is already validated'
        });
      }

      // Validate that supplier_name matches supplierName from CSV
      if (supplier_name.trim() !== supplierName.trim()) {
        await fs.unlink(req.file.path);
        return res.status(400).json({
          error: 'Supplier name mismatch',
          message: 'The supplier name you provided does not match the supplier name in your CSV file',
          your_input: supplier_name.trim(),
          csv_file_has: supplierName.trim(),
          solution: 'Please ensure the supplier_name matches exactly with the supplierName in your CSV file'
        });
      }

      // Validate that name matches pharmaSalesRepName from CSV
      if (name.trim() !== pharmaSalesRepName.trim()) {
        await fs.unlink(req.file.path);
        return res.status(400).json({
          error: 'Sales rep name mismatch',
          message: 'Your name does not match the pharmaSalesRepName in your CSV file',
          your_input: name.trim(),
          csv_file_has: pharmaSalesRepName.trim(),
          solution: 'Please ensure your name matches exactly with the pharmaSalesRepName in your CSV file'
        });
      }

      // Check if email already exists
      const existingEmail = await PharmaSalesRep.findOne({ where: { email: email.trim() } });
      if (existingEmail) {
        await fs.unlink(req.file.path);
        return res.status(400).json({ 
          error: 'Email address already in use by another sales rep' 
        });
      }

      // Create new supplier
      try {
        supplier = await Supplier.create({
          name: supplier_name.trim(),
          contact_info: supplier_contact_info.trim(),
          address: supplier_address.trim()
        });
      } catch (err) {
        await fs.unlink(req.file.path);
        return res.status(500).json({ 
          error: 'Failed to create supplier',
          details: err.message 
        });
      }

      // Create new sales rep
      try {
        const salesRep = await PharmaSalesRep.create({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          supplier_id: supplier.id
        });

        // Import products
        const { imported, errors } = await importProductsForSalesRep(records, supplier, salesRep, pharmacy_id);

        await fs.unlink(req.file.path);
        
        return res.json({ 
          success: true,
          message: `Supplier and sales rep created successfully. Products imported by ${salesRep.name}`,
          imported,
          sales_rep: {
            id: salesRep.id,
            name: salesRep.name,
            email: salesRep.email
          },
          supplier: {
            id: supplier.id,
            name: supplier.name,
            contact_info: supplier.contact_info
          },
          target_pharmacy: {
            id: targetPharmacy.id,
            name: targetPharmacy.name
          },
          errors: errors.length > 0 ? errors : undefined
        });

      } catch (err) {
        await fs.unlink(req.file.path);
        return res.status(500).json({ 
          error: 'Failed to create sales rep account',
          details: err.message 
        });
      }
    }

    // Supplier exists, check if sales rep exists
    let salesRep = await PharmaSalesRep.findOne({
      where: { 
        name: pharmaSalesRepName.trim(),
        supplier_id: supplier.id 
      }
    });

    // If sales rep doesn't exist, check if additional info is provided
    if (!salesRep) {
      const { name, email, phone, pharmacy_id } = req.body;
      
      if (!name || !email || !phone || !pharmacy_id) {
        await fs.unlink(req.file.path);
        return res.status(400).json({
          error: 'Sales rep not found. Please provide the following information:',
          required_fields: {
            name: 'Your full name',
            email: 'Your email address',
            phone: 'Your phone number'
          },
          supplier_name: supplierName,
          sales_rep_name: pharmaSalesRepName,
          note: 'Pharmacy is already validated'
        });
      }

      // Validate pharmacy exists
      const pharmacy = await Pharmacy.findByPk(pharmacy_id);
      if (!pharmacy) {
        await fs.unlink(req.file.path);
        return res.status(404).json({ 
          error: 'Pharmacy not found. Please provide a valid pharmacy_id',
          pharmacy_id_provided: pharmacy_id
        });
      }

      // Validate that name matches pharmaSalesRepName from CSV
      if (name.trim() !== pharmaSalesRepName.trim()) {
        await fs.unlink(req.file.path);
        return res.status(400).json({
          error: 'Sales rep name mismatch',
          message: 'Your name does not match the pharmaSalesRepName in your CSV file',
          your_input: name.trim(),
          csv_file_has: pharmaSalesRepName.trim(),
          solution: 'Please ensure your name matches exactly with the pharmaSalesRepName in your CSV file'
        });
      }

      // Check if email already exists
      const existingEmail = await PharmaSalesRep.findOne({ where: { email: email.trim() } });
      if (existingEmail) {
        await fs.unlink(req.file.path);
        return res.status(400).json({ 
          error: 'Email address already in use by another sales rep' 
        });
      }

      // Create new sales rep
      try {
        salesRep = await PharmaSalesRep.create({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          supplier_id: supplier.id
        });
      } catch (err) {
        await fs.unlink(req.file.path);
        return res.status(500).json({ 
          error: 'Failed to create sales rep account',
          details: err.message 
        });
      }
    }

    // Import products
    const { imported, errors } = await importProductsForSalesRep(records, supplier, salesRep, pharmacy_id);

    await fs.unlink(req.file.path);
    
    res.json({ 
      success: true,
      message: `Products imported successfully by ${salesRep.name} for ${targetPharmacy.name}`,
      imported,
      sales_rep: {
        id: salesRep.id,
        name: salesRep.name,
        email: salesRep.email
      },
      supplier: {
        id: supplier.id,
        name: supplier.name
      },
      target_pharmacy: {
        id: targetPharmacy.id,
        name: targetPharmacy.name
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    await fs.unlink(req.file.path);
    console.error('Error in external CSV import:', err);
    res.status(500).json({ 
      error: 'Failed to import CSV',
      details: err.message 
    });
  }
};

// Helper function to import products for a sales rep
async function importProductsForSalesRep(records, supplier, salesRep, pharmacy_id) {
  let imported = 0;
  let errors = [];

  for (const row of records) {
    try {
      const { brand, name, price, expiry_date } = row;
      
      if (!brand || !name || !price || !expiry_date) {
        errors.push(`Skipping row: missing required fields - ${JSON.stringify(row)}`);
        continue;
      }

      await Product.create({
        supplier_id: supplier.id,
        brand: brand.trim(),
        name: name.trim(),
        price: parseFloat(price),
        expiry_date: new Date(expiry_date),
        pharma_sales_rep_id: salesRep.id
      });
      imported++;
    } catch (err) {
      errors.push(`Error processing row: ${JSON.stringify(row)} - ${err.message}`);
    }
  }

  // Send notifications to users of the specified pharmacy only
  if (imported > 0 && pharmacy_id) {
    try {
      // Get users from the specific pharmacy only
      const users = await User.findAll({
        where: {
          role: ['admin', 'pharmacist'],
          pharmacy_id: pharmacy_id
        }
      });

      console.log(`Found ${users.length} users in pharmacy ${pharmacy_id}:`, users.map(u => ({ id: u.id, name: u.name, role: u.role })));

      if (users.length === 0) {
        console.log(`No admin/pharmacist users found in pharmacy ${pharmacy_id}`);
        return { imported, errors };
      }

      // Create notifications for each user in the target pharmacy
      let notificationsCreated = 0;
      for (const user of users) {
        try {
          await Notification.create({
            recipient_type: 'user',
            recipient_id: user.id,
            type: 'new_products_imported',
            title: 'New Products Imported',
            message: `${salesRep.name} from ${supplier.name} has imported ${imported} new products.`,
            metadata: {
              sales_rep_id: salesRep.id,
              sales_rep_name: salesRep.name,
              supplier_id: supplier.id,
              supplier_name: supplier.name,
              products_count: imported,
              pharmacy_id: pharmacy_id,
              import_date: new Date().toISOString()
            }
          });
          
          notificationsCreated++;
          console.log(`✓ Notification created for user ${user.id} (${user.name})`);
        } catch (userNotificationError) {
          console.error(`✗ Failed to create notification for user ${user.id} (${user.name}):`, userNotificationError.message);
          // Continue with other users even if one fails
        }
      }

      console.log(`Notification creation completed: ${notificationsCreated}/${users.length} notifications sent for pharmacy ${pharmacy_id}`);
    } catch (notificationError) {
      console.error('Error in notification process:', notificationError.message);
      // Don't fail the import if notification creation fails
    }
  }

  return { imported, errors };
}
