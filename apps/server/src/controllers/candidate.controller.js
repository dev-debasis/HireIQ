import { Candidate } from "../models/candidate.model.js";
import { Job } from "../models/job.model.js";
import { PDFParse } from "pdf-parse";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { generateEmbedding } from "../utils/generateEmbedding.js";
import { SKILLS_DICTIONARY } from "../config/skillsDictionary.js";
import { normalizeSkillsArray } from "../utils/normalizeSkills.js";


const extractSkills = (resumeText) => {
  if (!resumeText || typeof resumeText !== "string") return [];

  const text = resumeText.toLowerCase();

  const foundSkillsSet = new Set();

  for (const key in SKILLS_DICTIONARY) {
    const { canonical, synonyms } = SKILLS_DICTIONARY[key];

    for (const synonym of synonyms) {
      const normalizedSynonym = synonym.toLowerCase();

      const pattern = new RegExp(
        `\\b${escapeRegex(normalizedSynonym)}\\b`,
        "i"
      );

      if (pattern.test(text)) {
        foundSkillsSet.add(canonical);
        break;
      }
    }
  }

  return Array.from(foundSkillsSet);
};

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const uploadCandidates = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const job = await Job.findOne({ _id: jobId, createdBy: req.user._id });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "No files uploaded",
      });
    }

    const createdCandidates = [];

    for (const file of req.files) {
      const uploadedFile = await uploadOnCloudinary(file.buffer);

      if (!uploadedFile) {
        return res
          .status(400)
          .json({ message: "Failed to upload file to Cloudinary" });
      }
      const candidate = await Candidate.create({
        uploadedBy: req.user._id,
        uploadedForJob: jobId,
        resumeUrl: uploadedFile.secure_url,
        status: "uploaded",
      });

      createdCandidates.push(candidate);
    }

    return res.status(201).json({
      message: "Resumes uploaded successfully",
      candidates: createdCandidates,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({
      message: "Failed to upload resumes",
      error: err.message,
    });
  }
};

const parseCandidateResume = async (candidateId) => {
  try {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return null;

    const parser = new PDFParse({ url: candidate.resumeUrl });
    const result = await parser.getText();
    const resumeText = result.text || "";

    if (resumeText.length < 50) {
      candidate.status = "error";
      candidate.errorMessage =
        "PDF content unreadable — please upload a text-based resume.";
      await candidate.save();
      return null;
    }

    const parsedSkills = extractSkills(resumeText);

    candidate.resumeText = resumeText;
    candidate.parsedSkills = normalizeSkillsArray(parsedSkills) ;
    candidate.status = "parsed";
    await candidate.save();

    return candidate;
  } catch (err) {
    console.error("Parsing error:", err);
    return null;
  }
};

const generateCandidateEmbedding = async (candidateId) => {
  try {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return null;

    const embedding = await generateEmbedding(candidate.resumeText);

    candidate.embedding = embedding;
    candidate.status = "ready";

    await candidate.save();

    return candidate;
  } catch (err) {
    console.error("Embedding error:", err);
    return null;
  }
};

const processCandidatePipeline = async (req, res) => {
  try {
    const { candidateIds } = req.body;

    if (!candidateIds || !Array.isArray(candidateIds)) {
      return res.status(400).json({
        message: "candidateIds must be an array",
      });
    }

    for(const id of candidateIds) {
      const candidate = await Candidate.findById(id);
      if (!candidate) {
        return res.status(404).json({ 
          message: `Candidate with ID ${id} not found` 
        });
      }
    }

    const processed = [];

    for (const id of candidateIds) {
      const parsedCandidate = await parseCandidateResume(id);
      if (!parsedCandidate) continue;

      const finalCandidate = await generateCandidateEmbedding(id);
      processed.push(finalCandidate);
    }

    return res.status(200).json({
      message: "Candidate processing complete",
      processed,
    });
  } catch (err) {
    console.error("Pipeline error:", err);
    res.status(500).json({
      message: "Failed to process candidates",
      error: err.message,
    });
  }
};

const getCandidatesByJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    const job = await Job.findOne({ _id: jobId, createdBy: req.user._id });
    if (!job) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }
    const candidates = await Candidate.find({
      uploadedForJob: jobId,
      uploadedBy: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json(candidates);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({
      message: "Failed to fetch candidates",
    });
  }
};

export { uploadCandidates, processCandidatePipeline, getCandidatesByJob };
