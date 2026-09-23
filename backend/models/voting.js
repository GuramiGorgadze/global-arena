import mongoose from "mongoose";

const resolutionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    committee: { type: String, trim: true, maxlength: 60, default: "" },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    eligibleCount: { type: Number, default: null },
    closedAt: Date,
  },
  { timestamps: true },
);

const ballotSchema = new mongoose.Schema(
  {
    resolution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resolution",
      required: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    choice: { type: String, enum: ["yes", "no", "abstain"], required: true },
  },
  { timestamps: true },
);

// This index is what guarantees one vote per delegate, even if two
// requests race.
ballotSchema.index({ resolution: 1, email: 1 }, { unique: true });

export const Resolution = mongoose.model("Resolution", resolutionSchema);
export const Ballot = mongoose.model("Ballot", ballotSchema);