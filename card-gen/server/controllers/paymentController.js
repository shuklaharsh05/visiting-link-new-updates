import Inquiry from '../models/Inquiry.js';
import Card from '../models/Card.js';
import User from '../models/User.js';
import Plan from '../models/Plan.js';
import Coupon from '../models/Coupon.js';
import PaymentEvent from "../models/PaymentEvent.js";
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Category from "../models/Category.js";

const actorId = (req) => String(req?.user?._id || req?.user?.id || "");
const isAdminRole = (req) =>
  req?.user?.role === "admin" || req?.user?.role === "superadmin";

// Initialize Razorpay
let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_SECRET;

    if (!keyId || !keySecret) {
      console.warn('Razorpay credentials not found in environment variables');
      return null;
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }
  return razorpayInstance;
};

// Create payment order
export const createPaymentOrder = async (req, res) => {
  try {
    const { inquiryId, amount } = req.body;

    if (!inquiryId) {
      return res.status(400).json({ success: false, error: 'Inquiry ID is required' });
    }

    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({ success: false, error: 'Inquiry not found' });
    }
    if (!isAdminRole(req) && String(inquiry.userId || "") !== actorId(req)) {
      return res.status(403).json({ success: false, error: "Not authorized for this inquiry" });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).json({ 
        success: false, 
        error: 'Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_SECRET in environment variables' 
      });
    }

    // Default amount if not provided
    const paymentAmount = amount || 500; // Default ₹500
    // Derive plan from amount (simple mapping for now)
    // e.g. ₹3 -> basic, ₹5 -> pro
    let plan = undefined;
    if (typeof paymentAmount === "number") {
      if (paymentAmount <= 1) {
        plan = "basic";
      } else if (paymentAmount >= 2) {
        plan = "pro";
      }
    }
    // Razorpay's receipt field has a max length of 40 characters.
    // Build a short, deterministic receipt value tied to this inquiry.
    const shortInquiryId = inquiryId.toString().slice(-10);
    const shortTimestamp = Date.now().toString().slice(-8);
    const receiptId = `inq_${shortInquiryId}_${shortTimestamp}`.slice(0, 40);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: paymentAmount * 100, // Amount in paise (₹1 = 100 paise)
      currency: 'INR',
      receipt: receiptId,
      notes: {
        inquiryId: inquiryId.toString(),
        customerName: inquiry.name,
        customerEmail: inquiry.email
      }
    });

    // Update inquiry with payment info
    inquiry.payment = {
      ...(inquiry.payment || {}),
      ...(plan ? { plan } : {}),
      status: 'Processing',
      amount: paymentAmount,
      currency: 'INR',
      gateway: 'razorpay',
      orderId: razorpayOrder.id,
      gatewayResponse: razorpayOrder
    };
    await inquiry.save();

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: paymentAmount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID, // Frontend needs this for Razorpay checkout
      receipt: razorpayOrder.receipt
    });
  } catch (err) {
    console.error('Payment order creation error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to create payment order' 
    });
  }
};

// Verify payment and update status
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing payment verification parameters' 
      });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(text)
      .digest('hex');

    if (signature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid payment signature' 
      });
    }

    const inquiryForAuth = await Inquiry.findOne({ 'payment.orderId': razorpay_order_id }).select("userId payment cardId");
    if (!inquiryForAuth) {
      return res.status(404).json({ 
        success: false, 
        error: 'Inquiry not found for this payment order' 
      });
    }
    if (!isAdminRole(req) && String(inquiryForAuth.userId || "") !== actorId(req)) {
      return res.status(403).json({ success: false, error: "Not authorized for this payment order" });
    }
    const existingPaymentId = inquiryForAuth?.payment?.paymentId;
    if (inquiryForAuth?.payment?.status === "Completed") {
      if (existingPaymentId && existingPaymentId !== razorpay_payment_id) {
        return res.status(409).json({
          success: false,
          error: "Order is already completed with a different payment",
        });
      }
      return res.json({
        success: true,
        message: "Payment already verified",
        inquiryId: inquiryForAuth._id,
        canSubmitCardData: true,
      });
    }

    const inquiry = await Inquiry.findOneAndUpdate(
      {
        _id: inquiryForAuth._id,
        "payment.orderId": razorpay_order_id,
        "payment.status": { $ne: "Completed" },
      },
      {
        $set: {
          "payment.status": "Completed",
          "payment.paymentId": razorpay_payment_id,
          "payment.paymentDate": new Date(),
          "payment.gatewayResponse.verification": {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
            verifiedAt: new Date(),
          },
        },
      },
      { new: true }
    );
    if (!inquiry) {
      const nowState = await Inquiry.findById(inquiryForAuth._id).select("payment");
      if (nowState?.payment?.status === "Completed") {
        if (nowState?.payment?.paymentId && nowState.payment.paymentId !== razorpay_payment_id) {
          return res.status(409).json({
            success: false,
            error: "Order is already completed with a different payment",
          });
        }
        return res.json({
          success: true,
          message: "Payment already verified",
          inquiryId: inquiryForAuth._id,
          canSubmitCardData: true,
        });
      }
      return res.status(409).json({ success: false, error: "Payment state changed. Retry." });
    }
    await PaymentEvent.updateOne(
      { source: "verify-inquiry", orderId: razorpay_order_id },
      {
        $setOnInsert: {
          paymentId: razorpay_payment_id,
          handledAt: new Date(),
        },
      },
      { upsert: true }
    ).catch(() => {});

    // Update card payment status and plan if card exists
    if (inquiry.cardId) {
      const update = {
        paymentStatus: 'Done',
      };
      if (inquiry.payment && inquiry.payment.plan) {
        update.plan = inquiry.payment.plan;
      }
      await Card.findByIdAndUpdate(inquiry.cardId, update);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      inquiryId: inquiry._id,
      // This flag tells frontend that card data form can now be shown
      canSubmitCardData: true
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to verify payment' 
    });
  }
};

// Helper to compute payable amount for a user plan (with optional coupon)
const computeUserPlanAmount = async ({ user, planKey, couponCode }) => {
  const planDoc = await Plan.findOne({ key: planKey, active: true });
  if (!planDoc) {
    const error = new Error('Invalid or inactive plan');
    error.code = 'INVALID_PLAN';
    throw error;
  }

  let paymentAmount = planDoc.amount;

  if (planKey === 'pro' && user.plan === 'basic') {
    const basicPlanDoc = await Plan.findOne({ key: 'basic', active: true });
    if (basicPlanDoc && typeof basicPlanDoc.amount === 'number') {
      const diff = planDoc.amount - basicPlanDoc.amount;
      if (diff > 0) {
        paymentAmount = diff;
      }
    }
  }

  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      active: true,
    });

    if (coupon) {
      const now = new Date();
      if (
        (!coupon.validFrom || coupon.validFrom <= now) &&
        (!coupon.validUntil || coupon.validUntil >= now) &&
        (!coupon.applicablePlans ||
          coupon.applicablePlans.length === 0 ||
          coupon.applicablePlans.includes(planKey))
      ) {
        let discount = 0;
        if (coupon.discountType === 'percentage') {
          discount = (paymentAmount * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount != null) {
            discount = Math.min(discount, coupon.maxDiscountAmount);
          }
        } else {
          discount = coupon.discountValue;
        }
        paymentAmount = Math.max(0, paymentAmount - discount);
        appliedCoupon = {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        };
      }
    }
  }

  return {
    baseAmount: planDoc.amount,
    payableAmount: paymentAmount,
    appliedCoupon,
  };
};

// Create payment order for user plan (basic/pro)
export const createUserPlanOrder = async (req, res) => {
  try {
    const { plan, couponCode } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!plan || !['basic', 'pro'].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Valid plan is required (basic or pro)',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        error: 'Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_SECRET in environment variables',
      });
    }

    const { payableAmount, appliedCoupon } = await computeUserPlanAmount({
      user,
      planKey: plan,
      couponCode,
    });

    // Razorpay receipt (<= 40 chars)
    const shortUserId = user._id.toString().slice(-10);
    const shortTimestamp = Date.now().toString().slice(-8);
    const receiptId = `usr_${shortUserId}_${shortTimestamp}`.slice(0, 40);

    const razorpayOrder = await razorpay.orders.create({
      amount: payableAmount * 100,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        userId: user._id.toString(),
        plan,
        customerName: user.name,
        customerEmail: user.email,
      },
    });

    user.planPayment = {
      status: 'Processing',
      plan,
      amount: payableAmount,
      currency: 'INR',
      gateway: 'razorpay',
      orderId: razorpayOrder.id,
      gatewayResponse: razorpayOrder,
      ...(appliedCoupon ? { appliedCoupon } : {}),
    };
    await user.save();

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: payableAmount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
      receipt: razorpayOrder.receipt,
    });
  } catch (err) {
    console.error('User plan order creation error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to create user plan payment order',
    });
  }
};

// Verify user plan payment and update user.plan
export const verifyUserPlanPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing payment verification parameters',
      });
    }

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(text)
      .digest('hex');

    if (signature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
      });
    }

    const userForAuth = await User.findOne({ 'planPayment.orderId': razorpay_order_id }).select("plan planPayment");
    if (!userForAuth) {
      return res.status(404).json({
        success: false,
        error: 'User not found for this payment order',
      });
    }
    if (!isAdminRole(req) && String(userForAuth._id) !== actorId(req)) {
      return res.status(403).json({ success: false, error: "Not authorized for this payment order" });
    }
    if (userForAuth?.planPayment?.status === "Completed") {
      if (
        userForAuth?.planPayment?.paymentId &&
        userForAuth.planPayment.paymentId !== razorpay_payment_id
      ) {
        return res.status(409).json({
          success: false,
          error: "Order is already completed with a different payment",
        });
      }
      return res.json({
        success: true,
        message: "Plan payment already verified",
        plan: userForAuth.plan,
      });
    }

    const setData = {
      "planPayment.status": "Completed",
      "planPayment.paymentId": razorpay_payment_id,
      "planPayment.paymentDate": new Date(),
      "planPayment.gatewayResponse.verification": {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        verifiedAt: new Date(),
      },
    };
    if (
      userForAuth?.planPayment?.plan === "basic" ||
      userForAuth?.planPayment?.plan === "pro"
    ) {
      setData.plan = userForAuth.planPayment.plan;
    }
    const user = await User.findOneAndUpdate(
      {
        _id: userForAuth._id,
        "planPayment.orderId": razorpay_order_id,
        "planPayment.status": { $ne: "Completed" },
      },
      { $set: setData },
      { new: true }
    );
    if (!user) {
      const nowState = await User.findById(userForAuth._id).select("plan planPayment");
      if (nowState?.planPayment?.status === "Completed") {
        if (
          nowState?.planPayment?.paymentId &&
          nowState.planPayment.paymentId !== razorpay_payment_id
        ) {
          return res.status(409).json({
            success: false,
            error: "Order is already completed with a different payment",
          });
        }
        return res.json({
          success: true,
          message: "Plan payment already verified",
          plan: nowState.plan,
        });
      }
      return res.status(409).json({ success: false, error: "Payment state changed. Retry." });
    }
    await PaymentEvent.updateOne(
      { source: "verify-plan", orderId: razorpay_order_id },
      {
        $setOnInsert: {
          paymentId: razorpay_payment_id,
          handledAt: new Date(),
        },
      },
      { upsert: true }
    ).catch(() => {});

    res.json({
      success: true,
      message: 'Plan payment verified successfully',
      plan: user.plan,
    });
  } catch (err) {
    console.error('User plan payment verification error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to verify user plan payment',
    });
  }
};

// Preview user plan price (without creating Razorpay order)
export const previewUserPlanPrice = async (req, res) => {
  try {
    const { plan, couponCode } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!plan || !['basic', 'pro'].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Valid plan is required (basic or pro)',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const { baseAmount, payableAmount, appliedCoupon } = await computeUserPlanAmount({
      user,
      planKey: plan,
      couponCode,
    });

    res.json({
      success: true,
      data: {
        plan,
        baseAmount,
        amount: payableAmount,
        ...(appliedCoupon ? { appliedCoupon } : {}),
      },
    });
  } catch (err) {
    console.error('User plan price preview error:', err);
    if (err.code === 'INVALID_PLAN') {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to preview user plan price',
    });
  }
};

// ----------------------------------------------------------------------
// Template purchase payments (per-template one-time payment)
// ----------------------------------------------------------------------

export const createTemplateOrder = async (req, res) => {
  try {
    const { categoryId, templateId } = req.body || {};

    if (!categoryId || !templateId) {
      return res.status(400).json({ success: false, error: "categoryId and templateId are required" });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        error: "Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_SECRET in environment variables",
      });
    }

    const category = await Category.findByCategoryId(String(categoryId));
    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }
    const template = category.getTemplate(String(templateId));
    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }

    const amount = typeof template.price === "number" ? template.price : 0;
    if (amount <= 0) {
      // Free template: no Razorpay order required
      return res.json({
        success: true,
        free: true,
        amount: 0,
        currency: "INR",
      });
    }

    const uid = (req.user && (req.user._id || req.user.id)) || "";
    const shortUser = String(uid).slice(-8);
    const shortTemplate = String(templateId).slice(-10);
    const receiptId = `tpl_${shortUser}_${shortTemplate}_${Date.now().toString().slice(-6)}`.slice(0, 40);

    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: receiptId,
      notes: {
        categoryId: String(categoryId),
        templateId: String(templateId),
        userId: String(uid),
        purpose: "template-purchase",
      },
    });

    return res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      receipt: razorpayOrder.receipt,
    });
  } catch (err) {
    console.error("Template order creation error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to create template order" });
  }
};

export const verifyTemplatePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: "Missing payment verification parameters" });
    }

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(text)
      .digest("hex");

    if (signature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }

    // (Optional) Could persist an event here; for now, just acknowledge verification.
    return res.json({
      success: true,
      message: "Template payment verified",
      data: {
        razorpay_order_id,
        razorpay_payment_id,
      },
    });
  } catch (err) {
    console.error("Template payment verification error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to verify template payment" });
  }
};

// Webhook handler (optional - for server-to-server verification)
export const handlePaymentWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_SECRET;

    if (!webhookSignature) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing webhook signature' 
      });
    }

    // Verify webhook signature
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (generatedSignature !== webhookSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid webhook signature' 
      });
    }

    const event = req.body.event;
    const payment = req.body.payload?.payment?.entity;
    const eventId = req.body?.event_id || req.body?.payload?.payment?.entity?.id;

    if (!payment) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid webhook payload' 
      });
    }
    if (eventId) {
      const already = await PaymentEvent.findOne({
        source: "razorpay-webhook",
        eventId,
      }).lean();
      if (already) {
        return res.json({ success: true, duplicate: true });
      }
    }

    if (event === 'payment.captured') {
      const inquiry = await Inquiry.findOne({ 'payment.orderId': payment.order_id });
      if (inquiry) {
        if (inquiry.payment?.status === "Completed" && inquiry.payment?.paymentId && inquiry.payment.paymentId !== payment.id) {
          return res.status(409).json({
            success: false,
            error: "Order already completed with a different payment",
          });
        }
        inquiry.payment.status = 'Completed';
        inquiry.payment.paymentId = payment.id;
        inquiry.payment.paymentDate = new Date(payment.created_at * 1000);
        inquiry.payment.gatewayResponse = {
          ...inquiry.payment.gatewayResponse,
          webhook: {
            event,
            payment,
            receivedAt: new Date()
          }
        };
        await inquiry.save();

        // Update card payment status if card exists
        if (inquiry.cardId) {
          await Card.findByIdAndUpdate(inquiry.cardId, { 
            paymentStatus: 'Done' 
          });
        }

        console.log(`Payment webhook processed for inquiry ${inquiry._id}`);
      }
    } else if (event === 'payment.failed') {
      const inquiry = await Inquiry.findOne({ 'payment.orderId': payment.order_id });
      if (inquiry) {
        if (inquiry.payment?.status === "Completed") {
          return res.json({ success: true, ignored: true });
        }
        inquiry.payment.status = 'Failed';
        inquiry.payment.gatewayResponse = {
          ...inquiry.payment.gatewayResponse,
          webhook: {
            event,
            payment,
            receivedAt: new Date()
          }
        };
        await inquiry.save();
        console.log(`Payment failed for inquiry ${inquiry._id}`);
      }
    }

    await PaymentEvent.create({
      source: "razorpay-webhook",
      eventId: eventId || undefined,
      paymentId: payment.id,
      orderId: payment.order_id,
    }).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to process webhook' 
    });
  }
};

// Get payment status for an inquiry
export const getPaymentStatus = async (req, res) => {
  try {
    const { inquiryId } = req.params;

    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({ 
        success: false, 
        error: 'Inquiry not found' 
      });
    }
    if (!isAdminRole(req) && String(inquiry.userId || "") !== actorId(req)) {
      return res.status(403).json({ success: false, error: "Not authorized for this inquiry" });
    }

    res.json({
      success: true,
      payment: inquiry.payment || { status: 'Pending' },
      canSubmitCardData: inquiry.payment?.status === 'Completed' && !inquiry.userCardDataSubmitted
    });
  } catch (err) {
    console.error('Error fetching payment status:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to fetch payment status' 
    });
  }
};

