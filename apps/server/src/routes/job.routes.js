import express from "express";
import { requireHR } from "../middlewares/auth.middleware.js";
import {
  createJob,
  updateJob,
  getJobsByHR,
  getJobById,
  deleteJob,
} from "../controllers/job.controller.js";

const router = express.Router();

router.route("/").post(requireHR, createJob);
router.route("/:jobId").put(requireHR, updateJob);
router.route("/").get(requireHR, getJobsByHR);
router.route("/:jobId").get(requireHR, getJobById);
router.route("/:jobId").delete(requireHR, deleteJob);
export default router;
