import express from "express";
import {
  getCoupons,
  createCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";
import { authenticateToken, requireSuperAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// All coupon routes require admin-panel auth & superadmin
router.use(authenticateToken);
router.use(requireSuperAdmin);

router.get("/", getCoupons);
router.post("/", createCoupon);
router.delete("/:id", deleteCoupon);

export default router;

