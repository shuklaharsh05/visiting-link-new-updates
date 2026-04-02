import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import routes from "./routes/index.js";
import { assignRequestId, requestLogger, sanitizeInput, apiLimiter } from "./middleware/securityMiddleware.js";

dotenv.config();

const requiredEnvVars = ["JWT_SECRET", "MONGO_URI", "ADMIN_USERNAME", "ADMIN_PASSWORD"];
const missingEnvVars = requiredEnvVars.filter((k) => !process.env[k]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

const app = express();

// Middlewares
app.use(assignRequestId);
app.use(requestLogger);
app.use(helmet());
app.use(cors({
  origin: ["https://teamserver.cloud", "https://www.visitinglink.com", "http://localhost:5173", "http://localhost:3000", "https://card-gen-landing-page.vercel.app", "http://localhost:5174"], // allowed domains
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,  // if you're using cookies or tokens
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(apiLimiter);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(mongoSanitize());
app.use(sanitizeInput);

// Routes
app.use("/api", routes);

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error("Error:", err);
  // Multer file size limit (e.g. PDF or image too large)
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      error: "File size must be 10 MB or less.",
    });
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error"
  });
});

app.get("/", (req, res) => {
  res.send("API is running...");
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // Drop old non-sparse email index so sparse unique index allows multiple null emails (phone-only users)
    const User = (await import("./models/User.js")).default;
    await User.collection.dropIndex("email_1").catch(() => {});
    await User.syncIndexes();
  } catch (err) {
    // console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

connectDB();

// Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});