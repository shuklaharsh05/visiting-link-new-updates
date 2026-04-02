import express from 'express';
import { body } from 'express-validator';
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByUser,
  getAppointmentsByCard,
  getAppointmentStats,
  getUserAppointmentSummary
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const createAppointmentValidation = [
  body('cardId')
    .notEmpty()
    .withMessage('Card ID is required')
    .isMongoId()
    .withMessage('Invalid card ID'),
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
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Message must be between 10 and 500 characters'),
  body('appointmentDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid appointment date'),
  body('appointmentTime')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Appointment time must be less than 20 characters')
];

const updateAppointmentValidation = [
  body('status')
    .optional()
    .isIn(['Pending', 'Confirmed', 'Cancelled', 'Completed'])
    .withMessage('Status must be one of: Pending, Confirmed, Cancelled, Completed'),
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes must be less than 1000 characters'),
  body('appointmentDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid appointment date'),
  body('appointmentTime')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Appointment time must be less than 20 characters'),
  body('response')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Response must be less than 1000 characters'),
  body('responded')
    .optional()
    .isBoolean()
    .withMessage('Responded must be a boolean value')
];

// Public routes
router.post('/', createAppointmentValidation, createAppointment);

// Protected routes
router.get('/', protect, getAllAppointments);
router.get('/stats', protect, getAppointmentStats);
router.get('/user/:userId', protect, getAppointmentsByUser);
router.get('/user/:userId/summary', protect, getUserAppointmentSummary);
router.get('/card/:cardId', protect, getAppointmentsByCard);
router.get('/:id', protect, getAppointmentById);
router.put('/:id', protect, updateAppointmentValidation, updateAppointment);
router.delete('/:id', protect, deleteAppointment);

export default router;
