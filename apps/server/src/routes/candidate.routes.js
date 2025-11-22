import express from "express";
import {
  uploadCandidates,
  processCandidatePipeline,
  getCandidatesByJob,
} from "../controllers/candidate.controller.js";
import { requireHR } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router
  .route("/:jobId/upload")
  .post(requireHR, upload.array("files"), uploadCandidates);

router.route("/process").post(requireHR, processCandidatePipeline);

router.route("/:jobId").get(requireHR, getCandidatesByJob);

export default router;
