import Category from '../models/Category.js';
import Card from '../models/Card.js';

// Get all active categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.getActiveCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findByCategoryId(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

// Get templates by category
export const getTemplatesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { type } = req.query; // 'static', 'custom', or undefined for all
    
    const category = await Category.findByCategoryId(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    let templates = category.templates.filter(template => template.isActive);
    
    if (type) {
      templates = templates.filter(template => template.type === type);
    }

    res.json({
      success: true,
      data: {
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        templates: templates
      }
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
};

// Get specific template
export const getTemplate = async (req, res) => {
  try {
    const { categoryId, templateId } = req.params;
    
    const category = await Category.findByCategoryId(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const template = category.getTemplate(templateId);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: {
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        template: template
      }
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
      error: error.message
    });
  }
};

// Validate card data against template
export const validateCardData = async (req, res) => {
  try {
    const { categoryId, templateId } = req.params;
    const { cardData } = req.body;
    
    const category = await Category.findByCategoryId(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const validation = category.validateTemplateData(templateId, cardData);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating card data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate card data',
      error: error.message
    });
  }
};

// Get cards by category
export const getCardsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { status, limit = 10, page = 1 } = req.query;
    
    const query = { categoryId };
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    const cards = await Card.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Card.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        cards,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching cards by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cards',
      error: error.message
    });
  }
};

// Get cards by template
export const getCardsByTemplate = async (req, res) => {
  try {
    const { categoryId, templateId } = req.params;
    const { status, limit = 10, page = 1 } = req.query;
    
    const query = { categoryId, templateId };
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    const cards = await Card.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Card.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        cards,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching cards by template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cards',
      error: error.message
    });
  }
};

// Get template statistics
export const getTemplateStats = async (req, res) => {
  try {
    const { categoryId, templateId } = req.params;
    
    const totalCards = await Card.countDocuments({ categoryId, templateId });
    const publishedCards = await Card.countDocuments({ categoryId, templateId, status: 'Published' });
    const draftCards = await Card.countDocuments({ categoryId, templateId, status: 'Draft' });
    const archivedCards = await Card.countDocuments({ categoryId, templateId, status: 'Archived' });
    
    res.json({
      success: true,
      data: {
        total: totalCards,
        published: publishedCards,
        draft: draftCards,
        archived: archivedCards
      }
    });
  } catch (error) {
    console.error('Error fetching template stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template statistics',
      error: error.message
    });
  }
};

export default {
  getCategories,
  getCategoryById,
  getTemplatesByCategory,
  getTemplate,
  validateCardData,
  getCardsByCategory,
  getCardsByTemplate,
  getTemplateStats
};
