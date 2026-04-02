import mongoose from "mongoose";

const pinnedInquirySchema = new mongoose.Schema(
  {
    inquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inquiry",
      required: true,
    },
    // Admin for whom this inquiry is pinned (id as string: 'superadmin' or admin._id.toString())
    forAdminId: {
      type: String,
      required: true,
    },
    // Admin who pinned it (id as string) – used to order: superadmin pins first, then own pins
    pinnedByAdminId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "pinned_inquiries",
  }
);

pinnedInquirySchema.index({ inquiryId: 1, forAdminId: 1 }, { unique: true });
pinnedInquirySchema.index({ forAdminId: 1 });

export default mongoose.model("PinnedInquiry", pinnedInquirySchema);
