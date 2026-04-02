import express from "express";
import { body } from "express-validator";
import {
  createContact,
  deleteContact,
  getContactsByUser,
  updateContact,
} from "../controllers/contactController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const contactValidation = [
  body("userId").notEmpty().withMessage("userId is required"),
  body("name")
    .notEmpty()
    .withMessage("name is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("name must be between 2 and 120 characters"),
  body("email").optional().isEmail().withMessage("email must be valid"),
  body("phone").optional().isString(),
  body("whatsapp").optional().isString(),
  body("notes").optional().isString(),
];

router.post("/", protect, contactValidation, createContact);
router.get("/user/:userId", protect, getContactsByUser);
router.put("/:contactId", protect, updateContact);
router.delete("/:contactId", protect, deleteContact);

export default router;

