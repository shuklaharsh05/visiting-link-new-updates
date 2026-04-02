import express from "express";
import { body } from "express-validator";
import {
  getInquiries,
  getInquiryById,
  createInquiry,
  createInquiryForUser,
  updateInquiry,
  deleteInquiry,
  bulkDeleteInquiries,
  getInquiryStats,
  updatePaymentStatus,
  pinInquiry,
  unpinInquiry,
} from "../controllers/inquiryController.js";
import {
  protect,
  requireSuperAdmin,
  requireAdmin,
  loadInquiryResource,
  allowOwnerOnly,
} from "../middleware/authMiddleware.js";
import { requireIdempotency } from "../middleware/idempotencyMiddleware.js";

const router = express.Router();

// Validation rules for authenticated users (name, email, phone only)
const createInquiryValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Please provide a valid email"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Please provide a valid phone number"),
];

// Inquiry creation route (requires authentication)
router.post("/", protect, requireIdempotency("inquiries:create"), createInquiryValidation, createInquiry);

// Superadmin: create inquiry for a user (by userId)
router.post(
  "/admin/create-for-user",
  protect,
  requireSuperAdmin,
  requireIdempotency("inquiries:create-for-user"),
  createInquiryForUser
);

// Admin/Superadmin: bulk delete inquiries (password required)
router.post("/bulk-delete", protect, requireAdmin, bulkDeleteInquiries);

// Protected routes
router.get("/", protect, getInquiries);
router.get("/stats", protect, requireAdmin, getInquiryStats);
router.post("/:id/pin", protect, pinInquiry);
router.post("/:id/unpin", protect, unpinInquiry);
router.get("/:id", protect, loadInquiryResource, allowOwnerOnly("userId"), getInquiryById);
router.put("/:id", protect, loadInquiryResource, allowOwnerOnly("userId"), updateInquiry);
router.put("/:id/payment-status", protect, requireAdmin, updatePaymentStatus);
router.delete("/:id", protect, loadInquiryResource, allowOwnerOnly("userId"), deleteInquiry);

export default router;
