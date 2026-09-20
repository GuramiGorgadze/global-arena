import Delegates from "../models/delegates.js";
import MarathonResult from "../models/marathonResults.js";
import {
  MARATHON_START_AT,
  MARATHON_DURATION_MS,
  MARATHON_GRACE_MS,
} from "../config/marathon.js";
import { MARATHON_QUESTIONS } from "../data/marathonQuestions.js";

const startsAtMs = MARATHON_START_AT.getTime();
const endsAtMs = startsAtMs + MARATHON_DURATION_MS;
const cutoffMs = endsAtMs + MARATHON_GRACE_MS;

// Client-reported anti-cheating signals (tab switches, blur time, event
// log) are untrusted input — a modified client can send anything, or
// nothing at all. They are sanitized and stored purely for a human to
// review later; they never affect correctCount, elapsedMs, or whether a
// submission is accepted. Caps below stop a malicious payload from
// bloating the DB.
const MAX_INTEGRITY_EVENTS = 200;
const MAX_INTEGRITY_EVENT_TYPE_LEN = 40;

function sanitizeIntegrity(raw) {
  const empty = { tabSwitchCount: 0, awayMs: 0, events: [] };
  if (!raw || typeof raw !== "object") return empty;

  const tabSwitchCount = Number.isFinite(raw.tabSwitchCount)
    ? Math.max(0, Math.min(1000, Math.trunc(raw.tabSwitchCount)))
    : 0;

  const awayMs = Number.isFinite(raw.awayMs)
    ? Math.max(0, Math.min(MARATHON_DURATION_MS, Math.trunc(raw.awayMs)))
    : 0;

  const events = Array.isArray(raw.events)
    ? raw.events
        .slice(0, MAX_INTEGRITY_EVENTS)
        .filter((e) => e && typeof e === "object" && typeof e.type === "string")
        .map((e) => {
          const entry = {
            type: e.type.slice(0, MAX_INTEGRITY_EVENT_TYPE_LEN),
          };
          if (Number.isFinite(e.at)) entry.at = new Date(e.at);
          if (Number.isFinite(e.durationMs)) {
            entry.durationMs = Math.max(0, Math.trunc(e.durationMs));
          }
          return entry;
        })
    : [];

  return { tabSwitchCount, awayMs, events };
}

export const getMarathonStatus = async (req, res) => {
  try {
    const base = {
      startsAt: MARATHON_START_AT.toISOString(),
      durationMs: MARATHON_DURATION_MS,
      questionCount: MARATHON_QUESTIONS.length,
      serverNow: new Date().toISOString(),
    };

    const email = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";
    if (!email) {
      return res.json(base);
    }

    const delegate = await Delegates.findOne({ email }).select("_id");
    if (!delegate) {
      return res.json({ ...base, registered: false });
    }

    const existingResult = await MarathonResult.findOne({ email });
    if (existingResult) {
      return res.json({
        ...base,
        registered: true,
        alreadyCompleted: true,
        result: {
          correctCount: existingResult.correctCount,
          totalQuestions: existingResult.totalQuestions,
          elapsedMs: existingResult.elapsedMs,
          finishedAt: existingResult.finishedAt,
        },
      });
    }

    return res.json({ ...base, registered: true, alreadyCompleted: false });
  } catch (err) {
    console.error("getMarathonStatus error:", err);
    res.status(500).json({ message: "სერვერზე მოხდა შეცდომა." });
  }
};

export const getMarathonQuestions = async (req, res) => {
  try {
    const now = Date.now();

    if (now < startsAtMs) {
      return res.status(403).json({ message: "მარათონი ჯერ არ დაწყებულა." });
    }
    if (now > cutoffMs) {
      return res.status(403).json({ message: "მარათონი დასრულებულია." });
    }

    const sanitized = MARATHON_QUESTIONS.map(({ id, question, options }) => ({
      id,
      question,
      options,
    }));

    res.json({
      questions: sanitized,
      startsAt: MARATHON_START_AT.toISOString(),
      durationMs: MARATHON_DURATION_MS,
      serverNow: new Date().toISOString(),
    });
  } catch (err) {
    console.error("getMarathonQuestions error:", err);
    res.status(500).json({ message: "სერვერზე მოხდა შეცდომა." });
  }
};

export const submitMarathonResult = async (req, res) => {
  try {
    const { email, answers, integrity } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: "ელ. ფოსტა სავალდებულოა." });
    }

    if (!Array.isArray(answers) || answers.length !== MARATHON_QUESTIONS.length) {
      return res.status(400).json({ message: "პასუხების რაოდენობა არასწორია." });
    }

    const validAnswers = answers.every(
      (a) => a === -1 || (Number.isInteger(a) && a >= 0 && a <= 3),
    );
    if (!validAnswers) {
      return res.status(400).json({ message: "პასუხის ფორმატი არასწორია." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const sanitizedIntegrity = sanitizeIntegrity(integrity);

    const delegate = await Delegates.findOne({ email: normalizedEmail });
    if (!delegate) {
      return res.status(404).json({ message: "თქვენ არ ხართ რეგისტრირებული დელეგატი." });
    }

    const now = new Date();
    if (now.getTime() < startsAtMs) {
      return res.status(403).json({ message: "მარათონი ჯერ არ დაწყებულა." });
    }
    if (now.getTime() > cutoffMs) {
      return res.status(403).json({ message: "დრო ამოიწურა — მარათონი დასრულებულია." });
    }

    const existing = await MarathonResult.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "თქვენ უკვე დაასრულეთ მარათონი." });
    }

    let correctCount = 0;
    MARATHON_QUESTIONS.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correctCount += 1;
    });

    const elapsedMs = Math.max(0, now.getTime() - startsAtMs);

    const result = await MarathonResult.create({
      delegate: delegate._id,
      email: normalizedEmail,
      fullNameLatin: `${delegate.firstNameLatin || ""} ${delegate.lastNameLatin || ""}`.trim(),
      answers,
      correctCount,
      totalQuestions: MARATHON_QUESTIONS.length,
      startedAt: MARATHON_START_AT,
      finishedAt: now,
      elapsedMs,
      integrity: sanitizedIntegrity,
    });

    res.status(201).json({
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      elapsedMs: result.elapsedMs,
      finishedAt: result.finishedAt,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "თქვენ უკვე დაასრულეთ მარათონი." });
    }
    console.error("submitMarathonResult error:", err);
    res.status(500).json({ message: "სერვერზე მოხდა შეცდომა. სცადეთ ხელახლა." });
  }
};