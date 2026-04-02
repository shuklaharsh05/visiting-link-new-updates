import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

contactSchema.index({ userId: 1, phone: 1 });
contactSchema.index({ userId: 1, email: 1 });

export default mongoose.model("Contact", contactSchema);

