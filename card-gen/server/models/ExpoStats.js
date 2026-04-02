import mongoose from "mongoose";

const expoStatsSchema = new mongoose.Schema(
  {
    bookmyshowClicks: { type: Number, default: 0 },
    razorpayClicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("ExpoStats", expoStatsSchema);
