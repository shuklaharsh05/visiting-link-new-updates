import express from "express";
import {
  getByToken,
  submitByToken,
  getForCard,
  ensureToken,
  markApplied,
} from "../controllers/detailsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public (no auth) - must be before protected routes
router.get("/by-token/:token", getByToken);
router.post("/submit-by-token/:token", submitByToken);

// Protected
router.get("/for-card/:cardId", protect, getForCard);
router.post("/ensure-token/:cardId", protect, ensureToken);
router.patch("/:id/applied", protect, markApplied);

export default router;
