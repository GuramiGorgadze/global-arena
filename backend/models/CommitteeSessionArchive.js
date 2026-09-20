import mongoose from "mongoose";
import { sessionFields } from "./schemas/SessionFields.js";

const { Schema } = mongoose;

// A snapshot of a committee's session, written just before it is reset (see
// resetSession in controllers/munSession.js). A committee is typically
// reset once per conference day, so this collection stays small and exists
// purely so a chair can never lose a previous day's minutes by starting a
// fresh one.
const committeeSessionArchiveSchema = new Schema(
  {
    ...sessionFields,
    archivedAt: { type: Date, default: Date.now },
  },
  { id: false },
);

committeeSessionArchiveSchema.index({ committeeId: 1, archivedAt: -1 });

export default mongoose.model(
  "CommitteeSessionArchive",
  committeeSessionArchiveSchema,
);
