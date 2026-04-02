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

const submissionSchema = new mongoose.Schema(
  {
    // Core identity
    name: { type: String, required: true },
    title: { type: String },
    company: { type: String },
    tagline: { type: String },
    profilePic: { type: String },

    // Contact flattened to match frontend
    email: String,
    phone: String,
    website: String,

    // Location
    location: String,
    address: String,

    // Content sections
    about: String,
    services: [String],
    portfolio: [PortfolioItemSchema],
    appointments: [AppointmentSchema],
    appDownload: AppDownloadSchema,
    social: SocialSchema,
    contactForm: ContactFormSchema,

    // Presentation
    design: DesignSchema,
    layout: LayoutSchema,

    // Workflow status
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },

    // Backward-compat fields (for older payloads); optional
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
  { timestamps: true }
);

export default mongoose.model("Submission", submissionSchema, "submissions");
