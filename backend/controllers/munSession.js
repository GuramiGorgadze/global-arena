import CommitteeSession from "../models/CommitteeSession.js";
import CommitteeSessionArchive from "../models/CommitteeSessionArchive.js";
import {
  MAX_LOG_ENTRIES,
  MAX_MOTIONS,
  MAX_DOCUMENTS,
  MAX_QUEUE_ENTRIES,
} from "../models/schemas/SessionFields.js";
import { MAX_ROSTER_SEATS } from "../config/munCommittees.js";

export const getSession = async (req, res) => {
  try {
    const doc = await CommitteeSession.findOne({
      committeeId: req.committeeId,
    }).lean();

    if (!doc) {
      // Not an error — this committee just hasn't had a session created
      // yet, which is how the frontend knows to run roster setup first.
      return res.status(200).json({ exists: false });
    }

    res.status(200).json({ exists: true, session: toClientSession(doc) });
  } catch (err) {
    console.error("getSession error:", err);
    res.status(500).json({ message: "Something went wrong on the server." });
  }
};

export const saveSession = async (req, res) => {
  try {
    const { session } = req.body;
    if (!session || typeof session !== "object") {
      return res.status(400).json({ message: "A session object is required." });
    }
    if (
      !Array.isArray(session.delegates) ||
      session.delegates.length === 0 ||
      session.delegates.length > MAX_ROSTER_SEATS
    ) {
      return res.status(400).json({
        message: `A committee needs between 1 and ${MAX_ROSTER_SEATS} seats.`,
      });
    }

    // The client always sends the complete session, so a save is a full
    // overwrite, not a patch — but cap the growable arrays server-side too,
    // rather than trusting the client's own caps to always hold.
    if (Array.isArray(session.log) && session.log.length > MAX_LOG_ENTRIES) {
      session.log = session.log.slice(0, MAX_LOG_ENTRIES);
    }
    if (
      Array.isArray(session.motions) &&
      session.motions.length > MAX_MOTIONS
    ) {
      session.motions = session.motions.slice(0, MAX_MOTIONS);
    }
    if (
      Array.isArray(session.documents) &&
      session.documents.length > MAX_DOCUMENTS
    ) {
      session.documents = session.documents.slice(0, MAX_DOCUMENTS);
    }
    if (session.lists && typeof session.lists === "object") {
      for (const key of ["gsl", "caucus"]) {
        const list = session.lists[key];
        if (
          list &&
          Array.isArray(list.queue) &&
          list.queue.length > MAX_QUEUE_ENTRIES
        ) {
          list.queue = list.queue.slice(0, MAX_QUEUE_ENTRIES);
        }
      }
    }

    const payload = fromClientSession(session, req.committeeId);

    const saved = await CommitteeSession.findOneAndUpdate(
      { committeeId: req.committeeId },
      { $set: payload },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    res.status(200).json({ session: toClientSession(saved) });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error("saveSession error:", err);
    res.status(500).json({ message: "Something went wrong on the server." });
  }
};

export const resetSession = async (req, res) => {
  try {
    const existing = await CommitteeSession.findOne({
      committeeId: req.committeeId,
    }).lean();

    if (!existing) {
      return res
        .status(404)
        .json({ message: "There is no session to reset yet." });
    }

    await CommitteeSessionArchive.create({
      ...stripDbFields(existing),
      committeeId: req.committeeId,
    });

    // A reset starts a new session block — a new conference day, typically.
    // The seats a chair built stay, stripped of that block's live stats;
    // the floor, motions, vote, documents and log all clear; the topic
    // carries over since it rarely changes conference to conference. Phase
    // goes back to rollcall for the same reason a fresh login does.
    const freshDelegates = existing.delegates.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      role: d.role,
      // Portraits are part of the seat, not the day's stats. This line was
      // the one place a crisis cabinet's faces got silently dropped.
      photo: d.photo || "",
      status: "present",
      speeches: 0,
      speakingMs: 0,
      points: 0,
      note: "",
    }));

    const fresh = {
      committeeId: req.committeeId,
      version: 2,
      clientSessionId: existing.clientSessionId,
      topic: existing.topic,
      phase: "rollcall",
      createdAt: Date.now(),
      openedAt: null,
      closedAt: null,
      delegates: freshDelegates,
      floor: {
        mode: "gsl",
        topic: "",
        totalMs: 0,
        consumedMs: 0,
        speakers: 0,
        speechMs: 0,
        proposerId: null,
      },
      lists: {
        gsl: { open: true, queue: [] },
        caucus: { open: true, queue: [] },
      },
      speaker: null,
      speech: {
        durationMs: existing.settings?.speechMs || 0,
        elapsedMs: 0,
        running: false,
        startedAt: null,
      },
      motions: [],
      vote: null,
      documents: [],
      log: [],
      settings: existing.settings,
      syncedAt: new Date(),
    };

    const saved = await CommitteeSession.findOneAndReplace(
      { committeeId: req.committeeId },
      fresh,
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    ).lean();

    res.status(200).json({ session: toClientSession(saved) });
  } catch (err) {
    console.error("resetSession error:", err);
    res.status(500).json({ message: "Something went wrong on the server." });
  }
};

// --- helpers ----------------------------------------------------------

function stripDbFields(doc) {
  const { _id, __v, ...rest } = doc;
  return rest;
}

function toClientSession(doc) {
  if (!doc) return null;
  const { _id, __v, syncedAt, ...rest } = doc;
  return rest;
}

function fromClientSession(session, committeeId) {
  const { _id, __v, syncedAt, ...rest } = session;
  // committeeId always comes from the authenticated request, never from the
  // payload, so a chair logged in for one committee can't write another's.
  return { ...rest, committeeId, syncedAt: new Date() };
}
