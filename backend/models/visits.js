import mongoose from "mongoose";

const visitSchema = new mongoose.Schema({
  key: { type: String, default: "global", unique: true },
  count: { type: Number, default: 0 },
  lastVisited: { type: Date, default: Date.now },
});

export default mongoose.model("Visit", visitSchema);