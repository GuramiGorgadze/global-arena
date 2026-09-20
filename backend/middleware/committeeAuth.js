import jwt from "jsonwebtoken";
import { isKnownCommittee } from "../config/munCommittees.js";

export const SESSION_COOKIE = "mun_committee_session";
export const TOKEN_TTL = "18h";
// Keep the cookie's own expiry a little ahead of the JWT's so the cookie
// never outlives a token that would fail verification anyway.
export const COOKIE_MAX_AGE_MS = 19 * 60 * 60 * 1000;

function requireSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fails loudly here rather than letting jsonwebtoken silently sign or
    // verify against `undefined`, which would make every token forgeable.
    throw new Error(
      "JWT_SECRET is not set. Add it to your environment before starting the server.",
    );
  }
  return secret;
}

export const signCommitteeToken = (committeeId) =>
  jwt.sign({ committeeId }, requireSecret(), { expiresIn: TOKEN_TTL });

export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: COOKIE_MAX_AGE_MS,
  path: "/",
});

// Attaches req.committeeId once the cookie's JWT is verified. Every
// protected mun route reads req.committeeId instead of taking a
// committeeId from the URL or body, so there is no separate "does this
// chair own this committee" check to get wrong — the token IS the
// authorization for exactly one committee.
export const requireCommitteeAuth = (req, res, next) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Sign in to this committee first." });
  }
  try {
    const payload = jwt.verify(token, requireSecret());
    if (!isKnownCommittee(payload?.committeeId)) {
      return res
        .status(401)
        .json({ message: "Sign in to this committee first." });
    }
    req.committeeId = payload.committeeId;
    return next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Your session has expired. Sign in again." });
  }
};
