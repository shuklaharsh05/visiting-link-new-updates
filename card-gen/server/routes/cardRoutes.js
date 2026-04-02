import express from "express";
import {
  getAllCards,
  getMyCards,
  getCardById,
  getCardBySubmissionId,
  getCardByClientId,
  createCard,
  updateCard,
  deleteCard,
  toggleCardPublic,
  getCardAnalytics,
  updatePaymentStatus,
  updateViewCount,
  updateShareCount,
  updateDownloadCount,
  updateLikeCount,
  trackShopLinkClick,
  getCataloguePdf,
  getCataloguePdfByUrl,
} from "../controllers/cardController.js";
import {
  submitVcfLead,
  getMyVcfLeads,
  submitVcfLeadValidators,
} from "../controllers/vcfLeadController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";
import { requireIdempotency } from "../middleware/idempotencyMiddleware.js";

const router = express.Router();

// Protected routes (auth required)
router.get("/my", protect, getMyCards); // Get cards created by the authenticated user
router.get("/vcf-leads/my", protect, getMyVcfLeads);

// Public routes (no auth required)
router.get("/", getAllCards); // Get all admin-created cards or filtered cards
router.get("/catalogue", getCataloguePdfByUrl); // Stream catalogue PDF by URL (preview/unsaved; Cloudinary only)
router.get("/submission/:submissionId", optionalAuth, getCardBySubmissionId); // Get card by submission ID
router.get("/client/:clientId", optionalAuth, getCardByClientId); // Get card by client ID
router.post("/:id/vcf-lead", submitVcfLeadValidators, submitVcfLead);
router.get("/:id/catalogue", getCataloguePdf); // Stream catalogue PDF by card ID
router.get("/:id", optionalAuth, getCardById); // Get specific card by ID
router.post("/:id/view", updateViewCount); // Update view count for a card
router.post("/:id/share", updateShareCount); // Update share count for a card
router.post("/:id/download", updateDownloadCount); // Update download (vcf) count for a card
router.post("/:id/like", updateLikeCount); // Update like count for a card
router.post("/:id/shoplink-click", trackShopLinkClick); // Track shop link click

router.post("/", protect, requireIdempotency("cards:create"), createCard); // Create new card
router.put("/:id", protect, updateCard); // Update card
router.delete("/:id", protect, deleteCard); // Delete card
router.patch("/:id/toggle-public", protect, toggleCardPublic); // Toggle public status
router.patch("/:cardId/payment-status", protect, updatePaymentStatus); // Update payment status
router.get("/:id/analytics", protect, getCardAnalytics); // Get card analytics

export default router;
