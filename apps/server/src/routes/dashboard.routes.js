import express from "express";
import { requireHR } from "../middlewares/auth.middleware.js";
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import { getActivity } from "../controllers/dashboard.controller.js";
import { getScoreDistribution } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.route("/stats").get(requireHR, getDashboardStats);
router.route("/activity").get(requireHR, getActivity);
router.route("/score-distribution").get(requireHR, getScoreDistribution);

export default router;
