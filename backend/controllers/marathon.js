import MarathonResult from "../models/marathonResults.js";
import { MARATHON_DURATION_MS, MARATHON_GRACE_MS } from "../config/marathon.js";
import { MARATHON_QUESTIONS } from "../data/marathonQuestions.js";

const MAX_INTEGRITY_EVENTS = 200;
const MAX_INTEGRITY_EVENT_TYPE_LEN = 40;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

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
      durationMs: MARATHON_DURATION_MS,
      questionCount: MARATHON_QUESTIONS.length,
      serverNow: new Date().toISOString(),
    };

    const email =
      typeof req.query.email === "string"
        ? req.query.email.trim().toLowerCase()
        : "";
    if (!email) {
      return res.json(base);
    }

    const existingResult = await MarathonResult.findOne({ email });
    if (existingResult) {
      return res.json({
        ...base,
        alreadyCompleted: true,
        result: {
          correctCount: existingResult.correctCount,
          totalQuestions: existingResult.totalQuestions,
          elapsedMs: existingResult.elapsedMs,
          finishedAt: existingResult.finishedAt,
        },
      });
    }

    return res.json({ ...base, alreadyCompleted: false });
  } catch (err) {
    console.error("getMarathonStatus error:", err);
    res.status(500).json({ message: "სერვერზე მოხდა შეცდომა." });
  }
};

export const getMarathonQuestions = async (req, res) => {
  try {
    const sanitized = MARATHON_QUESTIONS.map(({ id, question, options }) => ({
      id,
      question,
      options,
    }));

    res.json({
      questions: sanitized,
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
    const { email, answers, integrity, startedAt } = req.body;

    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return res
        .status(400)
        .json({ message: "ვალიდური ელ. ფოსტა სავალდებულოა." });
    }

    if (
      !Array.isArray(answers) ||
      answers.length !== MARATHON_QUESTIONS.length
    ) {
      return res
        .status(400)
        .json({ message: "პასუხების რაოდენობა არასწორია." });
    }

    const validAnswers = answers.every(
      (a) => a === -1 || (Number.isInteger(a) && a >= 0 && a <= 3),
    );
    if (!validAnswers) {
      return res.status(400).json({ message: "პასუხის ფორმატი არასწორია." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await MarathonResult.findOne({ email: normalizedEmail });
    if (existing) {
      return res
        .status(409)
        .json({ message: "თქვენ უკვე დაასრულეთ მარათონი." });
    }

    const sanitizedIntegrity = sanitizeIntegrity(integrity);

    const now = new Date();
    const parsedStart = new Date(startedAt);
    if (!Number.isFinite(parsedStart.getTime())) {
      return res
        .status(400)
        .json({ message: "დროის მონაცემები არასწორია. სცადეთ თავიდან." });
    }
    const startedAtMs = parsedStart.getTime();

    const elapsedMs = Math.min(
      Math.max(0, now.getTime() - startedAtMs),
      MARATHON_DURATION_MS + MARATHON_GRACE_MS,
    );

    let correctCount = 0;
    MARATHON_QUESTIONS.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correctCount += 1;
    });

    const result = await MarathonResult.create({
      email: normalizedEmail,
      answers,
      correctCount,
      totalQuestions: MARATHON_QUESTIONS.length,
      startedAt: new Date(startedAtMs),
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
      return res
        .status(409)
        .json({ message: "თქვენ უკვე დაასრულეთ მარათონი." });
    }
    console.error("submitMarathonResult error:", err);
    res
      .status(500)
      .json({ message: "სერვერზე მოხდა შეცდომა. სცადეთ ხელახლა." });
  }
};
