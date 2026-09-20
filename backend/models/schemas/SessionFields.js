import mongoose from "mongoose";
import { COMMITTEE_IDS } from "../../config/munCommittees.js";

const { Schema } = mongoose;

// These subdocument schemas mirror the shape the frontend's reducer already
// produces (src/hooks/useSessionEngine.js in the client app) field for
// field, so the API can store and return a session with no translation
// step. Every array is capped so a runaway or buggy client can't grow a
// single committee's document without bound.
//
// v2 note: the old `gsl`, `caucus` and `caucusTimer` fields are gone. A
// caucus is no longer a parallel object with its own clock — it's a mode on
// `floor`, with its own entry in `lists`, and there is one timer (`speech`)
// for the whole session.

export const MAX_LOG_ENTRIES = 500;
export const MAX_MOTIONS = 300;
export const MAX_DOCUMENTS = 150;
export const MAX_QUEUE_ENTRIES = 200;

// Kept under the old name too, so any import elsewhere in the server still
// resolves while you migrate.
export const MAX_GSL_QUEUE = MAX_QUEUE_ENTRIES;

const timerSchema = new Schema(
  {
    durationMs: { type: Number, default: 0, min: 0 },
    elapsedMs: { type: Number, default: 0, min: 0 },
    running: { type: Boolean, default: false },
    startedAt: { type: Number, default: null },
  },
  { _id: false },
);

const delegateSchema = new Schema(
  {
    id: { type: String, required: true },
    code: { type: String, default: "", trim: true, maxlength: 8 },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    role: { type: String, default: "", trim: true, maxlength: 400 },
    // A path or URL to this seat's portrait. Only crisis cabinets use it;
    // everyone else falls back to the flag `code` above.
    photo: { type: String, default: "", trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["present", "voting", "absent"],
      default: "present",
    },
    speeches: { type: Number, default: 0, min: 0 },
    speakingMs: { type: Number, default: 0, min: 0 },
    points: { type: Number, default: 0, min: 0 },
    note: { type: String, default: "", maxlength: 4000 },
  },
  { _id: false },
);

const queueEntrySchema = new Schema(
  {
    entryId: { type: String, required: true },
    delegateId: { type: String, required: true },
  },
  { _id: false },
);

const listSchema = new Schema(
  {
    open: { type: Boolean, default: true },
    queue: { type: [queueEntrySchema], default: [] },
  },
  { _id: false },
);

// Two lists, always both present. The caucus list is emptied whenever a
// caucus starts or ends; the general list persists untouched underneath it,
// which is the whole reason they're separate.
const listsSchema = new Schema(
  {
    gsl: { type: listSchema, default: () => ({ open: true, queue: [] }) },
    caucus: { type: listSchema, default: () => ({ open: true, queue: [] }) },
  },
  { _id: false },
);

// What the floor is doing. `consumedMs` is the only stored part of a
// moderated caucus's budget — the remaining time is always derived, so it
// can't drift away from the speeches that spent it.
const floorSchema = new Schema(
  {
    mode: {
      type: String,
      enum: ["gsl", "moderated", "unmoderated"],
      default: "gsl",
    },
    topic: { type: String, default: "", maxlength: 300 },
    totalMs: { type: Number, default: 0, min: 0 },
    consumedMs: { type: Number, default: 0, min: 0 },
    speakers: { type: Number, default: 0, min: 0 },
    speechMs: { type: Number, default: 0, min: 0 },
    proposerId: { type: String, default: null },
  },
  { _id: false },
);

const speakerSchema = new Schema(
  {
    delegateId: { type: String, required: true },
    source: { type: String, default: "gsl" },
  },
  { _id: false },
);

const motionSchema = new Schema(
  {
    id: { type: String, required: true },
    typeId: { type: String, required: true },
    proposerId: { type: String, default: null },
    // Shape varies by motion type (totalMs, speechMs, topic, title, subject
    // in different combinations) — Mixed is the honest type here rather
    // than a schema that only fits some motions.
    params: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["pending", "passed", "failed", "withdrawn"],
      default: "pending",
    },
    tally: { type: Schema.Types.Mixed, default: null },
    createdAt: { type: Number, required: true },
    resolvedAt: { type: Number, default: null },
  },
  { _id: false },
);

const voteSchema = new Schema(
  {
    id: { type: String, required: true },
    kind: { type: String, enum: ["procedural", "substantive"], required: true },
    subject: { type: String, default: "", maxlength: 300 },
    threshold: { type: String, default: "simple" },
    // { [delegateId]: 'yes' | 'no' | 'abstain' } — keyed by a variable set
    // of delegate ids, so this can't be a fixed schema.
    ballots: { type: Schema.Types.Mixed, default: {} },
    openedAt: { type: Number, required: true },
    closedAt: { type: Number, default: null },
    result: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const documentSchema = new Schema(
  {
    id: { type: String, required: true },
    typeId: { type: String, required: true },
    title: { type: String, trim: true, maxlength: 300 },
    sponsors: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "introduced", "passed", "failed"],
      default: "draft",
    },
    createdAt: { type: Number, required: true },
  },
  { _id: false },
);

const logEntrySchema = new Schema(
  {
    id: { type: String, required: true },
    at: { type: Number, required: true },
    kind: { type: String, default: "note", maxlength: 20 },
    text: { type: String, default: "", maxlength: 2000 },
    delegateId: { type: String, default: null },
  },
  { _id: false },
);

const settingsSchema = new Schema(
  {
    chime: { type: Boolean, default: true },
    autoPause: { type: Boolean, default: true },
    speechMs: { type: Number, default: 60000, min: 0 },
    quorumRatio: { type: Number, default: 0.25, min: 0, max: 1 },
  },
  { _id: false },
);

// Spread this into `new Schema({ ...sessionFields, ... })` — it's not a
// schema itself, just the field map shared by the live session collection
// and its archive, so the two can never drift apart from each other.
export const sessionFields = {
  committeeId: { type: String, required: true, enum: COMMITTEE_IDS },
  // The reducer's own schema-version marker. v2 is the floor/lists shape;
  // the client migrates anything older on load.
  version: { type: Number, default: 2 },
  // The reducer's own client-generated session id (its `id` field). Named
  // differently here to avoid colliding with Mongoose's own virtual `id`
  // getter for `_id` — see the { id: false } schema option on the models
  // that use this field map.
  clientSessionId: { type: String, default: "" },
  topic: { type: String, trim: true, maxlength: 300, default: "" },
  phase: {
    type: String,
    enum: ["rollcall", "session", "closed"],
    default: "rollcall",
  },
  createdAt: { type: Number, required: true },
  openedAt: { type: Number, default: null },
  closedAt: { type: Number, default: null },
  delegates: { type: [delegateSchema], default: [] },
  floor: { type: floorSchema, default: () => ({}) },
  lists: { type: listsSchema, default: () => ({}) },
  speaker: { type: speakerSchema, default: null },
  speech: { type: timerSchema, default: () => ({}) },
  motions: { type: [motionSchema], default: [] },
  vote: { type: voteSchema, default: null },
  documents: { type: [documentSchema], default: [] },
  log: { type: [logEntrySchema], default: [] },
  settings: { type: settingsSchema, default: () => ({}) },
};
