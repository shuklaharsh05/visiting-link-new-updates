import mongoose from "mongoose";
import crypto from "crypto";

const detailsSchema = new mongoose.Schema(
  {
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: true,
      unique: true,
    },
    detailsToken: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    // Same shape as Card.data (text fields only) so Apply maps 1:1
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    appliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "details",
  }
);

detailsSchema.index({ detailsToken: 1 });
detailsSchema.index({ cardId: 1 });

function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

detailsSchema.statics.getOrCreateForCard = async function (cardId) {
  let details = await this.findOne({ cardId });
  if (details) return details;
  details = new this({
    cardId,
    detailsToken: generateToken(),
    data: {},
  });
  await details.save();
  return details;
};

export default mongoose.model("Details", detailsSchema);
export { generateToken };
