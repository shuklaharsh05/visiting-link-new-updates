import mongoose from "mongoose";

// Sub-schemas for structured card data aligned with frontend CardData
const PortfolioItemSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    image: String,
  },
  { _id: false }
);

const AppointmentSchema = new mongoose.Schema(
  {
    day: String,
    time: String,
    available: { type: Boolean, default: true },
  },
  { _id: false }
);

const AppDownloadSchema = new mongoose.Schema(
  {
    appName: String,
    description: String,
    playStoreUrl: String,
    appStoreUrl: String,
  },
  { _id: false }
);

const SocialSchema = new mongoose.Schema(
  {
    facebook: String,
    instagram: String,
    linkedin: String,
    twitter: String,
  },
  { _id: false }
);

const ContactFormSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    fields: [String],
  },
  { _id: false }
);

const DesignSchema = new mongoose.Schema(
  {
    colors: {
      text: { type: String, default: "#111827" },
      background: { type: String, default: "#ffffff" },
      accent: { type: String, default: "#3b82f6" },
    },
    fontFamily: { type: String, default: "Inter, ui-sans-serif, system-ui" },
    // Optional: raw CSS for very custom tweaks (use with caution)
    customCss: { type: String },
  },
  { _id: false }
);

const LayoutSchema = new mongoose.Schema(
  {
    sectionOrder: { type: [String], default: [] },
    locked: { type: Boolean, default: false },
  },
  { _id: false }
);

const cardSchema = new mongoose.Schema(
  {
    // Reference to inquiry (client). Optional for self-serve user cards.
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inquiry",
      required: false,
    },

    // Owner for self-serve cards created directly by end users
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    // Owner user for reseller/superadmin-created cards (shows in user's My Cards)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    // Reseller admin who created this card (null if self-serve or superadmin-created)
    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
      index: true,
    },

    // Edit tracking
    lastEditedBy: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      required: false,
      index: true,
    },

    // Category and template reference
    categoryId: {
      type: String,
      required: true,
      trim: true,
    },
    templateId: {
      type: String,
      required: true,
      trim: true,
    },

    // Card data - all fields from the form
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },

    // Fields that are toggled OFF (hidden from display)
    hiddenFields: [
      {
        type: String,
        trim: true,
      },
    ],

    // Customization options (for custom templates)
    customizations: {
      // Legacy customizations (for backward compatibility)
      background: {
        type: String,
        default: "#ffffff",
      },
      icons: {
        type: String,
        default: "modern",
      },
      extraSections: [
        {
          name: String,
          enabled: { type: Boolean, default: false },
          data: mongoose.Schema.Types.Mixed,
        },
      ],
      layout: {
        type: String,
        default: "vertical",
      },
      typography: {
        fontFamily: { type: String, default: "Inter, sans-serif" },
        fontSize: { type: String, default: "14px" },
        fontWeight: { type: String, default: "normal" },
      },

      // New customised card builder fields
      coverImage: { type: String },
      backgroundImage: { type: String },
      sectionIcons: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      textColors: {
        heading: { type: String, default: "#111827" },
        paragraph: { type: String, default: "#374151" },
      },
      sectionOrder: {
        type: [String],
        default: [
          "about",
          "services",
          "portfolio",
          "achievements",
          "clients",
          "team",
          "contact",
          "social",
        ],
      },
      sectionVisibility: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },

    // Presentation
    design: DesignSchema,
    layout: LayoutSchema,

    // Workflow status
    status: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Draft",
    },

    // Payment status
    paymentStatus: {
      type: String,
      enum: ["Pending", "Done"],
      default: "Pending",
    },

    // Purchased plan associated with this card (e.g. basic, pro)
    plan: {
      type: String,
      enum: ["basic", "pro"],
    },

    // Admin reference
    adminId: {
      type: String,
      default: "admin",
    },

    // Public sharing
    isPublic: { type: Boolean, default: false },
    // Whether this card should render using the custom card builder
    isCustom: { type: Boolean, default: false },
    shareableLink: String,
    qrCode: String,
    reviewFunnel: {
      totalRatings: { type: Number, default: 0 },
      googleClicks: { type: Number, default: 0 },
      ratingCounts: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
      },
      lastRatedAt: { type: Date },
      lastGoogleClickAt: { type: Date },
    },

    // Analytics
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    shopLinkClicks: { type: Map, of: Number, default: () => new Map() }, // Track clicks per shop name: { "amazon": 50, "flipkart": 45 }
    lastViewed: Date,
    // Daily view counts for analytics charts
    viewsHistory: [
      {
        date: { type: String, required: true }, // YYYY-MM-DD
        count: { type: Number, default: 0 },
      },
    ],

    // Legacy fields for backward compatibility
    name: { type: String },
    title: { type: String },
    company: { type: String },
    tagline: { type: String },
    profilePic: { type: String },
    email: String,
    phone: String,
    website: String,
    location: String,
    address: String,
    about: String,
    services: [String],
    portfolio: [PortfolioItemSchema],
    appointments: [AppointmentSchema],
    appDownload: AppDownloadSchema,
    social: SocialSchema,
    contactForm: ContactFormSchema,
    cardData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    contact: {
      phone: String,
      email: String,
      website: String,
    },
    socialLinks: {
      facebook: String,
      instagram: String,
      linkedin: String,
      twitter: String,
    },
    appointment: String,
  },
  {
    timestamps: true,
    collection: "cards", // Explicitly set collection name
  }
);

// Index for better query performance
cardSchema.index({ clientId: 1 });
cardSchema.index({ createdBy: 1 });
cardSchema.index({ createdBy: 1, updatedAt: -1 });
cardSchema.index({ createdBy: 1, templateId: 1 });
cardSchema.index({ userId: 1, updatedAt: -1 });
cardSchema.index({ createdByAdmin: 1, updatedAt: -1 });
cardSchema.index({ categoryId: 1, templateId: 1 });
cardSchema.index({ templateId: 1 });
cardSchema.index({ adminId: 1, status: 1 });
cardSchema.index({ shareableLink: 1 });
cardSchema.index({ isPublic: 1 });
cardSchema.index({ status: 1, createdAt: -1 });

// Virtual for shareable link generation
cardSchema.virtual("publicUrl").get(function () {
  const frontendUrl = "https://teamserver.cloud";
  return `${frontendUrl}/cards/${this._id}`;
});

// Pre-save middleware to generate shareable link
cardSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("isPublic")) {
    this.shareableLink = this.publicUrl;
  }
  next();
});

// Instance method to validate card data against template
cardSchema.methods.validateAgainstTemplate = async function () {
  const Category = mongoose.model("Category");
  const category = await Category.findByTemplateId(this.templateId);

  if (!category) {
    return {
      isValid: false,
      errors: [`Template '${this.templateId}' not found in any category`],
    };
  }

  // Combine basic card data with template-specific cardData
  const allCardData = {
    ...this.toObject(),
    ...this.cardData,
  };

  return category.validateTemplateData(this.templateId, allCardData);
};

// Static method to get cards by client (inquiry)
cardSchema.statics.findByClient = function (clientId) {
  return this.find({ clientId: clientId });
};

// Static method to get cards by template
cardSchema.statics.findByTemplate = function (templateId) {
  return this.find({ templateId: templateId });
};

// Static method to get cards by category
cardSchema.statics.findByCategory = function (categoryId) {
  return this.find({ categoryId: categoryId });
};

// Static method to get cards by category and template
cardSchema.statics.findByCategoryAndTemplate = function (
  categoryId,
  templateId
) {
  return this.find({ categoryId: categoryId, templateId: templateId });
};

// Static method to get cards by admin
cardSchema.statics.findByAdmin = function (adminId) {
  return this.find({ adminId: adminId });
};

export default mongoose.model("Card", cardSchema);
