import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Inquiry from "../models/Inquiry.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Handle superadmin tokens
      if (decoded.id === 'superadmin' && decoded.role === 'superadmin') {
        req.user = {
          id: 'superadmin',
          username: decoded.username,
          role: 'superadmin'
        };
        return next();
      }

      // Handle regular admin tokens
      if (decoded.role === 'admin') {
        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin || !admin.isActive) {
          return res.status(401).json({ error: "Admin not found or inactive" });
        }
        req.user = {
          id: admin._id,
          username: admin.name,
          role: 'admin'
        };
        return next();
      }

      // Handle regular user tokens
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ error: "User not found" });
      }
      return next();
    } catch (err) {
      console.error('JWT verification error:', err);
      return res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  // No token provided
  return res.status(401).json({ error: "Not authorized, no token" });
};

export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Handle superadmin tokens
      if (decoded.id === 'superadmin' && decoded.role === 'superadmin') {
        req.user = {
          id: 'superadmin',
          username: decoded.username,
          role: 'superadmin'
        };
        return next();
      }

      // Handle regular admin tokens
      if (decoded.role === 'admin') {
        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin || !admin.isActive) {
          req.user = null;
        } else {
          req.user = {
            id: admin._id,
            username: admin.name,
            role: 'admin'
          };
        }
        return next();
      }

      // Handle regular user tokens
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        // If user not found, continue without authentication
        req.user = null;
      }
      return next();
    } catch (err) {
      console.error('JWT verification error:', err);
      // If token is invalid, continue without authentication
      req.user = null;
      return next();
    }
  }

  // No token provided - continue without authentication
  req.user = null;
  next();
};

// Middleware to check if user is superadmin
export const requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }
  return res.status(403).json({ error: "Access denied. Superadmin privileges required." });
};

// Middleware to check if user is admin (superadmin or regular admin)
export const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'superadmin' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ error: "Access denied. Admin privileges required." });
};

const actorId = (req) => String(req?.user?._id || req?.user?.id || "");
const isAdminRole = (req) =>
  req?.user?.role === "admin" || req?.user?.role === "superadmin";

export const allowSelfOrAdmin = (paramName = "id") => {
  return (req, res, next) => {
    if (isAdminRole(req)) return next();
    const requestedId = String(req.params?.[paramName] || "");
    if (!requestedId) {
      return res.status(400).json({ success: false, error: "Missing resource id" });
    }
    if (requestedId !== actorId(req)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    return next();
  };
};

export const allowOwnerOnly = (ownerKey = "userId") => {
  return (req, res, next) => {
    if (isAdminRole(req)) return next();
    const ownerId = String(req.resource?.[ownerKey] || "");
    if (!ownerId || ownerId !== actorId(req)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    return next();
  };
};

export const loadInquiryResource = async (req, res, next) => {
  try {
    const id = req.params?.id;
    if (!id) return res.status(400).json({ success: false, error: "Missing inquiry id" });
    const inquiry = await Inquiry.findById(id).select("userId assignedTo");
    if (!inquiry) {
      return res.status(404).json({ success: false, error: "Inquiry not found" });
    }
    req.resource = inquiry;
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Middleware for admin panel authentication
export const authenticateToken = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Handle superadmin tokens
      if (decoded.id === 'superadmin' && decoded.role === 'superadmin') {
        req.user = {
          id: 'superadmin',
          username: decoded.username,
          role: 'superadmin'
        };
        return next();
      }

      // Handle regular admin tokens
      if (decoded.role === 'admin') {
        Admin.findById(decoded.id).select('-password').then(admin => {
          if (!admin || !admin.isActive) {
            return res.status(401).json({ error: "Admin not found or inactive" });
          }
          req.user = {
            id: admin._id,
            username: admin.name,
            role: 'admin'
          };
          return next();
        }).catch(err => {
          console.error('Admin lookup error:', err);
          return res.status(401).json({ error: "Not authorized, token failed" });
        });
        return;
      }

      return res.status(401).json({ error: "Not authorized, invalid token" });
    } catch (err) {
      console.error('JWT verification error:', err);
      return res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  // No token provided
  return res.status(401).json({ error: "Not authorized, no token" });
};