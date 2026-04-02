import Card from "../models/Card.js";
import { generateQR } from "../utils/generateQR.js";
import { dataValidator } from "../utils/dataValidation.js";
import fetch from "node-fetch";

const isAdminRequest = (req) =>
  req?.user?.role === "admin" || req?.user?.role === "superadmin";

const getRequestUserId = (req) => String(req?.user?._id || req?.user?.id || "");

const getActorRole = (req) => {
  const role = req?.user?.role;
  if (role === "superadmin") return "superadmin";
  if (role === "admin") return "admin";
  return "user";
};

const canManageCard = (req, card) => {
  if (!card) return false;
  if (isAdminRequest(req)) return true;
  const uid = getRequestUserId(req);
  // Self-serve ownership
  if (card.createdBy && String(card.createdBy) === uid) return true;
  // Reseller/superadmin-created ownership (owner user)
  if (card.userId && String(card.userId) === uid) return true;
  return false;
};

const canViewCard = (req, card) => {
  if (!card) return false;
  if (card.isPublic) return true;
  if (isAdminRequest(req)) return true;
  const uid = getRequestUserId(req);
  if (!uid) return false;
  return (
    (card.createdBy && String(card.createdBy) === uid) ||
    (card.userId && String(card.userId) === uid)
  );
};

// Get all cards (admin/marketing catalogue - does NOT return user self-serve cards)
export const getAllCards = async (req, res) => {
  try {
    const { status, isPublic } = req.query;
    const filter = { adminId: "admin" }; // Only show admin-created cards for catalogue

    if (status) filter.status = status;
    if (isPublic !== undefined) filter.isPublic = isPublic === "true";

    const cards = await Card.find(filter)
      .populate("clientId")
      .sort({ updatedAt: -1 });

    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get cards created by the authenticated user (self-serve cards)
export const getMyCards = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    const { templateId } = req.query || {};
    if (!userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const filter = {
      $or: [{ createdBy: userId }, { userId: userId }],
    };
    if (templateId) {
      filter.templateId = String(templateId);
    }

    const cards = await Card.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: cards,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get card by ID (public or private)
export const getCardById = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ error: "Card not found" });
    const uid = String(req?.user?._id || req?.user?.id || "");
    const isOwner =
      (card.createdBy && String(card.createdBy) === uid) ||
      (card.userId && String(card.userId) === uid);
    const isAdmin = req?.user?.role === "admin" || req?.user?.role === "superadmin";
    if (!card.isPublic && !isOwner && !isAdmin) {
      return res.status(403).json({ error: "Card is private" });
    }

    // Note: view count is handled exclusively by the /:id/view endpoint to avoid race conditions

    // Generate shareable link and QR dynamically
    const frontendUrl = "https://teamserver.cloud";
    const shareableLink =
      card.shareableLink || `${frontendUrl}/cards/${card._id}`;
    const qrCode = await generateQR(shareableLink);

    res.json({
      card,
      shareableLink,
      qrCode,
      publicUrl: card.publicUrl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get card by submission ID (for directory integration)
export const getCardBySubmissionId = async (req, res) => {
  try {
    const { submissionId } = req.params;
    // console.log("Looking for card with submissionId:", submissionId);

    const card = await Card.findOne({ submissionId }).populate("submissionId");
    // console.log("Found card:", card ? "Yes" : "No");

    if (!card) {
      // console.log("No card found for submissionId:", submissionId);
      return res
        .status(404)
        .json({ error: "No customized card found for this submission" });
    }

    if (!canViewCard(req, card)) {
      return res.status(403).json({ error: "Card is private" });
    }
    res.json(card);
  } catch (err) {
    console.error("Error in getCardBySubmissionId:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get card by client ID (for inquiry integration)
export const getCardByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;
    // console.log("Looking for card with clientId:", clientId);

    const card = await Card.findOne({ clientId }).populate("clientId");
    // console.log("Found card:", card ? "Yes" : "No");

    if (!card) {
      // console.log("No card found for clientId:", clientId);
      return res
        .status(404)
        .json({ error: "No generated card found for this inquiry" });
    }

    if (!canViewCard(req, card)) {
      return res.status(403).json({ error: "Card is private" });
    }
    res.json(card);
  } catch (err) {
    console.error("Error in getCardByClientId:", err);
    res.status(500).json({ error: err.message });
  }
};

// Create new card
export const createCard = async (req, res) => {
  try {
    const {
      clientId,
      categoryId,
      templateId,
      data,
      hiddenFields,
      customizations,
      isCustom,
    } = req.body;

    // For custom cards, allow saving without real category/template by using placeholders
    const isCustomCard = !!isCustom;
    const effectiveCategoryId = isCustomCard
      ? categoryId || "custom"
      : categoryId;
    const effectiveTemplateId = isCustomCard
      ? templateId || "custom-default"
      : templateId;

    // Validate required fields
    // Admin-created cards use clientId (Inquiry). Self-serve cards use createdBy (authenticated user).
    const hasClient = !!clientId;
    const hasCreator = !!(req.user && req.user._id);

    if (
      (!hasClient && !hasCreator) ||
      !data ||
      (!isCustomCard && (!effectiveCategoryId || !effectiveTemplateId))
    ) {
      return res.status(400).json({
        error:
          "data is required. For admin cards, clientId is required. For self-serve cards, authentication is required. categoryId/templateId are required for non-custom cards.",
      });
    }

    // For non-custom cards, validate against template
    let template = null;
    if (!isCustomCard) {
      const Category = (await import("../models/Category.js")).default;
      const category = await Category.findByCategoryId(effectiveCategoryId);

      if (!category) {
        return res.status(404).json({
          error: "Category not found",
        });
      }

      template = category.getTemplate(effectiveTemplateId);
      if (!template) {
        return res.status(404).json({
          error: "Template not found in category",
        });
      }
    }

    // Process and validate card data using the new validation system
    if (process.env.DEBUG === "true") {
      // console.log("Processing card data:", data);
      // console.log("Template fields:", template.fields);
      // console.log("Hidden fields:", hiddenFields);
    }

    const validation = isCustomCard
      ? { isValid: true, data }
      : dataValidator.processCardData(data, template, hiddenFields);

    if (process.env.DEBUG === "true") {
      // console.log("Validation result:", validation);
    }

    if (!validation.isValid) {
      if (process.env.DEBUG === "true") {
        console.log("Validation failed with errors:", validation.errors);
      }
      return res.status(400).json({
        error: "Invalid card data",
        details: validation.errors,
      });
    }

    // Use the processed data, but preserve any extra fields not present in the template
    const processedData = {
      ...(data || {}),
      ...(validation.data || {}),
    };

    const cardDataToSave = {
      // For admin cards, clientId links to Inquiry; for self-serve cards, createdBy links to User
      ...(clientId ? { clientId } : {}),
      ...(!clientId && hasCreator ? { createdBy: req.user._id || req.user.id } : {}),
      categoryId: effectiveCategoryId,
      templateId: effectiveTemplateId,
      data: processedData, // Use processed data instead of raw data
      hiddenFields: hiddenFields || [],
      customizations: customizations || {},
      isCustom: !!isCustom,
      // Attribute card creation to the authenticated admin/superadmin.
      // For self-serve cards, adminId is left as default.
      ...(hasClient && {
        adminId: (req.user && (req.user.username || req.user.id)) || "admin",
      }),
    };

    if (process.env.DEBUG === "true") {
      // console.log("Creating card with data:", cardDataToSave);
    }

    const newCard = new Card(cardDataToSave);
    await newCard.save();

    if (process.env.DEBUG === "true") {
      // console.log("Card created successfully with ID:", newCard._id);
    }

    // Generate QR code for the new card
    const qrCode = await generateQR(newCard.publicUrl);
    newCard.qrCode = qrCode;
    await newCard.save();

    // For admin-created cards linked to an Inquiry, mark the inquiry as cardGenerated and link it.
    if (clientId) {
      try {
        const Inquiry = (await import("../models/Inquiry.js")).default;
        const updatedInquiry = await Inquiry.findByIdAndUpdate(
          clientId,
          {
            cardGenerated: true,
            cardId: newCard._id,
          },
          { new: true }
        );
        console.log(
          "Inquiry marked as cardGenerated and linked to card:",
          clientId,
          newCard._id
        );
        console.log("Updated inquiry:", updatedInquiry);
      } catch (updateErr) {
        console.warn("Failed to update inquiry status:", updateErr);
        // Don't fail the card creation if inquiry update fails
      }
    }

    // Create Details record for shareable details link (one per card)
    try {
      const Details = (await import("../models/Details.js")).default;
      await Details.getOrCreateForCard(newCard._id);
    } catch (detailsErr) {
      console.warn("Failed to create details record:", detailsErr);
    }

    res.status(201).json({
      success: true,
      message: "Card created successfully",
      card: newCard,
    });
  } catch (err) {
    console.error("Create card error:", err);
    res.status(400).json({ error: err.message });
  }
};

// Update card
export const updateCard = async (req, res) => {
  try {
    console.log("Updating card with ID:", req.params.id);
    console.log("Update data:", req.body);

    const { data, hiddenFields, customizations, isCustom, ...otherFields } =
      req.body;

    // Get the existing card to access template information
    const existingCard = await Card.findById(req.params.id);
    if (!existingCard) {
      return res.status(404).json({ error: "Card not found" });
    }
    if (!canManageCard(req, existingCard)) {
      return res.status(403).json({ error: "Not authorized to update this card" });
    }

    // If data is being updated, process it through validation for non-custom cards only
    let processedData = data;
    if (data) {
      // Preserve raw data for custom cards so we don't drop customCardData fields
      const isCustomCard = existingCard.isCustom || !!isCustom;
      if (!isCustomCard) {
        const Category = (await import("../models/Category.js")).default;
        const category = await Category.findByCategoryId(
          existingCard.categoryId
        );
        if (category) {
          const template = category.getTemplate(existingCard.templateId);
          if (template) {
            const validation = dataValidator.processCardData(
              data,
              template,
              hiddenFields
            );
            if (validation.isValid) {
              // Merge normalized/template fields with any extra fields (e.g., forDesktop)
              processedData = {
                ...(data || {}),
                ...(validation.data || {}),
              };
            } else {
              return res.status(400).json({
                error: "Invalid card data",
                details: validation.errors,
              });
            }
          }
        }
      }
    }

    // Build $set and optional $unset to allow clearing custom data when toggled off
    const setData = {
      ...otherFields,
      ...(data && { data: processedData }),
      ...(hiddenFields && { hiddenFields }),
    };

    // If customizations field is provided, set it (even if empty object)
    if (typeof customizations !== "undefined") {
      setData.customizations = customizations;
    }

    // If isCustom provided, set it
    if (typeof isCustom !== "undefined") {
      setData.isCustom = !!isCustom;
    }

    // Edit tracking
    setData.lastEditedBy = getActorRole(req);

    // Preserve customCardData always, templates now include it explicitly

    const updateQuery = { $set: setData };

    // Only use $unset for non-custom cards; preserve custom data for custom cards
    if (!existingCard.isCustom) {
      if (
        !data &&
        typeof customizations !== "undefined" &&
        customizations &&
        typeof customizations === "object" &&
        Object.keys(customizations).length === 0
      ) {
        updateQuery.$unset = { "data.customCardData": "" };
      }
    }

    console.log("Processed update query:", JSON.stringify(updateQuery));

    const updated = await Card.findByIdAndUpdate(req.params.id, updateQuery, {
      new: true,
    });

    console.log("Card updated successfully");
    res.json({
      success: true,
      message: "Card updated successfully",
      card: updated,
    });
  } catch (err) {
    console.error("Update card error:", err);
    res.status(400).json({ error: err.message });
  }
};

// Delete card
export const deleteCard = async (req, res) => {
  try {
    const existingCard = await Card.findById(req.params.id);
    if (!existingCard) return res.status(404).json({ error: "Card not found" });
    if (!canManageCard(req, existingCard)) {
      return res.status(403).json({ error: "Not authorized to delete this card" });
    }
    const deleted = await Card.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Card not found" });

    res.json({ message: "Card deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Toggle card public status
export const toggleCardPublic = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ error: "Card not found" });
    if (!canManageCard(req, card)) {
      return res.status(403).json({ error: "Not authorized to modify this card" });
    }

    card.isPublic = !card.isPublic;
    await card.save();

    res.json({
      message: `Card ${
        card.isPublic ? "published" : "unpublished"
      } successfully`,
      isPublic: card.isPublic,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get card analytics
export const getCardAnalytics = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ error: "Card not found" });
    if (!canManageCard(req, card)) {
      return res.status(403).json({ error: "Not authorized to view analytics for this card" });
    }

    res.json({
      views: card.views || 0,
      likes: card.likes || 0,
      shares: card.shares || 0,
      saves: card.saves || 0,
      downloads: card.downloads || 0,
      lastViewed: card.lastViewed,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      isPublic: card.isPublic,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus || !["Pending", "Done"].includes(paymentStatus)) {
      return res.status(400).json({
        error: "Invalid payment status. Must be 'Pending' or 'Done'",
      });
    }

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }
    if (!isAdminRequest(req)) {
      return res.status(403).json({ error: "Only admins can update payment status" });
    }

    card.paymentStatus = paymentStatus;
    await card.save();

    res.json({
      message: `Payment status updated to ${paymentStatus}`,
      paymentStatus: card.paymentStatus,
      cardId: card._id,
    });
  } catch (err) {
    console.error("Update payment status error:", err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Update view count for a card
// @route   POST /api/cards/:id/view
// @access  Public
export const updateViewCount = async (req, res) => {
  try {
    const updated = await Card.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { views: 1 },
        $set: { lastViewed: new Date() },
      },
      { new: true, projection: { views: 1, lastViewed: 1 } }
    );

    if (!updated) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.json({
      success: true,
      views: updated.views || 0,
      lastViewed: updated.lastViewed,
    });
  } catch (err) {
    console.error("Update view count error:", err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Increment share count for a card
// @route   POST /api/cards/:id/share
// @access  Public
export const updateShareCount = async (req, res) => {
  try {
    const updated = await Card.findByIdAndUpdate(
      req.params.id,
      { $inc: { shares: 1 } },
      { new: true, projection: { shares: 1 } }
    );

    if (!updated) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.json({
      success: true,
      shares: updated.shares || 0,
    });
  } catch (err) {
    console.error("Update share count error:", err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Increment download count for a card (VCF downloads)
// @route   POST /api/cards/:id/download
// @access  Public
export const updateDownloadCount = async (req, res) => {
  try {
    const updated = await Card.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true, projection: { downloads: 1 } }
    );

    if (!updated) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.json({
      success: true,
      downloads: updated.downloads || 0,
    });
  } catch (err) {
    console.error("Update download count error:", err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Update like count for a card
// @route   POST /api/cards/:id/like
// @access  Public
export const updateLikeCount = async (req, res) => {
  try {
    const { delta } = req.body || {};
    const inc = typeof delta === "number" && !Number.isNaN(delta) ? delta : 1;

    const updated = await Card.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: inc } },
      { new: true, projection: { likes: 1 } }
    );

    if (!updated) {
      return res.status(404).json({ error: "Card not found" });
    }

    // Ensure likes never goes below 0
    if (updated.likes < 0) {
      updated.likes = 0;
      await updated.save();
    }

    res.json({
      success: true,
      likes: updated.likes || 0,
    });
  } catch (err) {
    console.error("Update like count error:", err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Track shop link click for a card
// @route   POST /api/cards/:id/shoplink-click
// @access  Public
export const trackShopLinkClick = async (req, res) => {
  try {
    const { shopName } = req.body;
    
    if (!shopName || typeof shopName !== "string") {
      return res.status(400).json({ error: "shopName is required" });
    }

    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    // Initialize shopLinkClicks if it doesn't exist or is not a Map
    if (!card.shopLinkClicks || !(card.shopLinkClicks instanceof Map)) {
      card.shopLinkClicks = new Map();
    }

    // Increment click count for this shop
    const currentClicks = card.shopLinkClicks.get(shopName) || 0;
    card.shopLinkClicks.set(shopName, currentClicks + 1);

    await card.save();

    // Convert Map to object for response
    const clicksObject = {};
    card.shopLinkClicks.forEach((value, key) => {
      clicksObject[key] = value;
    });

    res.json({
      success: true,
      shopLinkClicks: clicksObject,
    });
  } catch (err) {
    console.error("Track shop link click error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Helper: fetch a URL and return PDF with correct headers so it always downloads as PDF
async function streamPdfFromUrl(catalogueUrl, res) {
  const fetchRes = await fetch(catalogueUrl);
  if (!fetchRes.ok) {
    return res.status(502).json({
      error: "Failed to fetch catalogue from storage",
    });
  }
  const buffer = Buffer.from(await fetchRes.arrayBuffer());
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="catalogue.pdf"');
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-cache");
  res.send(buffer);
}

// Stream catalogue PDF by card ID
export const getCataloguePdf = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id).lean();
    if (!card) return res.status(404).json({ error: "Card not found" });

    const catalogueUrl = card?.data?.catalogue || card?.cardData?.catalogue;
    if (!catalogueUrl || typeof catalogueUrl !== "string") {
      return res
        .status(404)
        .json({ error: "Catalogue not found for this card" });
    }
    await streamPdfFromUrl(catalogueUrl, res);
  } catch (err) {
    console.error("Get catalogue PDF error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Stream catalogue PDF by URL (for preview/unsaved cards; only allow Cloudinary)
export const getCataloguePdfByUrl = async (req, res) => {
  try {
    const catalogueUrl = req.query.url;
    if (!catalogueUrl || typeof catalogueUrl !== "string") {
      return res.status(400).json({ error: "Missing catalogue URL" });
    }
    const allowedHost = "res.cloudinary.com";
    let parsed;
    try {
      parsed = new URL(catalogueUrl);
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }
    if (parsed.hostname !== allowedHost) {
      return res.status(403).json({ error: "Catalogue URL not allowed" });
    }
    await streamPdfFromUrl(catalogueUrl, res);
  } catch (err) {
    console.error("Get catalogue PDF by URL error:", err);
    res.status(500).json({ error: err.message });
  }
};
