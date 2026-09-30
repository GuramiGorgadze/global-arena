import mongoose from "mongoose";
import { sessionFields } from "./schemas/SessionFields.js";

const { Schema } = mongoose;

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
