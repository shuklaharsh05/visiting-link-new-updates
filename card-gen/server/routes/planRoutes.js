import express from "express";
import { getPublicPlans } from "../controllers/planController.js";

const router = express.Router();

// Public plans endpoint (no auth required)
router.get("/", getPublicPlans);

export default router;

