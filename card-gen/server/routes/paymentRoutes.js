import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handlePaymentWebhook,
  getPaymentStatus,
  createUserPlanOrder,
  verifyUserPlanPayment,
  previewUserPlanPrice,
  createTemplateOrder,
  verifyTemplatePayment,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireIdempotency } from "../middleware/idempotencyMiddleware.js";
import { paymentVerifyLimiter, webhookLimiter } from "../middleware/securityMiddleware.js";

const router = express.Router();

// Create payment order for inquiry (protected - user must be authenticated)
router.post('/create-order', protect, requireIdempotency("payment:create-order"), createPaymentOrder);

// Verify payment for inquiry (protected - called after Razorpay checkout)
router.post('/verify', protect, paymentVerifyLimiter, requireIdempotency("payment:verify"), verifyPayment);

// Create payment order for user plan (basic/pro)
router.post('/user-plan/create-order', protect, requireIdempotency("payment:user-plan:create-order"), createUserPlanOrder);

// Verify user plan payment
router.post('/user-plan/verify', protect, paymentVerifyLimiter, requireIdempotency("payment:user-plan:verify"), verifyUserPlanPayment);

// Preview user plan price (no Razorpay order created)
router.post('/user-plan/preview', protect, previewUserPlanPrice);

// Template purchase payments (per-template)
router.post('/template/create-order', protect, requireIdempotency("payment:template:create-order"), createTemplateOrder);
router.post('/template/verify', protect, paymentVerifyLimiter, requireIdempotency("payment:template:verify"), verifyTemplatePayment);

// Get payment status for an inquiry (protected)
router.get('/status/:inquiryId', protect, getPaymentStatus);

// Webhook (public - Razorpay calls this)
// Note: Razorpay webhooks don't require authentication, but we verify the signature
router.post('/webhook', webhookLimiter, handlePaymentWebhook);

export default router;

