import { body, validationResult } from "express-validator";
import Card from "../models/Card.js";
import VcfLead from "../models/VcfLead.js";

export const submitVcfLeadValidators = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("phone").trim().notEmpty().withMessage("Phone is required"),
  body("purpose").optional().trim(),
];

export const submitVcfLead = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { name, phone, purpose } = req.body;
    const card = await Card.findById(req.params.id).select("userId createdBy downloads");

    if (!card) {
      return res.status(404).json({ success: false, error: "Card not found" });
    }

    const ownerUserId = card.userId || card.createdBy || null;

    await VcfLead.create({
      cardId: card._id,
      ownerUserId: ownerUserId || undefined,
      visitorName: name.trim(),
      visitorPhone: String(phone).trim(),
      purpose: typeof purpose === "string" ? purpose.trim() : "",
    });

    const updated = await Card.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true, projection: { downloads: 1 } }
    );

    return res.json({
      success: true,
      downloads: updated?.downloads || 0,
    });
  } catch (err) {
    console.error("submitVcfLead error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getMyVcfLeads = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authorized" });
    }

    const leads = await VcfLead.find({ ownerUserId: userId })
      .populate("cardId", "name categoryId templateId data")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const data = leads.map((l) => {
      const card = l.cardId;
      const cardLabel =
        card?.name ||
        card?.data?.CompanyName ||
        card?.data?.companyName ||
        card?.templateId ||
        "Card";
      return {
        _id: l._id,
        visitorName: l.visitorName,
        visitorPhone: l.visitorPhone,
        purpose: l.purpose || "",
        createdAt: l.createdAt,
        cardId: card?._id,
        cardLabel,
        categoryId: card?.categoryId,
        templateId: card?.templateId,
      };
    });

    return res.json({ success: true, data });
  } catch (err) {
    console.error("getMyVcfLeads error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
