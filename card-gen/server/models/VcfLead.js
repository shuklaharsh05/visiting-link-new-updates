import mongoose from "mongoose";

const vcfLeadSchema = new mongoose.Schema(
  {
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: true,
      index: true,
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    visitorName: { type: String, required: true, trim: true },
    visitorPhone: { type: String, required: true, trim: true },
    purpose: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

vcfLeadSchema.index({ ownerUserId: 1, createdAt: -1 });

export default mongoose.model("VcfLead", vcfLeadSchema);
