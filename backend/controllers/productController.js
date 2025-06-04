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
          as: 'supplier',
          attributes: ['id', 'name', 'contact_info'] 
        },
        {
          model: PharmaSalesRep,
          as: 'salesRep',
          attributes: ['id', 'name', 'email'],
          required: false
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
      include: [{ 
        model: Supplier, 
        as: 'supplier',
        attributes: ['id', 'name', 'contact_info'] 
      },
      {
        model: PharmaSalesRep,
        as: 'salesRep',
        attributes: ['id', 'name', 'email'],
        required: false
      }
    ]
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

    if (records.length === 0) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    // Check for missing suppliers and sales reps before processing
    const missingSuppliers = new Set();
    const missingSalesReps = new Set();
    
    for (const row of records) {
      const { supplierName, pharmaSalesRepName } = row;
      
      if (supplierName && supplierName.trim()) {
        const supplier = await Supplier.findOne({ 
          where: { name: supplierName.trim() }
        });
        if (!supplier) {
          missingSuppliers.add(supplierName.trim());
        } else if (pharmaSalesRepName && pharmaSalesRepName.trim()) {
          const salesRep = await PharmaSalesRep.findOne({
            where: { 
              name: pharmaSalesRepName.trim(),
              supplier_id: supplier.id 
            }
          });
          if (!salesRep) {
            missingSalesReps.add(`${pharmaSalesRepName.trim()} (for ${supplierName.trim()})`);
          }
        }
      }
    }

    // If there are missing entities, provide guidance
    if (missingSuppliers.size > 0 || missingSalesReps.size > 0) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        error: 'Missing suppliers and/or sales representatives found in CSV',
        missing_suppliers: Array.from(missingSuppliers),
        missing_sales_reps: Array.from(missingSalesReps),
        guidance: {
          message: 'Please create the missing suppliers and sales representatives before importing, or use the external import endpoint',
          options: [
            'Create missing suppliers manually in the system first',
            'Create missing sales representatives manually in the system first',
            'Use POST /api/products/import-external for automatic creation (external sales reps only)'
          ]
        }
      });
    }

    let imported = 0;
    let errors = [];

    for (const row of records) {
      try {
        const { supplierName, brand, name, price, expiry_date, pharmaSalesRepName } = row;
        
        if (!supplierName || !brand || !name || !price || !expiry_date) {
          errors.push(`Skipping row: missing required fields - ${JSON.stringify(row)}`);
          continue;
        }
        
        // Find supplier
        let supplier = await Supplier.findOne({ 
          where: { 
            name: supplierName.trim() 
          }
        });
        
        if (!supplier) {
          errors.push(`Supplier not found: ${supplierName}. Please create this supplier first or provide supplier details.`);
          continue;
        }

        // Find sales rep
        let pharma_sales_rep_id = null;
        if (pharmaSalesRepName && pharmaSalesRepName.trim()) {
          const salesRep = await PharmaSalesRep.findOne({ 
            where: { 
              name: pharmaSalesRepName.trim(),
              supplier_id: supplier.id 
            }
          });
          
          if (!salesRep) {
            errors.push(`Sales rep not found: ${pharmaSalesRepName} for supplier ${supplierName}. Please create this sales rep first or provide sales rep details.`);
            // Continue without sales rep (product will still be created)
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
      success: true,
      imported,
      summary: {
        products_imported: imported,
        total_errors: errors.length
      },
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

    const user = await User.findByPk(req.user.id, { 
      include: [{ 
        model: Pharmacy, 
        as: 'pharmacy',
        attributes: ['id', 'name', 'address'] 
      }] 
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const productIds = items.map(item => item.id);
    const quantityMap = Object.fromEntries(items.map(item => [item.id, item.quantity]));

    const products = await Product.findAll({
      where: { id: productIds },
      include: [
        { 
          model: Supplier, 
          as: 'supplier',
          attributes: ['id', 'name', 'contact_info'] 
        },
        { 
          model: PharmaSalesRep, 
          as: 'salesRep',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    if (!products.length) return res.status(404).json({ error: 'No matching products found' });

    const bySupplier = products.reduce((map, product) => {
      const sup = product.supplier; // Use the alias 'supplier' instead of 'Supplier'
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
    const emailDetails = [];
    
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

      // Get unique sales rep details for response
      const salesRepsDetails = [...new Map(items
        .filter(item => item.salesRep)
        .map(item => [item.salesRep.id, {
          id: item.salesRep.id,
          name: item.salesRep.name,
          email: item.salesRep.email
        }])
      ).values()];

      await transporter.sendMail({
        from: process.env.SMTP_USER || 'webappanhthu@gmail.com',
        to: supplier.contact_info,
        cc: [user.email, ...salesRepEmails].filter(Boolean),
        subject: `Order Request from ${user.pharmacy.name}`,
        html
      });

      sentTo.push(supplier.contact_info);
      emailDetails.push({
        supplier: {
          id: supplier.id,
          name: supplier.name,
          email: supplier.contact_info
        },
        items_count: items.length,
        total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        cc_emails: {
          requester: user.email,
          sales_reps: salesRepsDetails
        }
      });
    }

    res.json({ 
      success: true, 
      emailedTo: sentTo,
      email_details: emailDetails,
      summary: {
        total_suppliers_contacted: emailDetails.length,
        total_products_ordered: products.length,
        requester: {
          name: user.name,
          email: user.email,
          role: user.role
        },
        pharmacy: {
          name: user.pharmacy.name,
          address: user.pharmacy.address
        }
      }
    });
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
      include: [{ 
        model: Supplier, 
        as: 'supplier',
        attributes: ['id', 'name'] 
      },
      {
        model: PharmaSalesRep,
        as: 'salesRep',
        attributes: ['id', 'name', 'email'],
        required: false
      }
    ],
      order: [['created_at', 'DESC']]
    });

    res.json(products);
  } catch (err) {
    console.error('Error filtering products:', err);
    res.status(500).json({ error: 'Failed to filter products' });
  }
};

// 6) External CSV import for authenticated pharma sales reps
exports.importCsvExternal = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });
  
  try {
    // Get authenticated sales rep information
    const salesRepId = req.salesRep.id;
    const salesRep = await PharmaSalesRep.findByPk(salesRepId, {
      include: [{
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'name', 'contact_info', 'address']
      }]
    });

    if (!salesRep) {
      await fs.unlink(req.file.path);
      return res.status(404).json({ error: 'Sales rep not found' });
    }

    // Use single pharmacy (ID = 1) approach
    const pharmacy_id = 1;
    
    // Validate pharmacy exists
    const targetPharmacy = await Pharmacy.findByPk(pharmacy_id);
    if (!targetPharmacy) {
      await fs.unlink(req.file.path);
      return res.status(404).json({ 
        error: 'Pharmacy not found',
        message: 'Default pharmacy not configured in the system'
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

    // Validate CSV format - check if it has required columns
    const firstRow = records[0];
    const requiredColumns = ['brand', 'name', 'price', 'expiry_date'];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ 
        error: 'CSV missing required columns',
        missing_columns: missingColumns,
        required_columns: requiredColumns,
        found_columns: Object.keys(firstRow)
      });
    }

    // Import products using the authenticated sales rep's information
    const { imported, errors } = await importProductsForSalesRep(
      records, 
      salesRep.supplier, 
      salesRep, 
      pharmacy_id
    );

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
        id: salesRep.supplier.id,
        name: salesRep.supplier.name,
        contact_info: salesRep.supplier.contact_info
      },
      target_pharmacy: {
        id: targetPharmacy.id,
        name: targetPharmacy.name
      },
      summary: {
        total_products_imported: imported,
        total_errors: errors.length,
        import_date: new Date().toISOString()
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
