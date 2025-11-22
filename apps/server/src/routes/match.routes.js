import express from "express";
import { requireHR } from "../middlewares/auth.middleware.js";
import {
  addNotesToMatch,
  getMatchesForJob,
  matchCandidatesToJob,
  shortlistCandidate,
} from "../controllers/match.controller.js";

const router = express.Router();

router.route("/:jobId/run").post(requireHR, matchCandidatesToJob);
router.route("/:jobId").get(requireHR, getMatchesForJob);
router.route("/:matchId/shortlist").post(requireHR, shortlistCandidate);
router.route("/:matchId/notes").post(requireHR, addNotesToMatch);

export default router;
