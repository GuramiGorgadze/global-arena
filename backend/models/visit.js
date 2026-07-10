import mongoose from "mongoose";

const visitSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  lastVisited: { type: Date, default: Date.now },
});

export default mongoose.model("Visit", visitSchema);