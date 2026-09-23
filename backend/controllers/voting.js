import crypto from "crypto";
import mongoose from "mongoose";
import Delegate from "../models/delegates.js";
import { Resolution, Ballot } from "../models/voting.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHOICES = ["yes", "no", "abstain"];

const normalize = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error("voting error:", err);
    res.status(500).json({ message: "სერვერზე მოხდა შეცდომა." });
  }
};

// The one place that decides who may vote: registered delegates. A delegate
// is eligible simply by existing in the Delegate collection under this
// email — no "were they emailed" signal involved anymore.
const isEligible = async (email) =>
  EMAIL_REGEX.test(email) && !!(await Delegate.exists({ email }));

const NOT_ELIGIBLE = { message: "ეს ელ. ფოსტა დელეგატების სიაში არ არის." };

const tallyFor = async (resolutionId) => {
  const rows = await Ballot.aggregate([
    { $match: { resolution: resolutionId } },
    { $group: { _id: "$choice", n: { $sum: 1 } } },
  ]);
  const tally = { yes: 0, no: 0, abstain: 0 };
  rows.forEach((r) => {
    tally[r._id] = r.n;
  });
  return tally;
};

// One past, already-closed resolution's tally plus this delegate's own
// ballot on it.
const historyEntryFor = async (resolution, email) => {
  const [tally, mine] = await Promise.all([
    tallyFor(resolution._id),
    Ballot.findOne({ resolution: resolution._id, email }, "choice").lean(),
  ]);
  return {
    id: resolution._id,
    title: resolution.title,
    committee: resolution.committee,
    closedAt: resolution.closedAt ?? null,
    tally,
    myVote: mine?.choice ?? null,
  };
};

// Doubles as "identify" (403 if not eligible) and as the polling endpoint.
export const getState = handle(async (req, res) => {
  const email = normalize(req.body?.email);
  if (!(await isEligible(email))) return res.status(403).json(NOT_ELIGIBLE);

  // .limit(50): this app only ever has one *current* resolution, but old
  // ones accumulate over a whole conference — cap how far back a poll digs.
  const resolutions = await Resolution.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  if (!resolutions.length) {
    return res.json({ resolution: null, myVote: null, history: [] });
  }

  const [current, ...past] = resolutions;

  const mine = await Ballot.findOne(
    { resolution: current._id, email },
    "choice",
  ).lean();

  const resolution = {
    id: current._id,
    title: current.title,
    committee: current.committee,
    status: current.status,
  };
  // The *current* resolution's tally stays hidden while it's still open, so
  // an early lead can't sway delegates who haven't voted yet. Anything
  // that's already closed — this one, or an older one — is fair to show.
  if (current.status === "closed") {
    resolution.tally = await tallyFor(current._id);
  }

  const history = await Promise.all(
    past
      .filter((r) => r.status === "closed")
      .map((r) => historyEntryFor(r, email)),
  );

  res.json({ resolution, myVote: mine?.choice ?? null, history });
});

export const castVote = handle(async (req, res) => {
  const email = normalize(req.body?.email);
  const { resolutionId, choice } = req.body ?? {};

  if (!CHOICES.includes(choice) || !mongoose.isValidObjectId(resolutionId)) {
    return res.status(400).json({ message: "მონაცემები არასწორია." });
  }
  if (!(await isEligible(email))) return res.status(403).json(NOT_ELIGIBLE);

  const open = await Resolution.exists({ _id: resolutionId, status: "open" });
  if (!open) {
    return res.status(409).json({ message: "კენჭისყრა დახურულია." });
  }

  try {
    await Ballot.create({ resolution: resolutionId, email, choice });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "თქვენ უკვე მიეცით ხმა." });
    }
    throw err;
  }

  res.status(201).json({ myVote: choice });
});

// --- Chair controls -------------------------------------------------------
// API-only for now, guarded by a shared key in GA_CHAIR_KEY (same idea as
// MUN_MASTER_KEY). Send it as the `x-chair-key` header.

export const requireChairKey = (req, res, next) => {
  const expected = process.env.GA_CHAIR_KEY;
  if (!expected) {
    return res.status(503).json({ message: "GA_CHAIR_KEY is not configured." });
  }
  const given = Buffer.from(String(req.get("x-chair-key") || ""));
  const want = Buffer.from(expected);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) {
    return res.status(401).json({ message: "Incorrect chair key." });
  }
  next();
};

// Read-only view for the chair's control panel: unlike getState (which is
// keyed to a delegate email and hides the *current* tally until closed),
// this always returns the live resolution with its running tally and
// turnout, plus every past resolution's final tally.
export const getAdminState = handle(async (req, res) => {
  const resolutions = await Resolution.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  if (!resolutions.length) return res.json({ resolution: null, history: [] });

  const [current, ...past] = resolutions;

  const [tally, votesCast] = await Promise.all([
    tallyFor(current._id),
    Ballot.countDocuments({ resolution: current._id }),
  ]);

  const history = await Promise.all(
    past.map(async (r) => ({
      id: r._id,
      title: r.title,
      committee: r.committee,
      status: r.status,
      closedAt: r.closedAt ?? null,
      eligibleCount: r.eligibleCount ?? null,
      votesCast: await Ballot.countDocuments({ resolution: r._id }),
      tally: await tallyFor(r._id),
    })),
  );

  res.json({
    resolution: {
      id: current._id,
      title: current.title,
      committee: current.committee,
      status: current.status,
      createdAt: current.createdAt,
      closedAt: current.closedAt ?? null,
      eligibleCount: current.eligibleCount ?? null,
    },
    tally,
    votesCast,
    history,
  });
});

export const openResolution = handle(async (req, res) => {
  const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const title = str(req.body?.title, 200);
  if (!title) return res.status(400).json({ message: "A title is required." });

  // The chair types in how many delegates are eligible for this resolution
  // — there's no reliable signal for that server-side (SentEmail only knows
  // who was emailed, not who showed up), so it's a plain manual input.
  const eligibleCount = Number(req.body?.eligibleCount);
  if (!Number.isFinite(eligibleCount) || eligibleCount < 0) {
    return res
      .status(400)
      .json({ message: "დელეგატების რაოდენობა სავალდებულოა." });
  }

  // Only one vote is ever live: opening a new one closes whatever was open.
  await Resolution.updateMany(
    { status: "open" },
    { $set: { status: "closed", closedAt: new Date() } },
  );
  const created = await Resolution.create({
    title,
    committee: str(req.body?.committee, 60),
    eligibleCount: Math.floor(eligibleCount),
  });

  res.status(201).json({ id: created._id });
});

export const closeResolution = handle(async (req, res) => {
  const closed = await Resolution.findOneAndUpdate(
    { status: "open" },
    { $set: { status: "closed", closedAt: new Date() } },
    { new: true },
  ).lean();
  if (!closed) return res.status(404).json({ message: "No vote is open." });

  res.json({ title: closed.title, tally: await tallyFor(closed._id) });
});
