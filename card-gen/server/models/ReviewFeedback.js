import mongoose from "mongoose";

const reviewFeedbackSchema = new mongoose.Schema(
  {
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    feedback: { type: String, trim: true },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    source: { type: String, default: "google-review-funnel" },
  },
  { timestamps: true, collection: "review_feedback" }
);

reviewFeedbackSchema.index({ cardId: 1, createdAt: -1 });

export default mongoose.model("ReviewFeedback", reviewFeedbackSchema);

