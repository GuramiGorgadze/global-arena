import mongoose from "mongoose";

const { Schema } = mongoose;

const integrityEventSchema = new Schema(
  {
    type: { type: String, trim: true },
    at: { type: Date },
    durationMs: { type: Number, min: 0 },
  },
  { _id: false },
);

const integritySchema = new Schema(
  {
    tabSwitchCount: { type: Number, default: 0, min: 0 },
    awayMs: { type: Number, default: 0, min: 0 },
    events: { type: [integrityEventSchema], default: [] },
  },
  { _id: false },
);

const marathonResultSchema = new Schema(
  {
    delegate: { type: Schema.Types.ObjectId, ref: "Delegate" },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    fullNameLatin: { type: String, trim: true },

    answers: {
      type: [Number],
      required: true,
    },

    correctCount: { type: Number, required: true, min: 0 },
    totalQuestions: { type: Number, required: true, min: 0 },

    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, required: true },
    elapsedMs: { type: Number, required: true, min: 0 },

    integrity: { type: integritySchema, default: () => ({}) },
  },
  { timestamps: true },
);

marathonResultSchema.index({ correctCount: -1, elapsedMs: 1 });

marathonResultSchema.index({ "integrity.tabSwitchCount": -1 });

export default mongoose.model("MarathonResult", marathonResultSchema);