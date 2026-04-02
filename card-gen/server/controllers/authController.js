import User from "../models/User.js";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import AuthCode from "../models/AuthCode.js";
import { OAuth2Client } from "google-auth-library";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Signup
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, businessType } = req.body;

    // Validate required fields: manual signup requires name, email, phone, password
    // Google users are handled via /auth/google
    if (!name || !password || !email || !phone) {
      return res.status(400).json({ 
        success: false,
        error: "Name, email, phone and password are required" 
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, error: "Please provide a valid email" });
    }

    const userExistsByEmail = await User.findOne({ email: normalizedEmail });
    if (userExistsByEmail) {
      return res.status(400).json({ success: false, error: "User already exists with this email" });
    }
    const userExistsByPhone = await User.findOne({ phone: trimmedPhone });
    if (userExistsByPhone) {
      return res.status(400).json({ success: false, error: "User already exists with this phone number" });
    }

    const user = await User.create({ 
      name, 
      email: normalizedEmail, 
      password,
      phone: trimmedPhone,
      businessType: businessType || undefined
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessType: user.businessType,
        token: generateToken(user._id)
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, phone, identifier, password } = req.body;

    const loginIdentifierRaw = identifier ?? email ?? phone;

    if (!loginIdentifierRaw || !password) {
      return res.status(400).json({ 
        success: false,
        error: "Email or phone and password are required" 
      });
    }

    const loginIdentifier = String(loginIdentifierRaw).trim();
    const normalizedEmail = loginIdentifier.toLowerCase();
    const normalizedPhone = loginIdentifier.replace(/\s+/g, '');
    const sanitizedPhone = loginIdentifier.replace(/[^\d]/g, '');

    let user = null;

    if (loginIdentifier.includes("@")) {
      user = await User.findOne({ email: loginIdentifier }).select("+password");
      if (!user) {
        user = await User.findOne({ email: normalizedEmail }).select("+password");
      }
    } else {
      const phoneQueries = [{ phone: loginIdentifier }];
      if (normalizedPhone && normalizedPhone !== loginIdentifier) {
        phoneQueries.push({ phone: normalizedPhone });
      }
      if (sanitizedPhone) {
        phoneQueries.push({ phone: sanitizedPhone });
        phoneQueries.push({ phone: `+${sanitizedPhone}` });
      }
      user = await User.findOne({ $or: phoneQueries }).select("+password");

      // Fallback: some users might try using their email without @ or with spaces,
      // attempt a relaxed email lookup if nothing found yet.
      if (!user && normalizedEmail.includes("@")) {
        user = await User.findOne({ email: normalizedEmail }).select("+password");
        if (!user) {
          user = await User.findOne({ email: loginIdentifier }).select("+password");
        }
      }
    }

    if (user && user.password && (await user.matchPassword(password))) {
      res.json({
        success: true,
        message: "Login successful",
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({ 
        success: false,
        error: "Invalid email/phone or password" 
      });
    }
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate('inquiries', 'name email phone message status createdAt businessType resolved cardGenerated cardId adminNotes')
      .populate('savedCards', 'title categoryId templateId createdAt')
      .populate('appointments', 'name email phone message status createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Include hasPassword so clients can show "Link phone & password" for Google-only users
    const hasPassword = await User.findById(req.user.id).select('password').then(u => !!(u && u.password));
    const data = user.toObject ? user.toObject() : user;
    data.hasPassword = hasPassword;

    res.json({
      success: true,
      data
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Set password for existing user (for users who registered without password)
export const setPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    if (user.password) {
      return res.status(400).json({
        success: false,
        error: "User already has a password set"
      });
    }

    // Set the password (will be hashed by the pre-save middleware)
    user.password = password;
    await user.save();

    res.json({
      success: true,
      message: "Password set successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Link phone and password to current user (for Google sign-in users who want to also use phone/password login)
export const linkCredentials = async (req, res) => {
  try {
    if (req.user?.role === "admin" || req.user?.role === "superadmin") {
      return res.status(403).json({ success: false, error: "Only for regular user accounts" });
    }
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authorized" });
    }

    const { phone, password } = req.body;
    if (!phone || !password || !String(phone).trim()) {
      return res.status(400).json({
        success: false,
        error: "Phone number and password are required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (user.password && user.phone) {
      return res.status(400).json({
        success: false,
        error: "Your account already has phone and password linked"
      });
    }

    const trimmedPhone = String(phone).trim().replace(/\s+/g, "");
    const normalizedPhone = /^\+?\d+$/.test(trimmedPhone) ? trimmedPhone : trimmedPhone.replace(/\D/g, "") || trimmedPhone;

    const existingByPhone = await User.findOne({
      phone: normalizedPhone,
      _id: { $ne: userId }
    });
    if (existingByPhone) {
      return res.status(400).json({
        success: false,
        error: "Phone number is already linked to an account"
      });
    }

    user.phone = normalizedPhone;
    user.password = password;
    await user.save();

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: "Phone and password linked successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        hasPassword: true,
        token
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to link credentials"
    });
  }
};

// Admin login (supports both superadmin and regular admins)
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: "Username and password are required" 
      });
    }
    
    // First check if it's the superadmin
    const superAdminUsername = process.env.ADMIN_USERNAME;
    const superAdminPassword = process.env.ADMIN_PASSWORD;
    if (!superAdminUsername || !superAdminPassword) {
      return res.status(500).json({
        success: false,
        error: "Superadmin credentials are not configured",
      });
    }
    
    if (username === superAdminUsername && password === superAdminPassword) {
      const token = jwt.sign({ 
        id: 'superadmin', 
        role: 'superadmin',
        username: superAdminUsername 
      }, process.env.JWT_SECRET, { expiresIn: "30d" });
      
      return res.json({
        success: true,
        token,
        user: {
          id: 'superadmin',
          username: superAdminUsername,
          role: 'superadmin'
        }
      });
    }
    
    // Check regular admins
    const admin = await Admin.findByName(username);
    if (admin && await admin.comparePassword(password)) {
      // Update last login
      admin.lastLogin = new Date();
      await admin.save();
      
      const token = jwt.sign({ 
        id: admin._id, 
        role: 'admin',
        username: admin.name 
      }, process.env.JWT_SECRET, { expiresIn: "30d" });
      
      return res.json({
        success: true,
        token,
        user: {
          id: admin._id,
          username: admin.name,
          role: 'admin'
        }
      });
    }
    
    res.status(401).json({ 
      success: false,
      error: "Invalid username or password" 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Mint a short-lived one-time auth code (for cross-origin handoff)
export const mintAuthCode = async (req, res) => {
  try {
    // Only regular users should mint codes (not admins)
    if (req.user?.role === 'admin' || req.user?.role === 'superadmin') {
      return res.status(403).json({ success: false, error: 'Admins cannot mint user auth codes' });
    }
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Not authorized' });

    const { allowedOrigin } = req.body || {};
    // TTL 120 seconds
    const ttlMs = 120 * 1000;
    const code = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + ttlMs);

    await AuthCode.create({ code, userId, expiresAt, allowedOrigin });

    return res.json({ success: true, code, expiresAt });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Exchange a one-time auth code for a user token (consumed by public site)
export const exchangeAuthCode = async (req, res) => {
  try {
    const { code, origin } = req.body || {};
    if (!code) return res.status(400).json({ success: false, error: 'code is required' });

    const rec = await AuthCode.findOne({ code });
    if (!rec) return res.status(400).json({ success: false, error: 'Invalid code' });
    if (rec.used) return res.status(400).json({ success: false, error: 'Code already used' });
    if (rec.expiresAt.getTime() < Date.now()) return res.status(400).json({ success: false, error: 'Code expired' });
    if (rec.allowedOrigin && origin && rec.allowedOrigin !== origin) {
      return res.status(400).json({ success: false, error: 'Origin not allowed' });
    }

    const user = await User.findById(rec.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Mark code as used
    rec.used = true;
    await rec.save();

    const token = generateToken(user._id);
    return res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessType: user.businessType,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Google OAuth Login/Signup
export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: "Google ID token is required"
      });
    }

    // Check if GOOGLE_CLIENT_ID is configured
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID is not set in environment variables");
      return res.status(500).json({
        success: false,
        error: "Google OAuth is not configured on the server"
      });
    }

    // Verify Google ID token
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    let ticket;
    
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      console.error("Google token verification error:", error);
      return res.status(401).json({
        success: false,
        error: "Invalid Google token: " + (error.message || "Token verification failed")
      });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email not provided by Google"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find existing user by googleId first, then by email (case-insensitive so we match
    // existing signup accounts regardless of how email was stored, e.g. Harsh vs harsh)
    let user = await User.findOne({ googleId: googleId });
    if (!user && normalizedEmail) {
      const emailEscaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      user = await User.findOne({
        email: new RegExp(`^${emailEscaped}$`, "i"),
      });
    }

    if (user) {
      // Link Google to this account if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
      }
      // Prioritise Google name so the account shows the same name everywhere (e.g. "Harsh shukla")
      if (name && name.trim()) {
        user.name = name.trim();
      }
      await user.save();
    } else {
      // No user with this email or googleId - create new account
      user = await User.create({
        name: name || email.split("@")[0],
        email: normalizedEmail,
        googleId: googleId,
        // No password for Google OAuth users
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Google authentication successful",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessType: user.businessType,
        token: token
      }
    });
  } catch (err) {
    console.error("Google auth error:", err);
    // If duplicate key on email (user already exists), find that user and return a token
    if (err.code === 11000 && err.keyPattern && err.keyValue && err.keyValue.email) {
      try {
        const dupEmail = String(err.keyValue.email).toLowerCase().trim();
        const emailEscaped = dupEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const user = await User.findOne({ email: new RegExp(`^${emailEscaped}$`, "i") });
        if (user) {
          const token = generateToken(user._id);
          return res.json({
            success: true,
            message: "Google authentication successful",
            data: {
              _id: user._id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              businessType: user.businessType,
              token: token,
            },
          });
        }
      } catch (fallbackErr) {
        console.error("Google auth fallback error:", fallbackErr);
      }
    }
    res.status(500).json({
      success: false,
      error: err.message || "Google authentication failed"
    });
  }
};