import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      enum: ["basic", "pro"],
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true, // base price in INR
    },
    currency: {
      type: String,
      default: "INR",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "plans",
  }
);

export default mongoose.model("Plan", planSchema);

