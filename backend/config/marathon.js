// How long each attempt lasts, counted from the moment someone loads
// the questions until their answers are auto-submitted.
export const MARATHON_DURATION_MS = 5 * 60 * 1000;

// Small buffer so a submission fired right at the deadline isn't
// rejected for network/latency reasons (does not give anyone more time
// to answer — it only avoids punishing slow connections).
export const MARATHON_GRACE_MS = 15 * 1000;
