import express from "express";
import { registerUser, loginUser, getProfile, adminLogin, setPassword, linkCredentials, mintAuthCode, exchangeAuthCode, googleAuth } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { loginLimiter } from "../middleware/securityMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/set-password", setPassword);
router.post("/link-credentials", protect, linkCredentials);
router.post("/admin-login", loginLimiter, adminLogin);
router.get("/profile", protect, getProfile);
// Short-lived auth code flow
router.post("/mint-code", protect, mintAuthCode);
router.post("/exchange-code", exchangeAuthCode);
// Google OAuth
router.post("/google", googleAuth);

export default router;
