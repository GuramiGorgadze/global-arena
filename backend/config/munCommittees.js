// Canonical registry of the six committee ids the MUN Command console
// understands. This file is the single source of truth for which ids are
// valid on the backend; the frontend's own src/data/munData.js owns the
// display data (names, rosters, rules) and must keep using these same ids.
//
// seatKind and MAX_ROSTER_SEATS exist purely for light server-side
// validation when a chair builds or edits their roster — they're not used
// to render anything.

export const COMMITTEE_IDS = [
  "unsc",
  "specpol",
  "unhrc",
  "hcc",
  "disec",
  "press",
];

export const COMMITTEE_SEAT_KIND = {
  unsc: "country",
  specpol: "country",
  unhrc: "country",
  hcc: "figure",
  disec: "country",
  press: "outlet",
};

// A generous ceiling, not a real-world expectation — just enough to stop a
// malformed request from writing an unbounded array into the database.
export const MAX_ROSTER_SEATS = 80;

export const isKnownCommittee = (committeeId) =>
  typeof committeeId === "string" && COMMITTEE_IDS.includes(committeeId);
