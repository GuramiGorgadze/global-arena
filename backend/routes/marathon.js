import { Router } from "express";
import {
  getMarathonStatus,
  getMarathonQuestions,
  submitMarathonResult,
} from "../controllers/marathon.js";

const MarathonRouter = Router();

MarathonRouter.get("/status", getMarathonStatus);
MarathonRouter.get("/questions", getMarathonQuestions);
MarathonRouter.post("/submit", submitMarathonResult);

export default MarathonRouter;