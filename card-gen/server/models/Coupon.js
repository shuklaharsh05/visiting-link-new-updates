import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true, // e.g. 10 => 10% or ₹10 depending on type
    },
    maxDiscountAmount: {
      type: Number, // optional cap for percentage coupons
    },
    applicablePlans: [
      {
        type: String,
        enum: ["basic", "pro"],
      },
    ], // empty or undefined => all plans
    active: {
      type: Boolean,
      default: true,
    },
    validFrom: {
      type: Date,
    },
    validUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "coupons",
  }
);

export default mongoose.model("Coupon", couponSchema);

