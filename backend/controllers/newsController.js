const { News } = require('../models');
const cloudinary = require('cloudinary').v2;
const { Op } = require('sequelize');
const fs = require('fs').promises;

// Get all news articles with filtering and pagination
exports.getAllNews = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      is_feature, 
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filter by category
    if (category) {
      whereClause.category = category;
    }

    // Filter by featured status
    if (is_feature !== undefined) {
      whereClause.is_feature = is_feature === 'true';
    }

    // Search in title and content
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } },
        { summary: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: news } = await News.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: news,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get featured news articles
exports.getFeaturedNews = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const news = await News.findAll({
      where: { is_feature: true },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error fetching featured news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get news by category
exports.getNewsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: news } = await News.findAndCountAll({
      where: { category },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: news,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching news by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single news article by ID
exports.getNewsById = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await News.findByPk(id);
    if (!news) {
      return res.status(404).json({ error: 'News article not found' });
    }

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new news article (Admin only)
exports.createNews = async (req, res) => {
  try {
    const {
      title,
      category,
      content,
      summary,
      is_feature = false
    } = req.body;

    // Validate required fields
    if (!title || !category || !content) {
      return res.status(400).json({ 
        error: 'Title, category, and content are required' 
      });
    }

    // Validate category
    const validCategories = ['Live Healthily', 'Moms and Babies', 'Nutrition', 'Sex Education', 'Beauty', 'Hospitals'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category' 
      });
    }

    let image = null;
    let image_public_id = null;

    // Handle image upload if provided
    if (req.file) {
      try {
        console.log('☁️ Uploading image to Cloudinary...');
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'news',
          resource_type: 'image'
        });
        image = result.secure_url;
        image_public_id = result.public_id;
        console.log('✅ Cloudinary upload successful:', image);
        // Clean up temporary file
        await fs.unlink(req.file.path);
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        // Clean up temporary file on error
        if (req.file) {
          await fs.unlink(req.file.path).catch(() => {});
        }
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }

    const news = await News.create({
      title,
      category,
      content,
      summary,
      is_feature,
      image,
      image_public_id
    });

    res.status(201).json({
      success: true,
      data: news,
      message: 'News article created successfully'
    });
  } catch (error) {
    console.error('Error creating news:', error);
    // Clean up temporary file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update news article (Admin only)
exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      content,
      summary,
      is_feature
    } = req.body;

    const news = await News.findByPk(id);
    if (!news) {
      // Clean up temporary file if exists
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(404).json({ error: 'News article not found' });
    }

    // Validate category if provided
    if (category) {
      const validCategories = ['Live Healthily', 'Moms and Babies', 'Nutrition', 'Sex Education', 'Beauty', 'Hospitals'];
      if (!validCategories.includes(category)) {
        // Clean up temporary file if exists
        if (req.file) {
          await fs.unlink(req.file.path).catch(() => {});
        }
        return res.status(400).json({ 
          error: 'Invalid category' 
        });
      }
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (category) updateData.category = category;
    if (content) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (is_feature !== undefined) updateData.is_feature = is_feature;

    // Handle image upload if provided
    if (req.file) {
      try {
        console.log('☁️ Replacing image in Cloudinary...');
        // Delete old image if exists
        if (news.image_public_id) {
          await cloudinary.uploader.destroy(news.image_public_id);
        }

        // Upload new image
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'news',
          resource_type: 'image'
        });
        updateData.image = result.secure_url;
        updateData.image_public_id = result.public_id;
        console.log('✅ Image replacement successful:', updateData.image);
        // Clean up temporary file
        await fs.unlink(req.file.path);
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        // Clean up temporary file on error
        if (req.file) {
          await fs.unlink(req.file.path).catch(() => {});
        }
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }

    await news.update(updateData);

    res.json({
      success: true,
      data: news,
      message: 'News article updated successfully'
    });
  } catch (error) {
    console.error('Error updating news:', error);
    // Clean up temporary file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete news article (Admin only)
exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await News.findByPk(id);
    if (!news) {
      return res.status(404).json({ error: 'News article not found' });
    }

    // Delete image from Cloudinary if exists
    if (news.image_public_id) {
      try {
        await cloudinary.uploader.destroy(news.image_public_id);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
        // Continue with deletion even if image deletion fails
      }
    }

    await news.destroy();

    res.json({
      success: true,
      message: 'News article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove image from news article (Admin only)
exports.removeNewsImage = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await News.findByPk(id);
    if (!news) {
      return res.status(404).json({ error: 'News article not found' });
    }

    if (!news.image_public_id) {
      return res.status(400).json({ error: 'No image to remove' });
    }

    // Delete image from Cloudinary
    try {
      await cloudinary.uploader.destroy(news.image_public_id);
    } catch (cloudinaryError) {
      console.error('Error deleting image from Cloudinary:', cloudinaryError);
    }

    // Update news record
    await news.update({ 
      image: null, 
      image_public_id: null 
    });

    res.json({
      success: true,
      data: news,
      message: 'Image removed successfully'
    });
  } catch (error) {
    console.error('Error removing image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
