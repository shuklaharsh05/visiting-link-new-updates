import express from "express";
import {
  createSubmission,
  recordBookMyShowClick,
  recordRazorpayClick,
} from "../controllers/expoController.js";

const router = express.Router();

router.post("/submissions", createSubmission);
router.post("/clicks/bookmyshow", recordBookMyShowClick);
router.post("/clicks/razorpay", recordRazorpayClick);

export default router;
