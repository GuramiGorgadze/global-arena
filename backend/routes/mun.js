import { Router } from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import {
  listCommittees,
  login,
  logout,
  me,
  resetPassword,
} from "../controllers/munAuth.js";
import {
  getSession,
  saveSession,
  resetSession,
} from "../controllers/munSession.js";
import { requireCommitteeAuth } from "../middleware/committeeAuth.js";

const MunRouter = Router();

const committeesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { message: "Too many attempts, please try again later." },
  keyGenerator: (req) => ipKeyGenerator(req.ip),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: "Too many attempts, please try again later." },
  keyGenerator: (req) => {
    const committeeId =
      typeof req.body?.committeeId === "string" ? req.body.committeeId : "";
    return `${ipKeyGenerator(req.ip)}:${committeeId}`;
  },
});

const masterKeyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again later." },
  keyGenerator: (req) => ipKeyGenerator(req.ip),
});

// The frontend debounces saves at 400ms per local change, so a very active
// chair could reach ~150/min in a genuine worst case. 240/min leaves
// headroom above that while still bounding a runaway or buggy client.
const sessionWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 240,
  message: { message: "Too many attempts, please try again later." },
  keyGenerator: (req) => req.committeeId || ipKeyGenerator(req.ip),
});

MunRouter.get("/committees", committeesLimiter, listCommittees);

MunRouter.post("/auth/login", loginLimiter, login);
MunRouter.post("/auth/logout", logout);
MunRouter.get("/auth/me", requireCommitteeAuth, me);
MunRouter.post("/auth/reset-password", masterKeyLimiter, resetPassword);

MunRouter.get("/session", requireCommitteeAuth, getSession);
MunRouter.put(
  "/session",
  requireCommitteeAuth,
  sessionWriteLimiter,
  saveSession,
);
MunRouter.post(
  "/session/reset",
  requireCommitteeAuth,
  sessionWriteLimiter,
  resetSession,
);

export default MunRouter;
