import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Email is optional (phone-only users won't have it); unique only when present (sparse allows multiple nulls).
    email: { type: String, required: false, lowercase: true, trim: true },
    password: { type: String, required: false, select: false }, // Optional for users who don't need authentication
    googleId: { type: String, required: false, unique: true, sparse: true }, // Google OAuth ID
    phone: { type: String, required: false, trim: true },
    // Reference to inquiries sent by this user
    inquiries: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inquiry'
    }],
    // Reference to cards saved by this user
    savedCards: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card'
    }],
    // Reference to appointments made by this user
    appointments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    }],
    // Additional fields for users
    businessType: { 
      type: String, 
      required: false,
      enum: [
        'E-commerce',
        'Interior Designer', 
        'Makeup Artist',
        'Travel Agent',
        'Other'
      ]
    },
    // Subscription / plan info
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro'],
      default: 'free',
    },
    planPayment: {
      status: {
        type: String,
        enum: ['Pending', 'Processing', 'Completed', 'Failed'],
        default: 'Pending',
      },
      plan: {
        type: String,
        enum: ['basic', 'pro'],
      },
      amount: { type: Number },
      currency: { type: String, default: 'INR' },
      gateway: { type: String },
      paymentId: { type: String },
      orderId: { type: String },
      paymentDate: { type: Date },
      gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    },
    isActive: { type: Boolean, default: true },

    // Reseller/admin who created this user (if any)
    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Sparse unique index: multiple users can have email: null; only non-null emails must be unique.
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { sparse: true });
userSchema.index({ "planPayment.orderId": 1 }, { sparse: true });

// Encrypt password before save (only if password exists)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Password check (only for users with passwords)
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
