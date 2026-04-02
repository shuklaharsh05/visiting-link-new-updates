import User from "../models/User.js";
import { validationResult } from "express-validator";

const isSuperadmin = (req) => req?.user?.role === "superadmin";
const isAdmin = (req) => req?.user?.role === "admin";
const getAdminId = (req) => req?.user?.id;

// POST /api/admin/users (admin creates user)
export const adminCreateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    if (!isAdmin(req) && !isSuperadmin(req)) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const { name, email, phone, password, businessType } = req.body || {};
    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: "name, phone, and password are required",
      });
    }

    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    const trimmedPhone = String(phone).trim();

    if (normalizedEmail) {
      const existsByEmail = await User.findOne({ email: normalizedEmail });
      if (existsByEmail) {
        return res
          .status(400)
          .json({ success: false, error: "User already exists with this email" });
      }
    }

    const existsByPhone = await User.findOne({ phone: trimmedPhone });
    if (existsByPhone) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists with this phone" });
    }

    const adminId = getAdminId(req);

    const user = await User.create({
      name,
      email: normalizedEmail || undefined,
      phone: trimmedPhone,
      password,
      businessType: businessType || undefined,
      ...(isAdmin(req) ? { createdByAdmin: adminId } : {}),
    });

    return res.status(201).json({
      success: true,
      message: "User created",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessType: user.businessType,
        createdByAdmin: user.createdByAdmin || null,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/admin/users (admin lists their users; superadmin can see all)
export const adminListUsers = async (req, res) => {
  try {
    if (!isAdmin(req) && !isSuperadmin(req)) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const { page = 1, limit = 20, search } = req.query || {};
    const query = {};

    if (isAdmin(req)) {
      query.createdByAdmin = getAdminId(req);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await User.countDocuments(query);

    return res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalUsers: total,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/admin/users/:userId
export const adminGetUser = async (req, res) => {
  try {
    if (!isAdmin(req) && !isSuperadmin(req)) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const user = await User.findById(req.params.userId).lean();
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    if (isAdmin(req) && String(user.createdByAdmin || "") !== String(getAdminId(req))) {
      return res.status(403).json({ success: false, error: "Not authorized for this user" });
    }

    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

