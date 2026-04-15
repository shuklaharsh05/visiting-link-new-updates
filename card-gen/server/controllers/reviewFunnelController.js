import Card from "../models/Card.js";
import ReviewFeedback from "../models/ReviewFeedback.js";

const isAdminRequest = (req) =>
  req?.user?.role === "admin" || req?.user?.role === "superadmin";

const getRequestUserId = (req) => String(req?.user?._id || req?.user?.id || "");

const canManageCard = (req, card) => {
  if (!card) return false;
  if (isAdminRequest(req)) return true;
  const uid = getRequestUserId(req);
  if (!uid) return false;
  return (
    (card.createdBy && String(card.createdBy) === uid) ||
    (card.userId && String(card.userId) === uid)
  );
};

const clampRating = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  const r = Math.round(x);
  if (r < 1 || r > 5) return null;
  return r;
};

export const submitRating = async (req, res) => {
  try {
    const { cardId } = req.params;
    const rating = clampRating(req.body?.rating);
    if (!cardId) return res.status(400).json({ success: false, error: "Missing cardId" });
    if (!rating) return res.status(400).json({ success: false, error: "Invalid rating" });

    const card = await Card.findById(cardId).select("_id");
    if (!card) return res.status(404).json({ success: false, error: "Card not found" });

    const ratingKey = `reviewFunnel.ratingCounts.${rating}`;
    await Card.updateOne(
      { _id: cardId },
      {
        $inc: { "reviewFunnel.totalRatings": 1, [ratingKey]: 1 },
        $set: { "reviewFunnel.lastRatedAt": new Date() },
      }
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const submitNegativeFeedback = async (req, res) => {
  try {
    const { cardId } = req.params;
    const rating = clampRating(req.body?.rating);
    const feedback = String(req.body?.feedback || "").trim();
    const name = String(req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").trim();

    if (!cardId) return res.status(400).json({ success: false, error: "Missing cardId" });
    if (!rating) return res.status(400).json({ success: false, error: "Invalid rating" });
    if (!feedback) return res.status(400).json({ success: false, error: "Feedback is required" });
    if (rating > 2) {
      return res.status(400).json({ success: false, error: "Feedback endpoint is for 1–2 star only" });
    }

    const card = await Card.findById(cardId).select("_id");
    if (!card) return res.status(404).json({ success: false, error: "Card not found" });

    const doc = await ReviewFeedback.create({
      cardId,
      rating,
      feedback,
      ...(name ? { name } : {}),
      ...(phone ? { phone } : {}),
    });

    return res.json({ success: true, data: { id: doc._id } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const trackGoogleClick = async (req, res) => {
  try {
    const { cardId } = req.params;
    if (!cardId) return res.status(400).json({ success: false, error: "Missing cardId" });

    const card = await Card.findById(cardId).select("_id");
    if (!card) return res.status(404).json({ success: false, error: "Card not found" });

    await Card.updateOne(
      { _id: cardId },
      {
        $inc: { "reviewFunnel.googleClicks": 1 },
        $set: { "reviewFunnel.lastGoogleClickAt": new Date() },
      }
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getCardReviewFunnel = async (req, res) => {
  try {
    const { cardId } = req.params;
    const card = await Card.findById(cardId).select("reviewFunnel createdBy userId");
    if (!card) return res.status(404).json({ success: false, error: "Card not found" });
    if (!canManageCard(req, card)) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }
    return res.json({ success: true, data: card.reviewFunnel || null });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getCardNegativeFeedback = async (req, res) => {
  try {
    const { cardId } = req.params;
    const limit = Math.min(100, Math.max(1, Number(req.query?.limit || 20)));

    const card = await Card.findById(cardId).select("_id createdBy userId");
    if (!card) return res.status(404).json({ success: false, error: "Card not found" });
    if (!canManageCard(req, card)) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const items = await ReviewFeedback.find({ cardId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("rating feedback name phone createdAt")
      .lean();

    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

