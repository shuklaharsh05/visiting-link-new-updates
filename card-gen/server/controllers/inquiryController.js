import Inquiry from "../models/Inquiry.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Card from "../models/Card.js";
import PinnedInquiry from "../models/PinnedInquiry.js";
import { validationResult } from "express-validator";
import mongoose from "mongoose";

// Utility function to validate ObjectId
const validateObjectId = (id) => {
  if (!id || typeof id !== "string" || id.length !== 24) {
    return false;
  }
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Normalize admin id to string for pin storage (superadmin or ObjectId string)
const adminIdString = (user) =>
  user && user.id != null ? String(user.id) : null;

// Get all inquiries (with pin metadata and sort: superadmin pins first, then own pins)
export const getInquiries = async (req, res) => {
  try {
    const { status, businessType, resolved, page = 1, limit = 10 } = req.query;
    const limitNum = parseInt(limit, 10) || 10;
    const pageNum = Math.max(1, parseInt(page, 10));
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};

    if (req.user && req.user.role === "admin") {
      matchStage.assignedTo = req.user.username;
    }
    // Critical: regular users can only see their own inquiries.
    if (req.user && req.user.role !== "admin" && req.user.role !== "superadmin") {
      matchStage.userId = req.user.id || req.user._id;
    }
    if (status) matchStage.status = status;
    if (businessType) matchStage.businessType = businessType;
    if (resolved !== undefined) matchStage.resolved = resolved === "true";

    const forAdminId = adminIdString(req.user);
    const isAdmin =
      req.user && (req.user.role === "admin" || req.user.role === "superadmin");

    if (!isAdmin || !forAdminId) {
      // Non-admin: scoped by matchStage.userId above
      const inquiries = await Inquiry.find(matchStage)
        .populate("userId", "name email phone businessType")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
      const total = await Inquiry.countDocuments(matchStage);
      return res.json({
        success: true,
        data: inquiries,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalInquiries: total,
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1,
        },
      });
    }

    // Admin/superadmin: use aggregation to add pin metadata and sort (pinned first: superadmin then own)
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "pinned_inquiries",
          let: { inquiryId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$inquiryId", "$$inquiryId"] },
                forAdminId,
              },
            },
            { $limit: 1 },
          ],
          as: "pin",
        },
      },
      {
        $addFields: {
          pinnedForMe: { $gt: [{ $size: "$pin" }, 0] },
          pinnedBySuperAdmin: {
            $and: [
              { $gt: [{ $size: "$pin" }, 0] },
              {
                $eq: [
                  { $arrayElemAt: ["$pin.pinnedByAdminId", 0] },
                  "superadmin",
                ],
              },
            ],
          },
        },
      },
      // For superadmin: is this inquiry pinned for the assigned admin?
      {
        $lookup: {
          from: "admins",
          localField: "assignedTo",
          foreignField: "name",
          as: "assignedAdminDoc",
        },
      },
      {
        $lookup: {
          from: "pinned_inquiries",
          let: {
            inquiryId: "$_id",
            assignedId: {
              $ifNull: [
                { $toString: { $arrayElemAt: ["$assignedAdminDoc._id", 0] } },
                "",
              ],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$inquiryId", "$$inquiryId"] },
                    { $ne: ["$$assignedId", ""] },
                    { $eq: ["$forAdminId", "$$assignedId"] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "pinForAssigned",
        },
      },
      {
        $addFields: {
          pinnedForAssignedAdmin: {
            $gt: [{ $size: "$pinForAssigned" }, 0],
          },
        },
      },
      {
        $addFields: {
          pinOrder: {
            $cond: [
              "$pinnedBySuperAdmin",
              0,
              { $cond: ["$pinnedForMe", 1, 2] },
            ],
          },
        },
      },
      { $sort: { pinOrder: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userIdPop",
          pipeline: [
            { $project: { name: 1, email: 1, phone: 1, businessType: 1, plan: 1 } },
          ],
        },
      },
      {
        $set: {
          userId: { $arrayElemAt: ["$userIdPop", 0] },
          pin: "$$REMOVE",
          pinForAssigned: "$$REMOVE",
          assignedAdminDoc: "$$REMOVE",
          userIdPop: "$$REMOVE",
        },
      },
    ];

    const [inquiries, total] = await Promise.all([
      Inquiry.aggregate(pipeline),
      Inquiry.countDocuments(matchStage),
    ]);

    res.json({
      success: true,
      data: inquiries,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalInquiries: total,
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    });
  } catch (err) {
    console.error("Error fetching inquiries:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch inquiries",
      message: err.message,
    });
  }
};

// Get inquiry by ID
export const getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid inquiry ID format",
      });
    }

    const inquiry = await Inquiry.findById(id).populate(
      "userId",
      "name email phone businessType"
    );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: "Inquiry not found",
      });
    }

    res.json({
      success: true,
      data: inquiry,
    });
  } catch (err) {
    console.error("Error fetching inquiry:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch inquiry",
      message: err.message,
    });
  }
};

// Pin inquiry for an admin (self or, if superadmin, for the inquiry's assigned admin only)
export const pinInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { forAdminId: bodyForAdminId } = req.body || {};
    if (!validateObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid inquiry ID" });
    }
    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res
        .status(404)
        .json({ success: false, error: "Inquiry not found" });
    }
    const currentId = adminIdString(req.user);
    if (
      !currentId ||
      (req.user.role !== "admin" && req.user.role !== "superadmin")
    ) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }
    let forAdminId = currentId;
    if (req.user.role === "superadmin" && bodyForAdminId) {
      const assignedToName =
        inquiry.assignedTo && String(inquiry.assignedTo).trim();
      if (!assignedToName) {
        return res.status(400).json({
          success: false,
          error: "Inquiry must be assigned to an admin to pin for them",
        });
      }
      const assignedAdmin = await Admin.findOne({
        name: assignedToName,
        isActive: true,
      });
      if (
        !assignedAdmin ||
        String(assignedAdmin._id) !== String(bodyForAdminId)
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Can only pin for yourself or for the admin this inquiry is assigned to",
        });
      }
      forAdminId = String(bodyForAdminId);
    }
    await PinnedInquiry.findOneAndUpdate(
      { inquiryId: id, forAdminId },
      { inquiryId: id, forAdminId, pinnedByAdminId: currentId },
      { upsert: true, new: true }
    );
    res.json({ success: true, pinned: true });
  } catch (err) {
    console.error("Error pinning inquiry:", err);
    res.status(500).json({
      success: false,
      error: "Failed to pin inquiry",
      message: err.message,
    });
  }
};

// Unpin inquiry for an admin (superadmin can only unpin for self or for the inquiry's assigned admin)
export const unpinInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { forAdminId: bodyForAdminId } = req.body || {};
    if (!validateObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid inquiry ID" });
    }
    const currentId = adminIdString(req.user);
    if (
      !currentId ||
      (req.user.role !== "admin" && req.user.role !== "superadmin")
    ) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }
    let forAdminId = currentId;
    if (req.user.role === "superadmin" && bodyForAdminId) {
      const inquiry = await Inquiry.findById(id).select("assignedTo");
      const assignedToName =
        inquiry?.assignedTo && String(inquiry.assignedTo).trim();
      if (!assignedToName) {
        return res
          .status(400)
          .json({ success: false, error: "Inquiry has no assigned admin" });
      }
      const assignedAdmin = await Admin.findOne({
        name: assignedToName,
        isActive: true,
      });
      if (
        !assignedAdmin ||
        String(assignedAdmin._id) !== String(bodyForAdminId)
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Can only unpin for yourself or for the admin this inquiry is assigned to",
        });
      }
      forAdminId = String(bodyForAdminId);
    }
    await PinnedInquiry.deleteOne({ inquiryId: id, forAdminId });
    res.json({ success: true, pinned: false });
  } catch (err) {
    console.error("Error unpinning inquiry:", err);
    res.status(500).json({
      success: false,
      error: "Failed to unpin inquiry",
      message: err.message,
    });
  }
};

// Create new inquiry (requires authentication)
export const createInquiry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { name, email, phone, message, businessType } = req.body;
    const userId = req.user.id;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const normalizedName =
      typeof name === "string" ? name.trim() : user.name || "";
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : user.email || "";
    // Use the phone from the inquiry form (request body) for the inquiry contact. Link number/password are for login only.
    const inquiryPhoneFromForm = typeof phone === "string" ? phone.trim() : "";
    const inquiryPhone =
      inquiryPhoneFromForm ||
      (user.phone ? String(user.phone).trim() : "") ||
      "Not provided";

    const inquiry = new Inquiry({
      userId: user._id,
      name: normalizedName || user.name,
      email: normalizedEmail || user.email,
      phone: inquiryPhone,
      ...(typeof message === "string" ? { message: message.trim() } : {}),
      ...(typeof businessType === "string" ? { businessType: businessType.trim() } : {}),
    });

    await inquiry.save();

    // Add inquiry to user's inquiries array
    user.inquiries.push(inquiry._id);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully",
      data: {
        ...inquiry.toObject(),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (err) {
    console.error("Error creating inquiry:", err);
    res.status(400).json({
      success: false,
      error: "Failed to create inquiry",
      message: err.message,
    });
  }
};

// Create inquiry for a user (superadmin only) – e.g. after creating user from admin panel
export const createInquiryForUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: "Valid userId is required",
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }
    const emailForInquiry =
      user.email ||
      `${(user.phone || "noreply").replace(/\D/g, "")}@phone.visitinglink.com`;
    const inquiry = new Inquiry({
      userId: user._id,
      name: user.name,
      email: emailForInquiry,
      phone: user.phone || "",
    });
    await inquiry.save();
    user.inquiries.push(inquiry._id);
    await user.save();
    res.status(201).json({
      success: true,
      message: "Inquiry created for user",
      data: inquiry,
    });
  } catch (err) {
    console.error("Error creating inquiry for user:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to create inquiry for user",
    });
  }
};

// Update inquiry status or details (admin only)
export const updateInquiry = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid inquiry ID format",
      });
    }

    const isAdminActor =
      req.user?.role === "admin" || req.user?.role === "superadmin";
    const {
      status,
      adminNotes,
      cardId,
      resolved,
      cardGenerated,
      generatedCard,
      assignedTo,
      name,
      email,
      phone,
      message,
      businessType,
    } = req.body || {};

    const updateData = {};
    if (isAdminActor) {
      if (status) updateData.status = status;
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
      if (cardId) updateData.cardId = cardId;
      if (resolved !== undefined) updateData.resolved = resolved;
      if (cardGenerated !== undefined) updateData.cardGenerated = cardGenerated;
      if (generatedCard) updateData.generatedCard = generatedCard;
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    } else {
      // User-safe editable fields only
      if (name !== undefined) updateData.name = String(name).trim();
      if (email !== undefined) updateData.email = String(email).trim().toLowerCase();
      if (phone !== undefined) updateData.phone = String(phone).trim();
      if (message !== undefined) updateData.message = String(message).trim();
      if (businessType !== undefined) updateData.businessType = String(businessType).trim();
    }

    const inquiry = await Inquiry.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: "Inquiry not found",
      });
    }

    res.json({
      success: true,
      message: "Inquiry updated successfully",
      data: inquiry,
    });
  } catch (err) {
    console.error("Error updating inquiry:", err);
    res.status(400).json({
      success: false,
      error: "Failed to update inquiry",
      message: err.message,
    });
  }
};

// Delete inquiry
export const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid inquiry ID format",
      });
    }

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: "Inquiry not found",
      });
    }
    if (inquiry.cardId) {
      await Card.findByIdAndDelete(inquiry.cardId);
    }
    await Inquiry.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Inquiry deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting inquiry:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete inquiry",
      message: err.message,
    });
  }
};

// Bulk delete inquiries (admin/superadmin only; requires password confirmation)
export const bulkDeleteInquiries = async (req, res) => {
  try {
    const { inquiryIds, password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password is required to delete inquiries",
      });
    }
    if (!Array.isArray(inquiryIds) || inquiryIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one inquiry must be selected",
      });
    }
    const validIds = inquiryIds.filter(
      (id) => typeof id === "string" && validateObjectId(id)
    );
    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid inquiry IDs provided",
      });
    }

    const user = req.user;
    let passwordValid = false;
    if (user.role === "superadmin") {
      const superAdminPassword = process.env.ADMIN_PASSWORD;
      if (!superAdminPassword) {
        return res.status(500).json({
          success: false,
          error: "Superadmin credentials are not configured",
        });
      }
      passwordValid = password === superAdminPassword;
    } else if (user.role === "admin" && user.id) {
      const admin = await Admin.findById(user.id).select("+password");
      passwordValid = admin && (await admin.comparePassword(password));
    }
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid password",
      });
    }

    const inquiriesToDelete = await Inquiry.find(
      { _id: { $in: validIds } },
      "cardId"
    ).lean();
    const cardIdsToDelete = inquiriesToDelete
      .map((i) => i.cardId)
      .filter(Boolean);
    if (cardIdsToDelete.length > 0) {
      await Card.deleteMany({ _id: { $in: cardIdsToDelete } });
    }
    const result = await Inquiry.deleteMany({ _id: { $in: validIds } });
    res.json({
      success: true,
      message: `${result.deletedCount} inquiry(ies) deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("Error bulk deleting inquiries:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to delete inquiries",
    });
  }
};

// Get inquiry statistics
export const getInquiryStats = async (req, res) => {
  try {
    const stats = await Inquiry.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const businessTypeStats = await Inquiry.aggregate([
      {
        $group: {
          _id: "$businessType",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalInquiries = await Inquiry.countDocuments();
    const newInquiries = await Inquiry.countDocuments({ status: "New" });

    res.json({
      totalInquiries,
      newInquiries,
      statusBreakdown: stats,
      businessTypeBreakdown: businessTypeStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update payment status for an inquiry (admin only)
export const updatePaymentStatus = async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }
    const { id } = req.params;
    const { paymentStatus, amount, paymentId, paymentDate, notes } = req.body;

    // Validate ObjectId format
    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid inquiry ID format",
      });
    }

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: "Inquiry not found",
      });
    }

    // Initialize payment object if it doesn't exist
    if (!inquiry.payment) {
      inquiry.payment = {
        status: "Pending",
        currency: "INR",
        gateway: "manual",
      };
    }

    // Update payment status
    if (paymentStatus) {
      const validStatuses = [
        "Pending",
        "Processing",
        "Completed",
        "Failed",
        "Refunded",
      ];
      if (validStatuses.includes(paymentStatus)) {
        inquiry.payment.status = paymentStatus;
      } else {
        return res.status(400).json({
          success: false,
          error: `Invalid payment status. Must be one of: ${validStatuses.join(
            ", "
          )}`,
        });
      }
    }

    // Update other payment fields
    if (amount !== undefined) {
      inquiry.payment.amount = amount;
    }

    if (paymentId) {
      inquiry.payment.paymentId = paymentId;
    }

    if (paymentDate) {
      inquiry.payment.paymentDate = new Date(paymentDate);
    } else if (paymentStatus === "Completed" && !inquiry.payment.paymentDate) {
      inquiry.payment.paymentDate = new Date();
    }

    // Store admin notes in gatewayResponse if provided
    if (notes) {
      inquiry.payment.gatewayResponse = {
        ...inquiry.payment.gatewayResponse,
        adminNotes: notes,
        updatedAt: new Date(),
        updatedBy: req.user?.id || req.user?.username || "admin",
      };
    }

    await inquiry.save();

    // Update card payment status if card exists
    if (inquiry.cardId && paymentStatus === "Completed") {
      const Card = (await import("../models/Card.js")).default;
      await Card.findByIdAndUpdate(inquiry.cardId, {
        paymentStatus: "Done",
      });
    }

    res.json({
      success: true,
      message: "Payment status updated successfully",
      data: inquiry,
    });
  } catch (err) {
    console.error("Error updating payment status:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update payment status",
      message: err.message,
    });
  }
};
