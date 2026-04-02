import mongoose from "mongoose";
import dotenv from "dotenv";
import Plan from "../models/Plan.js";

dotenv.config();

async function seedPlans() {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error("MONGO_URI is not set in the environment.");
    process.exit(1);
  }

  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    const plansToUpsert = [
      {
        key: "basic",
        name: "Individual",
        amount: 999, // ₹1 – update as needed
      },
      {
        key: "pro",
        name: "Business",
        amount: 1999, // ₹2 – update as needed
      },
    ];

    for (const plan of plansToUpsert) {
      const updated = await Plan.findOneAndUpdate(
        { key: plan.key },
        {
          $set: {
            name: plan.name,
            amount: plan.amount,
            currency: "INR",
            active: true,
          },
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Upserted plan: ${updated.key} -> ₹${updated.amount}`);
    }

    console.log("🎉 Plan seeding completed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding plans:", err);
    process.exit(1);
  }
}

seedPlans();

