import mongoose from "mongoose";
import { sessionFields } from "./schemas/sessionFields.js";

const { Schema } = mongoose;

const committeeSessionSchema = new Schema(
  {
    ...sessionFields,
    syncedAt: { type: Date, default: Date.now },
  },
  { id: false },
);

committeeSessionSchema.index({ committeeId: 1 }, { unique: true });

export default mongoose.model("CommitteeSession", committeeSessionSchema);
