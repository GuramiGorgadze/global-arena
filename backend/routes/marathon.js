import { Router } from "express";
import {
  getMarathonStatus,
  getMarathonQuestions,
  submitMarathonResult,
} from "../controllers/marathon.js";

const router = Router();

router.get("/status", getMarathonStatus);
router.get("/questions", getMarathonQuestions);
router.post("/submit", submitMarathonResult);

export default router;