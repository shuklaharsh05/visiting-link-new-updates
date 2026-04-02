import crypto from "crypto";
import IdempotencyKey from "../models/IdempotencyKey.js";

const stableStringify = (val) => {
  if (val === null || typeof val !== "object") return JSON.stringify(val);
  if (Array.isArray(val)) return `[${val.map(stableStringify).join(",")}]`;
  const keys = Object.keys(val).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(val[k])}`).join(",")}}`;
};

export const requireIdempotency = (scope, ttlSeconds = 60 * 60) => {
  return async (req, res, next) => {
    try {
      const key = req.headers["idempotency-key"];
      if (!key || typeof key !== "string" || !key.trim()) return next();

      const actorId = String(req.user?._id || req.user?.id || "anonymous");
      const requestHash = crypto
        .createHash("sha256")
        .update(stableStringify(req.body || {}))
        .digest("hex");

      const query = {
        key: key.trim(),
        scope: String(scope),
        actorId,
        method: req.method,
        path: req.baseUrl + req.path,
      };

      try {
        await IdempotencyKey.create({
          ...query,
          requestHash,
          status: "in_progress",
          expiresAt: new Date(Date.now() + ttlSeconds * 1000),
        });
      } catch {
        const existing = await IdempotencyKey.findOne(query).lean();
        if (!existing) {
          return res.status(409).json({
            success: false,
            error: "Request is already being processed",
          });
        }
        if (existing.requestHash !== requestHash) {
          return res.status(409).json({
            success: false,
            error: "Idempotency key reuse with different payload is not allowed",
          });
        }
        if (existing.status === "completed") {
          return res.status(existing.statusCode || 200).json(existing.responseBody || {});
        }
        if (existing.status === "failed") {
          await IdempotencyKey.updateOne(query, {
            $set: {
              status: "in_progress",
              lastError: null,
              statusCode: null,
              responseBody: null,
              expiresAt: new Date(Date.now() + ttlSeconds * 1000),
            },
          });
          return next();
        }
        return res.status(409).json({
          success: false,
          error: "Request is already being processed",
        });
      }

      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        try {
          await IdempotencyKey.updateOne(query, {
            $set: {
              status: "completed",
              statusCode: res.statusCode || 200,
              responseBody: body,
            },
          });
        } catch {
          // no-op, request should still succeed
        }
        return originalJson(body);
      };

      const originalStatus = res.status.bind(res);
      res.status = (code) => {
        res.locals.idempotencyStatusCode = code;
        return originalStatus(code);
      };

      res.on("close", async () => {
        if (!res.writableEnded) {
          try {
            await IdempotencyKey.updateOne(query, {
              $set: {
                status: "failed",
                lastError: "Connection closed before response completed",
              },
            });
          } catch {}
        }
      });

      return next();
    } catch (err) {
      const key = req.headers["idempotency-key"];
      if (key && typeof key === "string" && key.trim()) {
        const actorId = String(req.user?._id || req.user?.id || "anonymous");
        const query = {
          key: key.trim(),
          scope: String(scope),
          actorId,
          method: req.method,
          path: req.baseUrl + req.path,
        };
        try {
          await IdempotencyKey.updateOne(query, {
            $set: {
              statusCode: res.statusCode || 500,
              status: "failed",
              lastError: err.message,
              expiresAt: new Date(Date.now() + ttlSeconds * 1000),
            },
          });
        } catch {}
      }
      return next(err);
    }
  };
};
