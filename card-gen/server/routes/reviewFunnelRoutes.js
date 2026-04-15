import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  submitRating,
  submitNegativeFeedback,
  trackGoogleClick,
  getCardReviewFunnel,
  getCardNegativeFeedback,
} from "../controllers/reviewFunnelController.js";

const router = express.Router();

// Public endpoints (card viewers)
router.post("/:cardId/rating", submitRating);
router.post("/:cardId/feedback", submitNegativeFeedback);
router.post("/:cardId/google-click", trackGoogleClick);

// Protected endpoints (card owner/admin panel)
router.get("/:cardId/stats", protect, getCardReviewFunnel);
router.get("/:cardId/feedbacks", protect, getCardNegativeFeedback);

export default router;

