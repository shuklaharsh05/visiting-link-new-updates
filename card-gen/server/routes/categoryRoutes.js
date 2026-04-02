import express from 'express';
import { getCategories, getCategoryById, getTemplatesByCategory, getTemplate, validateCardData, getCardsByCategory, getCardsByTemplate, getTemplateStats } from '../controllers/categoryController.js';

const router = express.Router();

// Get all active categories
    router.get('/', getCategories);

// Get category by ID
router.get('/:categoryId', getCategoryById);

// Get templates by category
router.get('/:categoryId/templates', getTemplatesByCategory);

// Get specific template
router.get('/:categoryId/templates/:templateId', getTemplate);

// Validate card data against template
router.post('/:categoryId/templates/:templateId/validate', validateCardData);

// Get cards by category
router.get('/:categoryId/cards', getCardsByCategory);

// Get cards by template
router.get('/:categoryId/templates/:templateId/cards', getCardsByTemplate);

// Get template statistics
router.get('/:categoryId/templates/:templateId/stats', getTemplateStats);

export default router;
