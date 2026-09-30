import mongoose from "mongoose";
import { COMMITTEE_IDS } from "../config/munCommittees.js";

const { Schema } = mongoose;

const committeeAccessSchema = new Schema(
  {
    committeeId: {
      type: String,
      required: true,
      unique: true,
      enum: COMMITTEE_IDS,
    },
    passwordHash: { type: String, required: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("CommitteeAccess", committeeAccessSchema);
