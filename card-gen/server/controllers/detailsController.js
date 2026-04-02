import Details from "../models/Details.js";
import Card from "../models/Card.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";

const validateObjectId = (id) =>
  id &&
  typeof id === "string" &&
  id.length === 24 &&
  /^[0-9a-fA-F]{24}$/.test(id);

// Public: get details form config and current data by token (no auth)
export const getByToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 32) {
      return res.status(400).json({ success: false, error: "Invalid token" });
    }
    const details = await Details.findOne({ detailsToken: token }).populate(
      "cardId",
      "data categoryId templateId"
    );
    if (!details) {
      return res
        .status(404)
        .json({ success: false, error: "Details link not found or expired" });
    }
    const card = details.cardId;
    if (!card) {
      return res.status(404).json({ success: false, error: "Card not found" });
    }
    // Load template schema for this card's category/template
    let fields = [];
    try {
      const category = await Category.findByCategoryId(card.categoryId);
      if (category) {
        const template = category.getTemplate(card.templateId);
        if (template && Array.isArray(template.fields)) {
          fields = template.fields;
        }
      }
    } catch (schemaErr) {
      console.warn(
        "Details getByToken: failed to load template schema:",
        schemaErr
      );
    }

    res.json({
      success: true,
      data: {
        detailsToken: details.detailsToken,
        submittedAt: details.submittedAt,
        appliedAt: details.appliedAt,
        categoryId: card.categoryId,
        detailsData: details.data || {},
        fields,
      },
    });
  } catch (err) {
    console.error("Details getByToken error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Public: submit details by token (no auth)
export const submitByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { data } = req.body || {};
    if (!token || token.length < 32) {
      return res.status(400).json({ success: false, error: "Invalid token" });
    }
    const details = await Details.findOne({ detailsToken: token }).populate(
      "cardId",
      "data categoryId templateId"
    );
    if (!details) {
      return res
        .status(404)
        .json({ success: false, error: "Details link not found or expired" });
    }
    // Load template schema to know which field names are allowed
    let fields = [];
    try {
      const category = await Category.findByCategoryId(
        details.cardId.categoryId
      );
      if (category) {
        const template = category.getTemplate(details.cardId.templateId);
        if (template && Array.isArray(template.fields)) {
          fields = template.fields;
        }
      }
    } catch (schemaErr) {
      console.warn(
        "Details submitByToken: failed to load template schema:",
        schemaErr
      );
    }
    const allowedSet = new Set(fields.map((f) => f.name));
    const sanitized = {};
    if (data && typeof data === "object") {
      for (const key of Object.keys(data)) {
        if (!allowedSet.has(key)) continue;
        // For details we trust the structure coming from the public form.
        // It may include scalars or arrays/objects depending on field.multiple/itemSchema.
        sanitized[key] = data[key];
      }
    }
    details.data = sanitized;
    details.submittedAt = new Date();
    await details.save();
    res.json({
      success: true,
      message: "Details submitted successfully",
      data: { submittedAt: details.submittedAt },
    });
  } catch (err) {
    console.error("Details submitByToken error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Protected: get details for a card (for Apply button)
export const getForCard = async (req, res) => {
  try {
    const cardId = req.params.cardId;
    if (!validateObjectId(cardId)) {
      return res.status(400).json({ success: false, error: "Invalid card ID" });
    }
    const details = await Details.findOne({ cardId });
    if (!details) {
      return res.status(404).json({
        success: false,
        error: "No details link for this card yet",
      });
    }
    res.json({
      success: true,
      data: {
        detailsToken: details.detailsToken,
        data: details.data || {},
        submittedAt: details.submittedAt,
        appliedAt: details.appliedAt,
      },
    });
  } catch (err) {
    console.error("Details getForCard error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Protected: ensure details record exists for card, return details URL
export const ensureToken = async (req, res) => {
  try {
    const cardId = req.params.cardId;
    if (!validateObjectId(cardId)) {
      return res.status(400).json({ success: false, error: "Invalid card ID" });
    }
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ success: false, error: "Card not found" });
    }
    const details = await Details.getOrCreateForCard(cardId);
    const baseUrl =
      process.env.PUBLIC_SITE_URL || "https://www.visitinglink.com";
    const detailsUrl = `${baseUrl}/details/${details.detailsToken}`;
    res.json({
      success: true,
      data: {
        detailsToken: details.detailsToken,
        detailsUrl,
        submittedAt: details.submittedAt,
      },
    });
  } catch (err) {
    console.error("Details ensureToken error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Protected: mark details as applied (optional, for UI state)
export const markApplied = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid details ID" });
    }
    const details = await Details.findById(id);
    if (!details) {
      return res
        .status(404)
        .json({ success: false, error: "Details not found" });
    }
    details.appliedAt = new Date();
    await details.save();
    res.json({ success: true, data: { appliedAt: details.appliedAt } });
  } catch (err) {
    console.error("Details markApplied error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
