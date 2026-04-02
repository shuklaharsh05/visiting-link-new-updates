import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";
import {
  getMyWallet,
  createWalletRechargeOrder,
  verifyWalletRecharge,
} from "../controllers/walletController.js";
import { requireIdempotency } from "../middleware/idempotencyMiddleware.js";

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get("/", getMyWallet);
router.post("/recharge/create-order", requireIdempotency("wallet:recharge:create-order"), createWalletRechargeOrder);
router.post("/recharge/verify", requireIdempotency("wallet:recharge:verify"), verifyWalletRecharge);

export default router;

