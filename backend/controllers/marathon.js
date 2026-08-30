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

// GET /api/marathon/status?email=optional
// Always returns timing/config so the frontend can render a countdown.
// If an email is provided, also reports whether that delegate is
// registered and whether they've already completed the marathon.
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

// GET /api/marathon/questions
// Only servable once the marathon has actually started, and only
// returns question + options — never correctIndex.
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

// POST /api/marathon/submit
// body: { email: string, answers: number[] } — answers.length must equal
// MARATHON_QUESTIONS.length, each entry either -1 (unanswered) or 0-3.
export const submitMarathonResult = async (req, res) => {
  try {
    const { email, answers } = req.body;

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