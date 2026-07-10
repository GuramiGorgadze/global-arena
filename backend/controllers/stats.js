import Visit from "../models/visit.js";

export const trackVisit = async (req, res, next) => {
  try {
    await Visit.updateOne(
      { key: "global" },
      { $inc: { count: 1 }, $set: { lastVisited: new Date() } },
      { upsert: true },
    );
  } catch (err) {
    console.error("Visit tracking error:", err.message);
  }
  next();
};

export const getVisitCount = async (req, res) => {
  try {
    const visit = await Visit.findOne({});
    res.json({ count: visit ? visit.count : 0 });
  } catch (err) {
    console.error("getVisitCount error:", err);
    res.status(500).json({ message: "Could not fetch visit count." });
  }
};
