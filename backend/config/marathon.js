// Central configuration for the IR Marathon event.
// Both the "questions" endpoint and the "submit" endpoint gate themselves
// against MARATHON_START_AT, so this is the ONLY place you need to edit
// if the schedule changes.

// Georgia (country) does not observe DST, so Asia/Tbilisi is a fixed UTC+4.
export const MARATHON_START_AT = new Date("2026-09-05T21:34:00+04:00");

// The marathon lasts exactly 5 minutes from MARATHON_START_AT.
export const MARATHON_DURATION_MS = 5 * 60 * 1000;

// Small buffer to tolerate network/latency on submissions that were
// triggered right at the deadline (does NOT extend how long delegates
// see the quiz for — it only avoids punishing slow networks).
export const MARATHON_GRACE_MS = 15 * 1000;