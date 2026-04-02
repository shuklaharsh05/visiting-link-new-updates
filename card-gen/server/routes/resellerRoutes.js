import express from "express";
import { body } from "express-validator";
import { authenticateToken, requireAdmin, requireSuperAdmin } from "../middleware/authMiddleware.js";
import {
  adminCreateUser,
  adminGetUser,
  adminListUsers,
} from "../controllers/adminUserController.js";
import {
  adminCreateCardForUser,
  adminDeleteCardForUser,
  adminGetStats,
  adminListCardsForUser,
  getSuperadminDashboardStats,
  getSuperadminCardsBreakdown,
  getSuperadminUsersBreakdown,
  getSuperadminRevenueBreakdown,
} from "../controllers/resellerCardController.js";

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

const createUserValidation = [
  body("name").trim().notEmpty().isLength({ min: 2, max: 50 }),
  body("phone").trim().notEmpty(),
  body("password").isLength({ min: 6 }),
  body("email").optional().isEmail().normalizeEmail(),
  body("businessType").optional().trim().isLength({ max: 50 }),
];

router.get("/users", adminListUsers);
router.post("/users", createUserValidation, adminCreateUser);
router.get("/users/:userId", adminGetUser);
router.get("/users/:userId/cards", adminListCardsForUser);
router.post("/users/:userId/cards", adminCreateCardForUser);
router.delete("/users/:userId/cards/:cardId", adminDeleteCardForUser);
router.get("/stats", adminGetStats);
router.get("/dashboard/stats", requireSuperAdmin, getSuperadminDashboardStats);
router.get("/dashboard/cards-breakdown", requireSuperAdmin, getSuperadminCardsBreakdown);
router.get("/dashboard/users-breakdown", requireSuperAdmin, getSuperadminUsersBreakdown);
router.get("/dashboard/revenue-breakdown", requireSuperAdmin, getSuperadminRevenueBreakdown);

export default router;

