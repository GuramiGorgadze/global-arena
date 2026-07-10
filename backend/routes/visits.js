import express from "express";
import { trackVisit, getVisitCount } from "../controllers/visits.js";

const router = express.Router();

router.get("/count", getVisitCount);

export default router;