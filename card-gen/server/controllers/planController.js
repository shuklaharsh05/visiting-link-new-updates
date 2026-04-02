import Plan from "../models/Plan.js";

// Public endpoint: get active plans (for pricing display)
export const getPublicPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ active: true }).select(
      "key name amount currency"
    );
    res.json({
      success: true,
      data: plans,
    });
  } catch (err) {
    console.error("Error fetching plans:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch plans",
      message: err.message,
    });
  }
};

