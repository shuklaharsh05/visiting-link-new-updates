import mongoose from "mongoose";

const expoSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["submission"],
      required: true,
      default: "submission",
      index: true,
    },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { timestamps: true }
);

expoSchema.index({ type: 1, createdAt: -1 });
expoSchema.index({ type: 1, name: 1, phone: 1 }); // for idempotent submission lookup

export default mongoose.model("Expo", expoSchema);
