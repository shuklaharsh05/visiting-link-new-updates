import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Card from "../models/Card.js";
import Category from "../models/Category.js";
import Inquiry from "../models/Inquiry.js";
import { dataValidator } from "../utils/dataValidation.js";

const isSuperadmin = (req) => req?.user?.role === "superadmin";
const isAdmin = (req) => req?.user?.role === "admin";
const getAdminId = (req) => req?.user?.id;

export const adminGetStats = async (req, res) => {
  try {
    if (!isAdmin(req) && !isSuperadmin(req)) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    if (isSuperadmin(req)) {
      // Superadmin stats can be derived elsewhere; keep endpoint stable.
      return res.json({ success: true, data: { mode: "superadmin" } });
    }

    const adminId = getAdminId(req);
    const [usersCount, cardsCount, admin] = await Promise.all([
      User.countDocuments({ createdByAdmin: adminId }),
      Card.countDocuments({ createdByAdmin: adminId }),
      Admin.findById(adminId).select("walletBalance costPerCard type").lean(),
    ]);

    return res.json({
      success: true,
      data: {
        usersCount,
        cardsCount,
        walletBalance: admin?.walletBalance || 0,
        costPerCard: admin?.costPerCard || 0,
        type: admin?.type || "individual",
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const sumWalletRechargeTotal = async () => {
  const rows = await Admin.aggregate([
    { $unwind: "$transactions" },
    {
      $match: {
        "transactions.type": "credit",
        "transactions.reason": "wallet_recharge",
        "transactions.status": "success",
      },
    },
    { $group: { _id: null, total: { $sum: "$transactions.amount" } } },
  ]);
  return Number(rows?.[0]?.total || 0);
};

const sumUserPaymentTotal = async () => {
  const [inquiryRows, planRows] = await Promise.all([
    Inquiry.aggregate([
      { $match: { "payment.status": "Completed" } },
      { $group: { _id: null, total: { $sum: "$payment.amount" } } },
    ]),
    User.aggregate([
      { $match: { "planPayment.status": "Completed" } },
      { $group: { _id: null, total: { $sum: "$planPayment.amount" } } },
    ]),
  ]);
  return Number(inquiryRows?.[0]?.total || 0) + Number(planRows?.[0]?.total || 0);
};

export const getSuperadminDashboardStats = async (req, res) => {
  try {
    if (!isSuperadmin(req)) {
      return res.status(403).json({ success: false, error: "Superadmin only" });
    }
    const [totalCategories, totalCards, totalUsers, walletRechargeTotal, userPaymentTotal] =
      await Promise.all([
        Category.countDocuments({}),
        Card.countDocuments({}),
        User.countDocuments({}),
        sumWalletRechargeTotal(),
        sumUserPaymentTotal(),
      ]);

    return res.json({
      success: true,
      data: {
        totalCategories,
        totalCards,
        totalUsers,
        totalAmount: Number(walletRechargeTotal || 0) + Number(userPaymentTotal || 0),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getSuperadminCardsBreakdown = async (req, res) => {
  try {
    if (!isSuperadmin(req)) {
      return res.status(403).json({ success: false, error: "Superadmin only" });
    }
    const rows = await Card.aggregate([
      {
        $group: {
          _id: null,
          totalCards: { $sum: 1 },
          byAdmin: {
            $sum: {
              $cond: [{ $ifNull: ["$createdByAdmin", false] }, 1, 0],
            },
          },
          byUser: {
            $sum: {
              $cond: [{ $ifNull: ["$createdBy", false] }, 1, 0],
            },
          },
          bySuperadmin: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: [{ $ifNull: ["$createdByAdmin", null] }, null] },
                    { $eq: [{ $ifNull: ["$createdBy", null] }, null] },
                    { $eq: ["$lastEditedBy", "superadmin"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);
    const d = rows?.[0] || {};
    return res.json({
      success: true,
      data: {
        totalCards: Number(d.totalCards || 0),
        byAdmin: Number(d.byAdmin || 0),
        byUser: Number(d.byUser || 0),
        bySuperadmin: Number(d.bySuperadmin || 0),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getSuperadminUsersBreakdown = async (req, res) => {
  try {
    if (!isSuperadmin(req)) {
      return res.status(403).json({ success: false, error: "Superadmin only" });
    }
    const rows = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          createdByAdmins: {
            $sum: {
              $cond: [{ $ifNull: ["$createdByAdmin", false] }, 1, 0],
            },
          },
        },
      },
    ]);
    const d = rows?.[0] || {};
    const totalUsers = Number(d.totalUsers || 0);
    const createdByAdmins = Number(d.createdByAdmins || 0);
    return res.json({
      success: true,
      data: {
        totalUsers,
        createdByAdmins,
        directUsers: Math.max(0, totalUsers - createdByAdmins),
        createdBySuperadmin: 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getSuperadminRevenueBreakdown = async (req, res) => {
  try {
    if (!isSuperadmin(req)) {
      return res.status(403).json({ success: false, error: "Superadmin only" });
    }
    const [walletRechargeTotal, userPaymentTotal] = await Promise.all([
      sumWalletRechargeTotal(),
      sumUserPaymentTotal(),
    ]);
    return res.json({
      success: true,
      data: {
        walletRechargeTotal: Number(walletRechargeTotal || 0),
        userPaymentTotal: Number(userPaymentTotal || 0),
        totalAmount: Number(walletRechargeTotal || 0) + Number(userPaymentTotal || 0),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const adminListCardsForUser = async (req, res) => {
  try {
    if (!isAdmin(req) && !isSuperadmin(req)) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    const ownerUser = await User.findById(userId).select("createdByAdmin").lean();
    if (!ownerUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const adminId = getAdminId(req);
    if (isAdmin(req)) {
      if (!ownerUser.createdByAdmin || String(ownerUser.createdByAdmin) !== String(adminId)) {
        return res.status(403).json({
          success: false,
          error: "You can only view cards for users you created",
        });
      }
    }

    // Admin can only see cards they created for that user.
    // (Superadmin can see all cards for that user in this endpoint.)
    const filter = isAdmin(req)
      ? { userId, createdByAdmin: adminId }
      : { userId };

    const cards = await Card.find(filter).sort({ updatedAt: -1 }).lean();
    return res.json({ success: true, data: cards });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const adminCreateCardForUser = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { userId } = req.params;
    const { categoryId, templateId, data, hiddenFields, customizations, isCustom, name } =
      req.body || {};

    if (!userId || !categoryId || !templateId || !data) {
      return res.status(400).json({
        success: false,
        error: "userId, categoryId, templateId and data are required",
      });
    }

    const ownerUser = await User.findById(userId).lean();
    if (!ownerUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Admin scoping: admins can only create cards for users they created
    const adminId = getAdminId(req);
    if (isAdmin(req)) {
      if (!ownerUser.createdByAdmin || String(ownerUser.createdByAdmin) !== String(adminId)) {
        return res.status(403).json({
          success: false,
          error: "You can only create cards for users you created",
        });
      }
    }

    // Template validation (same as cardController)
    const Category = (await import("../models/Category.js")).default;
    const category = await Category.findByCategoryId(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }
    const template = category.getTemplate(templateId);
    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found in category" });
    }

    const validation = !!isCustom
      ? { isValid: true, data }
      : dataValidator.processCardData(data, template, hiddenFields);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, error: "Invalid card data", details: validation.errors });
    }

    const processedData = { ...(data || {}), ...(validation.data || {}) };

    // Superadmin: no wallet deduction
    if (isSuperadmin(req)) {
      const card = await Card.create({
        name: name || undefined,
        userId: ownerUser._id,
        createdByAdmin: null,
        lastEditedBy: "superadmin",
        categoryId,
        templateId,
        data: processedData,
        hiddenFields: hiddenFields || [],
        customizations: customizations || {},
        isCustom: !!isCustom,
      });
      return res.status(201).json({ success: true, card });
    }

    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: "Admins only" });
    }

    // Admin: wallet debit + transaction logging must be atomic with card create
    session.startTransaction();

    const admin = await Admin.findById(adminId).session(session);
    if (!admin) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: "Admin not found" });
    }

    const cost = Number(admin.costPerCard || 0);
    if (admin.walletBalance == null || admin.walletBalance < cost) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: "Insufficient wallet balance" });
    }

    const card = await Card.create(
      [
        {
          name: name || undefined,
          userId: ownerUser._id,
          createdByAdmin: admin._id,
          lastEditedBy: "admin",
          categoryId,
          templateId,
          data: processedData,
          hiddenFields: hiddenFields || [],
          customizations: customizations || {},
          isCustom: !!isCustom,
        },
      ],
      { session }
    );

    admin.walletBalance = Math.max(0, (admin.walletBalance || 0) - cost);
    admin.transactions = admin.transactions || [];
    admin.transactions.push({
      type: "debit",
      amount: cost,
      reason: "card_creation",
      cardId: card[0]._id,
      userId: ownerUser._id,
      status: "success",
      createdAt: new Date(),
    });
    await admin.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      card: card[0],
      walletBalance: admin.walletBalance,
      costPerCard: cost,
    });
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch {}
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    session.endSession();
  }
};

/** Refund amount: original card_creation debit if logged, else current costPerCard. */
const getRefundAmountForCard = (adminDoc, cardId) => {
  const txs = adminDoc?.transactions || [];
  const orig = txs.find(
    (t) =>
      t.type === "debit" &&
      t.reason === "card_creation" &&
      t.cardId &&
      String(t.cardId) === String(cardId) &&
      t.status === "success"
  );
  if (orig && typeof orig.amount === "number") return Math.max(0, orig.amount);
  return Math.max(0, Number(adminDoc?.costPerCard || 0));
};

const hasDeletionRefund = (adminDoc, cardId) =>
  (adminDoc?.transactions || []).some(
    (t) =>
      t.type === "credit" &&
      t.reason === "card_deletion_refund" &&
      t.cardId &&
      String(t.cardId) === String(cardId) &&
      t.status === "success"
  );

/**
 * Delete a card for a managed user. Credits the reseller admin who paid for the card
 * (the card's createdByAdmin). Superadmin-created cards (no createdByAdmin) are deleted with no wallet change.
 */
export const adminDeleteCardForUser = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { userId, cardId } = req.params;
    if (!userId || !cardId) {
      return res.status(400).json({ success: false, error: "userId and cardId are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(cardId)) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }

    const ownerUser = await User.findById(userId).select("createdByAdmin").lean();
    if (!ownerUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const adminId = getAdminId(req);

    if (isAdmin(req)) {
      if (!ownerUser.createdByAdmin || String(ownerUser.createdByAdmin) !== String(adminId)) {
        return res.status(403).json({
          success: false,
          error: "You can only delete cards for users you created",
        });
      }
    }

    const card = await Card.findById(cardId).lean();
    if (!card) {
      return res.status(404).json({ success: false, error: "Card not found" });
    }
    if (!card.userId || String(card.userId) !== String(userId)) {
      return res.status(400).json({ success: false, error: "Card does not belong to this user" });
    }

    if (isAdmin(req)) {
      if (!card.createdByAdmin || String(card.createdByAdmin) !== String(adminId)) {
        return res.status(403).json({
          success: false,
          error: "You can only delete cards you created for this user",
        });
      }
    }

    const paidByAdminId = card.createdByAdmin ? String(card.createdByAdmin) : null;

    session.startTransaction();

    if (!paidByAdminId) {
      const removed = await Card.findOneAndDelete(
        { _id: cardId, userId },
        { session }
      );
      if (!removed) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, error: "Card not found" });
      }
      await session.commitTransaction();
      return res.json({
        success: true,
        message: "Card deleted",
        refundAmount: 0,
        walletBalance: null,
      });
    }

    const adminToCredit = await Admin.findById(paidByAdminId).session(session);
    if (!adminToCredit) {
      await session.abortTransaction();
      return res.status(500).json({ success: false, error: "Billing admin not found" });
    }

    if (hasDeletionRefund(adminToCredit, cardId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: "This card was already refunded; delete not applied",
      });
    }

    const refundAmount = getRefundAmountForCard(adminToCredit, cardId);

    const removed = await Card.findOneAndDelete(
      { _id: cardId, userId },
      { session }
    );
    if (!removed) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: "Card not found" });
    }

    adminToCredit.walletBalance = Math.max(0, (adminToCredit.walletBalance || 0) + refundAmount);
    adminToCredit.transactions = adminToCredit.transactions || [];
    adminToCredit.transactions.push({
      type: "credit",
      amount: refundAmount,
      reason: "card_deletion_refund",
      cardId: removed._id,
      userId: removed.userId,
      status: "success",
      createdAt: new Date(),
    });
    await adminToCredit.save({ session });

    await session.commitTransaction();

    return res.json({
      success: true,
      message: "Card deleted and wallet credited",
      refundAmount,
      walletBalance: adminToCredit.walletBalance,
    });
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch {}
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    session.endSession();
  }
};

