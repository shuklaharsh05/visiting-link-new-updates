import crypto from "crypto";
import rateLimit from "express-rate-limit";

const cleanObject = (input) => {
  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i += 1) cleanObject(input[i]);
    return;
  }
  if (!input || typeof input !== "object") return;

  for (const key of Object.keys(input)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete input[key];
      continue;
    }
    cleanObject(input[key]);
  }
};

export const assignRequestId = (req, res, next) => {
  const incoming = req.headers["x-request-id"];
  req.requestId =
    (typeof incoming === "string" && incoming.trim()) ||
    crypto.randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
};

export const requestLogger = (req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - started;
    const log = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: ms,
      userId: req.user?._id || req.user?.id || null,
      role: req.user?.role || "user",
    };
    console.log(JSON.stringify(log));
  });
  next();
};

export const sanitizeInput = (req, _res, next) => {
  if (req.body) cleanObject(req.body);
  if (req.query) cleanObject(req.query);
  if (req.params) cleanObject(req.params);
  next();
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 80,
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

export const paymentVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

export const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
