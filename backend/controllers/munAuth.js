import bcrypt from "bcryptjs";
import CommitteeAccess from "../models/CommitteeAccess.js";
import CommitteeSession from "../models/CommitteeSession.js";
import { COMMITTEE_IDS, isKnownCommittee } from "../config/munCommittees.js";
import {
  SESSION_COOKIE,
  cookieOptions,
  signCommitteeToken,
} from "../middleware/committeeAuth.js";

const PASSWORD_MIN_LENGTH = 4;
const PASSWORD_MAX_LENGTH = 64;
const BCRYPT_ROUNDS = 10;

const validPassword = (value) =>
  typeof value === "string" &&
  value.length >= PASSWORD_MIN_LENGTH &&
  value.length <= PASSWORD_MAX_LENGTH;

export const listCommittees = async (req, res) => {
  try {
    const [accessDocs, sessionDocs] = await Promise.all([
      CommitteeAccess.find({}, "committeeId").lean(),
      CommitteeSession.find({}, "committeeId").lean(),
    ]);
    const withPassword = new Set(accessDocs.map((d) => d.committeeId));
    const withSession = new Set(sessionDocs.map((d) => d.committeeId));

    res.status(200).json({
      committees: COMMITTEE_IDS.map((committeeId) => ({
        committeeId,
        hasPassword: withPassword.has(committeeId),
        hasSession: withSession.has(committeeId),
      })),
    });
  } catch (err) {
    console.error("listCommittees error:", err);
    res.status(500).json({ message: "Something went wrong on the server." });
  }
};

export const login = async (req, res) => {
  try {
    const { committeeId, password } = req.body;

    if (!isKnownCommittee(committeeId)) {
      return res.status(400).json({ message: "Unknown committee." });
    }
    if (!validPassword(password)) {
      return res
        .status(400)
        .json({
          message: `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters.`,
        });
    }

    let access = await CommitteeAccess.findOne({ committeeId });
    let isFirstLogin = false;

    if (!access) {
      // Nobody has claimed this committee yet — the first password typed
      // for it is the one that sticks.
      isFirstLogin = true;
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      try {
        access = await CommitteeAccess.create({
          committeeId,
          passwordHash,
          lastLoginAt: new Date(),
        });
      } catch (err) {
        if (err.code === 11000) {
          // Two chairs typed a first password for the same committee in
          // the same instant. Whoever's write landed first wins; fall back
          // to verifying against that instead of crashing.
          isFirstLogin = false;
          access = await CommitteeAccess.findOne({ committeeId });
          if (
            !access ||
            !(await bcrypt.compare(password, access.passwordHash))
          ) {
            return res.status(401).json({ message: "Incorrect password." });
          }
          access.lastLoginAt = new Date();
          await access.save();
        } else {
          throw err;
        }
      }
    } else {
      const matches = await bcrypt.compare(password, access.passwordHash);
      if (!matches) {
        return res.status(401).json({ message: "Incorrect password." });
      }
      access.lastLoginAt = new Date();
      await access.save();
    }

    // Every real login — as opposed to a browser just reusing a cookie
    // that's still valid — starts a fresh roll call. The seats a chair
    // built stay exactly as they were; only who's in the room today gets
    // re-asked. findOneAndUpdate with no upsert simply does nothing if
    // this committee has no session yet, which is what we want.
    const sessionDoc = await CommitteeSession.findOneAndUpdate(
      { committeeId },
      { $set: { phase: "rollcall" } },
      { new: true },
    ).lean();

    const token = signCommitteeToken(committeeId);
    res.cookie(SESSION_COOKIE, token, cookieOptions());

    res.status(200).json({
      committeeId,
      isFirstLogin,
      hasSession: !!sessionDoc,
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Something went wrong on the server." });
  }
};

export const logout = (req, res) => {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
  res.status(200).json({ message: "Signed out." });
};

export const me = (req, res) => {
  // requireCommitteeAuth has already verified the cookie and attached
  // req.committeeId by the time a request reaches this handler.
  res.status(200).json({ committeeId: req.committeeId });
};

// A recovery valve for a forgotten shared password. Protected by a single
// server-side master key (MUN_MASTER_KEY), meant to be known only by the
// conference's tech lead — not tied to any one committee, so it can unstick
// any of them without needing direct database access.
export const resetPassword = async (req, res) => {
  try {
    const { committeeId, masterKey, newPassword } = req.body;
    const expected = process.env.MUN_MASTER_KEY;

    if (!expected) {
      return res
        .status(503)
        .json({ message: "Password reset is not configured on this server." });
    }
    if (typeof masterKey !== "string" || masterKey !== expected) {
      return res.status(401).json({ message: "Incorrect master key." });
    }
    if (!isKnownCommittee(committeeId)) {
      return res.status(400).json({ message: "Unknown committee." });
    }
    if (!validPassword(newPassword)) {
      return res
        .status(400)
        .json({
          message: `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters.`,
        });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await CommitteeAccess.findOneAndUpdate(
      { committeeId },
      { $set: { passwordHash } },
      { upsert: true },
    );

    res.status(200).json({ message: "Password updated." });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Something went wrong on the server." });
  }
};
