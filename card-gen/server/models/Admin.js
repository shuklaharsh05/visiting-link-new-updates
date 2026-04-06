import mongoose from 'mongoose';
import bcrypt from "bcryptjs";

const TransactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String }, // e.g. razorpay
    status: { type: String }, // e.g. success/failed/processing
    reason: { type: String }, // e.g. card_creation, recharge
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: "Card" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    razorpayPaymentId: { type: String },
    razorpayOrderId: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin'
  },
  type: {
    type: String,
    enum: ["in-house", "corporate", "individual"],
    default: "individual",
  },
  costPerCard: {
    type: Number,
    required: false,
    min: 0,
    default: 0,
  },
  walletBalance: {
    type: Number,
    required: false,
    min: 0,
    default: 0,
  },
  transactions: {
    type: [TransactionSchema],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'admins'
});

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

// Compare password method (bcrypt)
adminSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find by name
adminSchema.statics.findByName = function(name) {
  return this.findOne({ name: name, isActive: true }).select("+password");
};

// Index for better query performance
adminSchema.index({ name: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ walletBalance: 1 });

export default mongoose.model('Admin', adminSchema);
