import mongoose from "mongoose";

const { Schema } = mongoose;

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

    // Selected option index per question, in question order.
    // -1 means "left unanswered".
    answers: {
      type: [Number],
      required: true,
    },

    correctCount: { type: Number, required: true, min: 0 },
    totalQuestions: { type: Number, required: true, min: 0 },

    // startedAt is the official marathon start (MARATHON_START_AT),
    // finishedAt is when the server received the submission.
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, required: true },
    elapsedMs: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

// Fast leaderboard sort: most correct first, then fastest finish.
marathonResultSchema.index({ correctCount: -1, elapsedMs: 1 });

export default mongoose.model("MarathonResult", marathonResultSchema);