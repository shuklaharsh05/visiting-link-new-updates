import crypto from "crypto";
import Razorpay from "razorpay";
import Admin from "../models/Admin.js";
import PaymentEvent from "../models/PaymentEvent.js";

let razorpayInstance = null;
const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_SECRET;
    if (!keyId || !keySecret) return null;
    razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return razorpayInstance;
};

const isSuperadmin = (req) => req?.user?.role === "superadmin";
const getAdminId = (req) => req?.user?.id; // admin tokens set req.user.id

export const getMyWallet = async (req, res) => {
  try {
    if (isSuperadmin(req)) {
      return res.json({
        success: true,
        data: {
          walletBalance: null,
          costPerCard: null,
          transactions: [],
          note: "Superadmin does not use wallet",
        },
      });
    }

    const adminId = getAdminId(req);
    if (!adminId) return res.status(401).json({ success: false, error: "Not authorized" });

    const admin = await Admin.findById(adminId).lean();
    if (!admin) return res.status(404).json({ success: false, error: "Admin not found" });

    return res.json({
      success: true,
      data: {
        walletBalance: admin.walletBalance || 0,
        costPerCard: admin.costPerCard || 0,
        type: admin.type || "individual",
        transactions: (admin.transactions || []).slice().reverse().slice(0, 200),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const createWalletRechargeOrder = async (req, res) => {
  try {
    if (isSuperadmin(req)) {
      return res.status(400).json({ success: false, error: "Superadmin does not recharge wallet" });
    }

    const adminId = getAdminId(req);
    if (!adminId) return res.status(401).json({ success: false, error: "Not authorized" });

    const { amount } = req.body || {};
    const rechargeAmount = Number(amount);
    if (!rechargeAmount || Number.isNaN(rechargeAmount) || rechargeAmount <= 0) {
      return res.status(400).json({ success: false, error: "Valid amount is required" });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ success: false, error: "Admin not found" });

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        error: "Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_SECRET.",
      });
    }

    const shortAdminId = adminId.toString().slice(-10);
    const shortTimestamp = Date.now().toString().slice(-8);
    const receiptId = `wal_${shortAdminId}_${shortTimestamp}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount: Math.round(rechargeAmount * 100),
      currency: "INR",
      receipt: receiptId,
      notes: {
        adminId: adminId.toString(),
        type: "wallet_recharge",
      },
    });

    // Record a processing transaction entry (no balance change yet)
    admin.transactions = admin.transactions || [];
    admin.transactions.push({
      type: "credit",
      amount: rechargeAmount,
      method: "razorpay",
      status: "processing",
      reason: "wallet_recharge",
      razorpayOrderId: order.id,
      createdAt: new Date(),
    });
    await admin.save();

    return res.json({
      success: true,
      orderId: order.id,
      amount: rechargeAmount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      receipt: order.receipt,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const verifyWalletRecharge = async (req, res) => {
  try {
    if (isSuperadmin(req)) {
      return res.status(400).json({ success: false, error: "Superadmin does not recharge wallet" });
    }

    const adminId = getAdminId(req);
    if (!adminId) return res.status(401).json({ success: false, error: "Not authorized" });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: "Missing verification params" });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }

    const admin = await Admin.findById(adminId).select("walletBalance transactions");
    if (!admin) return res.status(404).json({ success: false, error: "Admin not found" });

    const tx = (admin.transactions || []).find((t) => t.razorpayOrderId === razorpay_order_id);
    if (!tx) {
      return res.status(404).json({ success: false, error: "Recharge transaction not found" });
    }
    if (tx.status === "success") {
      return res.json({
        success: true,
        message: "Already verified",
        walletBalance: admin.walletBalance || 0,
      });
    }

    const updated = await Admin.findOneAndUpdate(
      {
        _id: adminId,
        transactions: {
          $elemMatch: {
            razorpayOrderId: razorpay_order_id,
            status: "processing",
          },
        },
      },
      {
        $set: {
          "transactions.$.status": "success",
          "transactions.$.razorpayPaymentId": razorpay_payment_id,
        },
        $inc: { walletBalance: Number(tx.amount || 0) },
      },
      { new: true, projection: { walletBalance: 1 } }
    );

    if (!updated) {
      const latest = await Admin.findById(adminId).select("walletBalance transactions").lean();
      const done = (latest?.transactions || []).find((t) => t.razorpayOrderId === razorpay_order_id);
      if (done?.status === "success") {
        return res.json({
          success: true,
          message: "Already verified",
          walletBalance: latest?.walletBalance || 0,
        });
      }
      return res.status(409).json({ success: false, error: "Payment state changed. Retry." });
    }
    await PaymentEvent.updateOne(
      { source: "verify-wallet", orderId: razorpay_order_id },
      { $setOnInsert: { paymentId: razorpay_payment_id, handledAt: new Date() } },
      { upsert: true }
    ).catch(() => {});

    return res.json({
      success: true,
      message: "Wallet recharged successfully",
      walletBalance: updated.walletBalance,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

