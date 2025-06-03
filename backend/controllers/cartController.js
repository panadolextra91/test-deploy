const { Cart, CartItem, Medicine, Customer } = require('../models');
const { Op } = require('sequelize');

// Get customer's cart with all items
exports.getCart = async (req, res) => {
  try {
    const customerId = req.user.id; // Assuming customer ID comes from auth middleware

    // Find or create cart for customer
    let cart = await Cart.findOne({
      where: { customer_id: customerId },
      include: [{
        model: CartItem,
        as: 'items',
        include: [{
          model: Medicine,
          as: 'medicine',
          attributes: ['id', 'name', 'price', 'quantity', 'description', 'image']
        }]
      }]
    });

    if (!cart) {
      // Create new cart if doesn't exist
      cart = await Cart.create({ customer_id: customerId });
      cart.items = [];
    }

    // Calculate totals
    const totalItems = cart.items.length;
    const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    const selectedAmount = cart.items
      .filter(item => item.is_selected)
      .reduce((sum, item) => sum + parseFloat(item.total_price), 0);

    res.json({
      cart: {
        id: cart.id,
        customer_id: cart.customer_id,
        items: cart.items,
        summary: {
          total_items: totalItems,
          total_quantity: totalQuantity,
          total_amount: totalAmount.toFixed(2),
          selected_amount: selectedAmount.toFixed(2)
        },
        created_at: cart.created_at,
        updated_at: cart.updated_at
      }
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { medicine_id, quantity = 1 } = req.body;

    if (!medicine_id) {
      return res.status(400).json({ error: 'Medicine ID is required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    // Check if medicine exists and has stock
    const medicine = await Medicine.findByPk(medicine_id);
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    if (medicine.quantity < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock', 
        available_stock: medicine.quantity 
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ where: { customer_id: customerId } });
    if (!cart) {
      cart = await Cart.create({ customer_id: customerId });
    }

    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      where: { cart_id: cart.id, medicine_id: medicine_id }
    });

    if (cartItem) {
      // Update existing item quantity
      const newQuantity = cartItem.quantity + quantity;
      
      if (medicine.quantity < newQuantity) {
        return res.status(400).json({ 
          error: 'Insufficient stock for total quantity', 
          current_in_cart: cartItem.quantity,
          available_stock: medicine.quantity 
        });
      }

      cartItem.quantity = newQuantity;
      cartItem.unit_price = medicine.price; // Update price in case it changed
      await cartItem.save(); // total_price will be auto-calculated by hook

      res.json({
        message: 'Cart item quantity updated',
        cart_item: cartItem
      });
    } else {
      // Create new cart item
      cartItem = await CartItem.create({
        cart_id: cart.id,
        medicine_id: medicine_id,
        quantity: quantity,
        unit_price: medicine.price,
        total_price: quantity * medicine.price, // Explicit calculation as backup
        is_selected: true
      });

      // Include medicine details in response
      const cartItemWithMedicine = await CartItem.findByPk(cartItem.id, {
        include: [{
          model: Medicine,
          as: 'medicine',
          attributes: ['id', 'name', 'price', 'quantity', 'description']
        }]
      });

      res.status(201).json({
        message: 'Item added to cart',
        cart_item: cartItemWithMedicine
      });
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params; // cart item id
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    // Find cart item and verify ownership
    const cartItem = await CartItem.findOne({
      where: { id: id },
      include: [{
        model: Cart,
        as: 'cart',
        where: { customer_id: customerId }
      }, {
        model: Medicine,
        as: 'medicine'
      }]
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Check stock availability
    if (cartItem.medicine.quantity < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock', 
        available_stock: cartItem.medicine.quantity 
      });
    }

    // Update quantity
    cartItem.quantity = quantity;
    cartItem.unit_price = cartItem.medicine.price; // Update price in case it changed
    await cartItem.save(); // total_price will be auto-calculated

    res.json({
      message: 'Cart item updated',
      cart_item: cartItem
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
};

// Toggle cart item selection for checkout
exports.toggleItemSelection = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params; // cart item id
    const { is_selected } = req.body;

    if (typeof is_selected !== 'boolean') {
      return res.status(400).json({ error: 'is_selected must be a boolean value' });
    }

    // Find cart item and verify ownership
    const cartItem = await CartItem.findOne({
      where: { id: id },
      include: [{
        model: Cart,
        as: 'cart',
        where: { customer_id: customerId }
      }]
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Update selection
    cartItem.is_selected = is_selected;
    await cartItem.save();

    res.json({
      message: `Item ${is_selected ? 'selected' : 'unselected'} for checkout`,
      cart_item: cartItem
    });
  } catch (error) {
    console.error('Error toggling item selection:', error);
    res.status(500).json({ error: 'Failed to toggle item selection' });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params; // cart item id

    // Find cart item and verify ownership
    const cartItem = await CartItem.findOne({
      where: { id: id },
      include: [{
        model: Cart,
        as: 'cart',
        where: { customer_id: customerId }
      }]
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await cartItem.destroy();

    res.json({
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const customerId = req.user.id;

    const cart = await Cart.findOne({ where: { customer_id: customerId } });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Delete all cart items
    await CartItem.destroy({ where: { cart_id: cart.id } });

    res.json({
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};

// Get selected items for checkout
exports.getSelectedItems = async (req, res) => {
  try {
    const customerId = req.user.id;

    const cart = await Cart.findOne({
      where: { customer_id: customerId },
      include: [{
        model: CartItem,
        as: 'items',
        where: { is_selected: true },
        include: [{
          model: Medicine,
          as: 'medicine',
          attributes: ['id', 'name', 'price', 'quantity', 'description']
        }]
      }]
    });

    if (!cart || !cart.items.length) {
      return res.status(400).json({ error: 'No items selected for checkout' });
    }

    // Verify stock availability for all selected items
    const stockIssues = [];
    for (const item of cart.items) {
      if (item.medicine.quantity < item.quantity) {
        stockIssues.push({
          medicine_name: item.medicine.name,
          requested: item.quantity,
          available: item.medicine.quantity
        });
      }
    }

    if (stockIssues.length > 0) {
      return res.status(400).json({ 
        error: 'Stock issues found',
        stock_issues: stockIssues
      });
    }

    // Calculate totals for selected items
    const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);

    res.json({
      selected_items: cart.items,
      summary: {
        total_items: cart.items.length,
        total_quantity: totalQuantity,
        total_amount: totalAmount.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error getting selected items:', error);
    res.status(500).json({ error: 'Failed to get selected items' });
  }
};

// Remove selected items after successful checkout
exports.removeSelectedItems = async (req, res) => {
  try {
    const customerId = req.user.id;

    const cart = await Cart.findOne({ where: { customer_id: customerId } });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Delete selected items
    const deletedCount = await CartItem.destroy({
      where: { 
        cart_id: cart.id,
        is_selected: true
      }
    });

    res.json({
      message: 'Selected items removed from cart',
      removed_count: deletedCount
    });
  } catch (error) {
    console.error('Error removing selected items:', error);
    res.status(500).json({ error: 'Failed to remove selected items' });
  }
};

// Get cart item count
exports.getCartItemCount = async (req, res) => {
  try {
    const customerId = req.user.id;

    // Find customer's cart
    const cart = await Cart.findOne({
      where: { customer_id: customerId },
      include: [{
        model: CartItem,
        as: 'items',
        attributes: ['quantity']
      }]
    });

    if (!cart) {
      return res.json({
        total_items: 0,
        total_quantity: 0
      });
    }

    // Calculate counts
    const totalItems = cart.items.length;
    const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      total_items: totalItems,
      total_quantity: totalQuantity
    });
  } catch (error) {
    console.error('Error getting cart item count:', error);
    res.status(500).json({ error: 'Failed to get cart item count' });
  }
};

// Checkout selected items - Create order from cart
exports.checkout = async (req, res) => {
  const { pharmacy_id, shipping_address, note } = req.body;
  const customerId = req.user.id;
  
  // Use sequelize transaction for data consistency
  const sequelize = require('../config/database');
  const transaction = await sequelize.transaction();

  try {
    // Validate required fields
    if (!pharmacy_id || !shipping_address) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Pharmacy ID and shipping address are required' 
      });
    }

    // Get customer's cart with selected items
    const cart = await Cart.findOne({
      where: { customer_id: customerId },
      include: [{
        model: CartItem,
        as: 'items',
        where: { is_selected: true },
        include: [{
          model: Medicine,
          as: 'medicine',
          attributes: ['id', 'name', 'price', 'quantity', 'description']
        }]
      }],
      transaction
    });

    if (!cart || !cart.items.length) {
      await transaction.rollback();
      return res.status(400).json({ error: 'No items selected for checkout' });
    }

    // Verify stock availability for all selected items
    const stockIssues = [];
    for (const item of cart.items) {
      if (item.medicine.quantity < item.quantity) {
        stockIssues.push({
          medicine_name: item.medicine.name,
          requested: item.quantity,
          available: item.medicine.quantity
        });
      }
    }

    if (stockIssues.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Stock issues found',
        stock_issues: stockIssues
      });
    }

    // Calculate total amount
    const totalAmount = cart.items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);

    // Create order
    const { Order, OrderItem } = require('../models');
    const order = await Order.create({
      customer_id: customerId,
      pharmacy_id: pharmacy_id,
      status: 'pending',
      total_amount: totalAmount,
      shipping_address: shipping_address,
      note: note || null
    }, { transaction });

    // Create order items from cart items
    const orderItems = [];
    for (const cartItem of cart.items) {
      const orderItem = await OrderItem.create({
        order_id: order.id,
        medicine_id: cartItem.medicine_id,
        quantity: cartItem.quantity,
        price: cartItem.unit_price // Use the price from when item was added to cart
      }, { transaction });
      orderItems.push(orderItem);
    }

    // Remove selected items from cart
    await CartItem.destroy({
      where: { 
        cart_id: cart.id,
        is_selected: true
      },
      transaction
    });

    await transaction.commit();

    // Fetch complete order with associations for response
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: require('../models').Customer,
          as: 'customer'
        },
        {
          model: require('../models').Pharmacy,
          as: 'pharmacy'
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Medicine,
            as: 'medicine'
          }]
        }
      ]
    });

    res.status(201).json({
      message: 'Checkout successful',
      order: completeOrder,
      summary: {
        order_id: order.id,
        total_items: cart.items.length,
        total_amount: totalAmount.toFixed(2),
        status: 'pending'
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error during checkout:', error);
    res.status(500).json({ error: 'Checkout failed' });
  }
}; 