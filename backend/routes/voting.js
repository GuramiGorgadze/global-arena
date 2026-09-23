import { Router } from "express";
import {
  getState,
  castVote,
  getAdminState,
  openResolution,
  closeResolution,
  requireChairKey,
} from "../controllers/voting.js";

const router = Router();

router.post("/state", getState);
router.post("/vote", castVote);

router.get("/admin/state", requireChairKey, getAdminState);
router.post("/admin/open", requireChairKey, openResolution);
router.post("/admin/close", requireChairKey, closeResolution);

export default router;