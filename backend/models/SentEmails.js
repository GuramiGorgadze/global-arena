import mongoose from "mongoose";

const { Schema } = mongoose;

const sentEmailSchema = new Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    type: {
      type: String,
      required: true,
      enum: ["payment", "confirmation"],
    },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

sentEmailSchema.index({ email: 1, type: 1 }, { unique: true });

export default mongoose.model("SentEmail", sentEmailSchema);