import express from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  bulkDeleteUsers,
  getUserInquiries,
  getUserStats,
  findOrCreateUser,
  saveCard,
  removeSavedCard,
  getSavedCards,
  getUserAppointments
} from '../controllers/userController.js';
import { protect, requireAdmin, allowSelfOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const createUserValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('businessType')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Business type must be less than 50 characters')
];

const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('businessType')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Business type must be less than 50 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

const findOrCreateUserValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('businessType')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Business type must be less than 50 characters')
];

// Public routes
router.post('/', createUserValidation, createUser);
router.post('/find-or-create', findOrCreateUserValidation, findOrCreateUser);

// Protected routes
router.get('/', protect, requireAdmin, getAllUsers);
router.post('/bulk-delete', protect, requireAdmin, bulkDeleteUsers);
router.get('/:id', protect, allowSelfOrAdmin("id"), getUserById);
router.put('/:id', protect, allowSelfOrAdmin("id"), updateUserValidation, updateUser);
router.delete('/:id', protect, allowSelfOrAdmin("id"), deleteUser);
router.get('/:id/inquiries', protect, allowSelfOrAdmin("id"), getUserInquiries);
router.get('/:id/stats', protect, allowSelfOrAdmin("id"), getUserStats);
router.get('/:id/saved-cards', protect, allowSelfOrAdmin("id"), getSavedCards);
router.get('/:id/appointments', protect, allowSelfOrAdmin("id"), getUserAppointments);
router.post('/:id/save-card', protect, allowSelfOrAdmin("id"), saveCard);
router.delete('/:id/saved-cards/:cardId', protect, allowSelfOrAdmin("id"), removeSavedCard);

export default router;
