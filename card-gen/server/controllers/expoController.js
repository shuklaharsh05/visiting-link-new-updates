import Expo from "../models/Expo.js";
import ExpoStats from "../models/ExpoStats.js";

// @desc    Submit expo visitor form (name, phone). Idempotent: same name+phone returns existing record.
// @route   POST /api/expo/submissions
// @access  Public
export const createSubmission = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    const nameTrimmed = String(name).trim();
    const phoneTrimmed = String(phone).trim();

    const existing = await Expo.findOne({
      type: "submission",
      name: nameTrimmed,
      phone: phoneTrimmed,
    });

    if (existing) {
      return res.status(201).json({
        success: true,
        data: { _id: existing._id, name: existing.name, phone: existing.phone },
      });
    }

    const doc = await Expo.create({
      type: "submission",
      name: nameTrimmed,
      phone: phoneTrimmed,
    });

    res.status(201).json({
      success: true,
      data: { _id: doc._id, name: doc.name, phone: doc.phone },
    });
  } catch (error) {
    console.error("Error creating expo submission:", error);
    res.status(500).json({
      success: false,
      message: "Error saving submission",
      error: error.message,
    });
  }
};

// @desc    Record a BookMyShow link click (increments counter)
// @route   POST /api/expo/clicks/bookmyshow
// @access  Public
export const recordBookMyShowClick = async (req, res) => {
  try {
    await ExpoStats.findOneAndUpdate(
      {},
      { $inc: { bookmyshowClicks: 1 } },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: "Click recorded" });
  } catch (error) {
    console.error("Error recording BookMyShow click:", error);
    res.status(500).json({
      success: false,
      message: "Error recording click",
      error: error.message,
    });
  }
};

// @desc    Record a Razorpay link click (increments counter)
// @route   POST /api/expo/clicks/razorpay
// @access  Public
export const recordRazorpayClick = async (req, res) => {
  try {
    await ExpoStats.findOneAndUpdate(
      {},
      { $inc: { razorpayClicks: 1 } },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: "Click recorded" });
  } catch (error) {
    console.error("Error recording Razorpay click:", error);
    res.status(500).json({
      success: false,
      message: "Error recording click",
      error: error.message,
    });
  }
};
