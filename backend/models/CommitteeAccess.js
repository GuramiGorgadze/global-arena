import mongoose from "mongoose";
import { COMMITTEE_IDS } from "../config/munCommittees.js";

const { Schema } = mongoose;

// One document per committee. The "account" here is the committee itself,
// not an individual chair: whoever knows the password can run that
// committee's console, the same way a physical placard gets handed to
// whichever delegate is speaking. The first person to type a password for a
// given committee is the one who sets it — see controllers/munAuth.js.
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
