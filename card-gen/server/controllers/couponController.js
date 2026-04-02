import Coupon from "../models/Coupon.js";

// List all coupons (superadmin)
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: coupons,
    });
  } catch (err) {
    console.error("Error fetching coupons:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch coupons",
      message: err.message,
    });
  }
};

// Create a new coupon (superadmin)
export const createCoupon = async (req, res) => {
  try {
    const { code, discountPercent, maxOffAmount } = req.body || {};

    if (!code || typeof discountPercent !== "number") {
      return res.status(400).json({
        success: false,
        error: "code and discountPercent are required",
      });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Coupon with this code already exists",
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType: "percentage",
      discountValue: discountPercent,
      maxDiscountAmount:
        typeof maxOffAmount === "number" && maxOffAmount > 0
          ? maxOffAmount
          : undefined,
      active: true,
    });

    res.status(201).json({
      success: true,
      data: coupon,
    });
  } catch (err) {
    console.error("Error creating coupon:", err);
    res.status(500).json({
      success: false,
      error: "Failed to create coupon",
      message: err.message,
    });
  }
};

// Delete (hard delete) coupon (superadmin)
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Coupon not found",
      });
    }
    res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting coupon:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete coupon",
      message: err.message,
    });
  }
};

