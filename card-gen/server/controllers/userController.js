import User from "../models/User.js";
import Inquiry from "../models/Inquiry.js";
import Card from "../models/Card.js";
import Appointment from "../models/Appointment.js";
import Admin from "../models/Admin.js";
import { validationResult } from "express-validator";

const validateObjectId = (id) =>
  id &&
  typeof id === "string" &&
  id.length === 24 &&
  /^[0-9a-fA-F]{24}$/.test(id);

// @desc    Get all users
// @route   GET /api/users
// @access  Private
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, startDate, endDate, ids } = req.query;
    const query = {};

    // Search by name, email or phone if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by specific user IDs (comma-separated), e.g. export selected users
    if (ids !== undefined && ids !== null && String(ids).trim() !== "") {
      const idList = String(ids)
        .split(",")
        .map((s) => s.trim())
        .filter((id) => validateObjectId(id));
      if (idList.length === 0) {
        return res.json({
          success: true,
          data: {
            users: [],
            pagination: {
              currentPage: parseInt(page, 10) || 1,
              totalPages: 0,
              totalUsers: 0,
              hasNext: false,
              hasPrev: false,
            },
          },
        });
      }
      query._id = { $in: idList };
    }

    // Optional createdAt range (inclusive, server local calendar day)
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const d = new Date(startDate);
        if (!Number.isNaN(d.getTime())) {
          d.setHours(0, 0, 0, 0);
          query.createdAt.$gte = d;
        }
      }
      if (endDate) {
        const d = new Date(endDate);
        if (!Number.isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999);
          query.createdAt.$lte = d;
        }
      }
      if (Object.keys(query.createdAt).length === 0) {
        delete query.createdAt;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 500);

    const users = await User.find(query)
      .populate(
        "inquiries",
        "name email phone message status createdAt businessType resolved cardGenerated cardId adminNotes"
      )
      .populate("savedCards", "title categoryId templateId createdAt")
      .populate("appointments", "name email phone message status createdAt")
      .populate("createdByAdmin", "name")
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await User.countDocuments(query);

    // Compute number of cards per user (self-created via createdBy OR admin-created via userId)
    const userIds = users.map((u) => u?._id).filter(Boolean);
    const countsByUserId = new Map();
    if (userIds.length > 0) {
      const counts = await Card.aggregate([
        {
          $match: {
            $or: [{ createdBy: { $in: userIds } }, { userId: { $in: userIds } }],
          },
        },
        {
          $project: {
            ownerUserId: { $ifNull: ["$userId", "$createdBy"] },
          },
        },
        {
          $group: {
            _id: "$ownerUserId",
            count: { $sum: 1 },
          },
        },
      ]);
      counts.forEach((c) => {
        if (c?._id) countsByUserId.set(String(c._id), Number(c.count || 0));
      });
    }

    const usersWithMeta = users.map((u) => {
      const obj = u?.toObject ? u.toObject() : u;
      const cardsCount = countsByUserId.get(String(u._id)) || 0;
      const createdByAdminName = obj?.createdByAdmin?.name || "";
      return {
        ...obj,
        cardsCount,
        createdByType: createdByAdminName ? "admin" : "self",
        createdByAdminName: createdByAdminName || null,
      };
    });

    res.json({
      success: true,
      data: {
        users: usersWithMeta,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum) || 0,
          totalUsers: total,
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate(
        "inquiries",
        "name email phone message status createdAt businessType resolved cardGenerated cardId adminNotes"
      )
      .populate("savedCards", "title categoryId templateId data createdAt")
      .populate(
        "appointments",
        "name email phone message status appointmentDate appointmentTime createdAt"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// @desc    Create new user (for inquiry users)
// @route   POST /api/users
// @access  Public
export const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { name, email, phone, businessType } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const user = new User({
      name,
      email,
      phone,
      businessType,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { name, email, phone, businessType, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (businessType) user.businessType = businessType;
    if (typeof isActive === "boolean") user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

// @desc    Delete user (cascade: delete user's inquiries and cards for those inquiries)
// @route   DELETE /api/users/:id
// @access  Private
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userInquiries = await Inquiry.find(
      { userId: req.params.id },
      "cardId"
    ).lean();
    const cardIdsToDelete = userInquiries.map((i) => i.cardId).filter(Boolean);
    if (cardIdsToDelete.length > 0) {
      await Card.deleteMany({ _id: { $in: cardIdsToDelete } });
    }
    await Inquiry.deleteMany({ userId: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

// @desc    Bulk delete users (admin/superadmin; requires password)
// @route   POST /api/users/bulk-delete
// @access   Private (admin or superadmin)
export const bulkDeleteUsers = async (req, res) => {
  try {
    const { userIds, password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password is required to delete users",
      });
    }
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one user must be selected",
      });
    }
    const validIds = userIds.filter((id) => validateObjectId(id));
    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid user IDs provided",
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

    const userInquiries = await Inquiry.find(
      { userId: { $in: validIds } },
      "cardId"
    ).lean();
    const cardIdsToDelete = userInquiries.map((i) => i.cardId).filter(Boolean);
    if (cardIdsToDelete.length > 0) {
      await Card.deleteMany({ _id: { $in: cardIdsToDelete } });
    }
    await Inquiry.deleteMany({ userId: { $in: validIds } });
    const result = await User.deleteMany({ _id: { $in: validIds } });
    res.json({
      success: true,
      message: `${result.deletedCount} user(s) deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error bulk deleting users:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete users",
    });
  }
};

// @desc    Get user's inquiries
// @route   GET /api/users/:id/inquiries
// @access  Private
export const getUserInquiries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { userId: req.params.id };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const inquiries = await Inquiry.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Inquiry.countDocuments(query);

    res.json({
      success: true,
      data: {
        inquiries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalInquiries: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user inquiries:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user inquiries",
      error: error.message,
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Private
export const getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get inquiry statistics
    const totalInquiries = await Inquiry.countDocuments({ userId });
    const newInquiries = await Inquiry.countDocuments({
      userId,
      status: "New",
    });
    const inProgressInquiries = await Inquiry.countDocuments({
      userId,
      status: "In Progress",
    });
    const completedInquiries = await Inquiry.countDocuments({
      userId,
      status: "Completed",
    });
    const resolvedInquiries = await Inquiry.countDocuments({
      userId,
      resolved: true,
    });
    const cardGeneratedInquiries = await Inquiry.countDocuments({
      userId,
      cardGenerated: true,
    });

    // Get recent inquiries (last 5)
    const recentInquiries = await Inquiry.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email phone message status createdAt businessType");

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          businessType: user.businessType,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        stats: {
          totalInquiries,
          newInquiries,
          inProgressInquiries,
          completedInquiries,
          resolvedInquiries,
          cardGeneratedInquiries,
        },
        recentInquiries,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user statistics",
      error: error.message,
    });
  }
};

// @desc    Find or create user by email (for inquiry submission)
// @route   POST /api/users/find-or-create
// @access  Public
export const findOrCreateUser = async (req, res) => {
  try {
    const { name, email, phone, businessType } = req.body;

    // Try to find existing user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if not found
      user = new User({
        name,
        email,
        phone,
        businessType,
      });
      await user.save();
    } else {
      // Update existing user with new information if provided
      if (name && name !== user.name) user.name = name;
      if (phone && phone !== user.phone) user.phone = phone;
      if (businessType && businessType !== user.businessType)
        user.businessType = businessType;

      await user.save();
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error finding or creating user:", error);
    res.status(500).json({
      success: false,
      message: "Error finding or creating user",
      error: error.message,
    });
  }
};

// @desc    Save card for user
// @route   POST /api/users/:id/save-card
// @access  Private
export const saveCard = async (req, res) => {
  try {
    const { cardId } = req.body;

    if (!cardId) {
      return res.status(400).json({
        success: false,
        message: "Card ID is required",
      });
    }

    // Check if card exists
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Card not found",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if card is already saved
    if (user.savedCards.includes(cardId)) {
      return res.status(400).json({
        success: false,
        message: "Card is already saved",
      });
    }

    // Add card to saved cards
    user.savedCards.push(cardId);
    await user.save();

    // Increment card saves counter (analytics)
    try {
      await Card.findByIdAndUpdate(cardId, { $inc: { saves: 1 } });
    } catch (e) {
      console.warn("Failed to increment card saves count:", e?.message || e);
    }

    res.json({
      success: true,
      message: "Card saved successfully",
      data: {
        savedCards: user.savedCards,
      },
    });
  } catch (error) {
    console.error("Error saving card:", error);
    res.status(500).json({
      success: false,
      message: "Error saving card",
      error: error.message,
    });
  }
};

// @desc    Remove saved card from user
// @route   DELETE /api/users/:id/saved-cards/:cardId
// @access  Private
export const removeSavedCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Remove card from saved cards
    user.savedCards = user.savedCards.filter((id) => id.toString() !== cardId);
    await user.save();

    // Decrement card saves counter (analytics) – best effort, ignore errors
    try {
      await Card.findByIdAndUpdate(cardId, { $inc: { saves: -1 } });
    } catch (e) {
      console.warn("Failed to decrement card saves count:", e?.message || e);
    }

    res.json({
      success: true,
      message: "Card removed from saved cards",
      data: {
        savedCards: user.savedCards,
      },
    });
  } catch (error) {
    console.error("Error removing saved card:", error);
    res.status(500).json({
      success: false,
      message: "Error removing saved card",
      error: error.message,
    });
  }
};

// @desc    Get user's saved cards
// @route   GET /api/users/:id/saved-cards
// @access  Private
export const getSavedCards = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findById(req.params.id).populate({
      path: "savedCards",
      options: {
        sort: { createdAt: -1 },
        limit: limit * 1,
        skip: (page - 1) * limit,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const total = user.savedCards.length;

    res.json({
      success: true,
      data: {
        savedCards: user.savedCards,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCards: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching saved cards:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching saved cards",
      error: error.message,
    });
  }
};

// @desc    Get user's appointments
// @route   GET /api/users/:id/appointments
// @access  Private
export const getUserAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, summary = false } = req.query;

    // If summary is requested, return lightweight summary
    if (summary === "true") {
      const pipeline = [
        { $match: { userId: req.params.id } },
        {
          $group: {
            _id: null,
            totalAppointments: { $sum: 1 },
            pendingAppointments: {
              $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
            },
            confirmedAppointments: {
              $sum: { $cond: [{ $eq: ["$status", "Confirmed"] }, 1, 0] },
            },
            completedAppointments: {
              $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
            },
            recentAppointments: {
              $push: {
                _id: "$_id",
                status: "$status",
                appointmentDate: "$appointmentDate",
                createdAt: "$createdAt",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalAppointments: 1,
            pendingAppointments: 1,
            confirmedAppointments: 1,
            completedAppointments: 1,
            recentAppointments: {
              $slice: [
                {
                  $sortArray: {
                    input: "$recentAppointments",
                    sortBy: { createdAt: -1 },
                  },
                },
                5,
              ],
            },
          },
        },
      ];

      const result = await Appointment.aggregate(pipeline);
      const summary = result[0] || {
        totalAppointments: 0,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0,
        recentAppointments: [],
      };

      return res.json({
        success: true,
        data: summary,
      });
    }

    // Regular paginated appointments
    const query = { userId: req.params.id };

    if (status) {
      query.status = status;
    }

    // Use aggregation for better performance
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: "cards",
          localField: "cardId",
          foreignField: "_id",
          as: "card",
          pipeline: [{ $project: { title: 1, categoryId: 1, templateId: 1 } }],
        },
      },
      { $unwind: { path: "$card", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          message: 1,
          status: 1,
          appointmentDate: 1,
          appointmentTime: 1,
          responded: 1,
          createdAt: 1,
          cardId: 1,
          card: 1,
        },
      },
    ];

    const [appointments, total] = await Promise.all([
      Appointment.aggregate(pipeline),
      Appointment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalAppointments: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user appointments",
      error: error.message,
    });
  }
};
