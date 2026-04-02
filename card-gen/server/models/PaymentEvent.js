import mongoose from "mongoose";

const paymentEventSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ["razorpay-webhook", "verify-wallet", "verify-inquiry", "verify-plan"],
      required: true,
    },
    eventId: { type: String, trim: true },
    paymentId: { type: String, trim: true },
    orderId: { type: String, trim: true },
    handledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

paymentEventSchema.index(
  { source: 1, eventId: 1 },
  { unique: true, sparse: true }
);
paymentEventSchema.index(
  { source: 1, paymentId: 1 },
  { unique: true, sparse: true }
);
paymentEventSchema.index(
  { source: 1, orderId: 1 },
  { unique: true, sparse: true }
);

export default mongoose.model("PaymentEvent", paymentEventSchema);
