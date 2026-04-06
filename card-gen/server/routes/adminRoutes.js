import express from 'express';
import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  updateAdminPassword,
  deleteAdmin,
  assignInquiry,
  getAdminInquiries,
  getCalendarStats
} from '../controllers/adminController.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// Specific routes must be defined before parameterized routes
router.get('/calendar-stats', requireSuperAdmin, getCalendarStats);
router.get('/inquiries/:adminName', requireSuperAdmin, getAdminInquiries);
router.put('/assign/:inquiryId', requireSuperAdmin, assignInquiry);

// Admin management routes (superadmin only)
router.get('/', requireSuperAdmin, getAllAdmins);
router.get('/:id', requireSuperAdmin, getAdminById);
router.post('/', requireSuperAdmin, createAdmin);
router.put('/:id/password', requireSuperAdmin, updateAdminPassword);
router.put('/:id', requireSuperAdmin, updateAdmin);
router.delete('/:id', requireSuperAdmin, deleteAdmin);

export default router;
