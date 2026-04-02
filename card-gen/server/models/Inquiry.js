import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
  // Reference to the user who sent this inquiry
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional for backward compatibility
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: false,
    default: '',
    trim: true
  },
  businessType: {
    type: String,
    required: false,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['New', 'In Progress', 'Completed', 'Archived'],
    default: 'New'
  },
  // Whether the inquiry has been resolved by admin
  resolved: {
    type: Boolean,
    default: false
  },
  // Whether a card has been generated for this inquiry
  cardGenerated: {
    type: Boolean,
    default: false
  },
  // Reference to generated card (if any)
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    default: null
  },
  // Generated card data for preview
  generatedCard: {
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    hiddenFields: [{
      type: String,
      trim: true
    }],
    categoryId: {
      type: String,
      trim: true
    },
    templateId: {
      type: String,
      trim: true
    }
  },
  // Admin notes
  adminNotes: {
    type: String,
    trim: true
  },
  // Assigned admin
  assignedTo: {
    type: String,
    trim: true,
    default: null
  },
  // Payment information
  payment: {
    // Selected plan for this inquiry (e.g. basic, pro)
    plan: {
      type: String,
      enum: ["basic", "pro"],
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    amount: { type: Number },
    currency: { type: String, default: 'INR' },
    gateway: { type: String },
    paymentId: { type: String },
    orderId: { type: String },
    paymentDate: { type: Date },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed }
  },
  // User-submitted card data (text only) - stored after payment
  userCardData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  userCardDataSubmitted: {
    type: Boolean,
    default: false
  },
  userCardDataSubmittedAt: {
    type: Date
  },
  isCustomCard: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'inquiries'
});

// Indexes for better query performance
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ businessType: 1 });
inquirySchema.index({ email: 1 });
inquirySchema.index({ assignedTo: 1 });
inquirySchema.index({ userId: 1, createdAt: -1 });
inquirySchema.index({ "payment.orderId": 1 }, { sparse: true });

// Static methods
inquirySchema.statics.getByStatus = function(status) {
  return this.find({ status: status }).sort({ createdAt: -1 });
};

inquirySchema.statics.getByBusinessType = function(businessType) {
  return this.find({ businessType: businessType }).sort({ createdAt: -1 });
};

inquirySchema.statics.getPendingInquiries = function() {
  return this.find({ status: { $in: ['New', 'In Progress'] } }).sort({ createdAt: -1 });
};

inquirySchema.statics.getByAssignedAdmin = function(adminName) {
  return this.find({ assignedTo: adminName }).sort({ createdAt: -1 });
};

export default mongoose.model('Inquiry', inquirySchema);
