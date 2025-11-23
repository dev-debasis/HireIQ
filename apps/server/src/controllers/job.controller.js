import mongoose from "mongoose";
import { Job } from "../models/job.model.js";
import { generateEmbedding } from "../utils/generateEmbedding.js";
import { normalizeSkillsArray } from "../utils/normalizeSkills.js";

const createJob = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({
        message: "Unauthorized Access",
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: "Request body cannot be empty",
      });
    }

    const {
      jobTitle,
      jobDescription,
      requiredSkills,
      niceToHaveSkills,
      experienceLevel,
    } = req.body || {};

    if (
      !jobTitle ||
      !jobDescription ||
      !requiredSkills ||
      requiredSkills.length === 0
    ) {
      return res.status(400).json({
        message: "jobTitle, jobDescription, and requiredSkills are required",
      });
    }

    if (!Array.isArray(requiredSkills)) {
      return res.status(400).json({
        message: "requiredSkills must be an array of strings",
      });
    }

    if (niceToHaveSkills && !Array.isArray(niceToHaveSkills)) {
      return res.status(400).json({
        message: "niceToHaveSkills must be an array of strings",
      });
    }

    const jobEmbedding = await generateEmbedding(jobDescription);

    const normalizedRequiredSkills = normalizeSkillsArray(requiredSkills);
    const normalizedNiceToHaveSkills = normalizeSkillsArray(
      niceToHaveSkills || []
    );

    const newJob = await Job.create({
      createdBy: req.user._id,
      jobTitle,
      jobDescription,
      requiredSkills: normalizedRequiredSkills,
      niceToHaveSkills: normalizedNiceToHaveSkills,
      experienceLevel: experienceLevel || "Any",
      jobEmbedding,
    });

    return res.status(201).json({
      message: "Job created successfully",
      job: newJob,
    });
  } catch (error) {
    console.error("Error creating job:", error);
    return res.status(500).json({
      message: "Failed to create job",
      error: error.message,
    });
  }
};

const updateJob = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "Unauthorized Access" });
    }

    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        message: "Invalid Job ID",
      });
    }

    const updateData = req.body;

    if (
      updateData.requiredSkills &&
      !Array.isArray(updateData.requiredSkills)
    ) {
      return res.status(400).json({
        message: "requiredSkills must be an array of strings",
      });
    }

    if (
      updateData.niceToHaveSkills &&
      !Array.isArray(updateData.niceToHaveSkills)
    ) {
      return res.status(400).json({
        message: "niceToHaveSkills must be an array of strings",
      });
    }

    if (Array.isArray(updateData.requiredSkills)) {
      updateData.requiredSkills = normalizeSkillsArray(
        updateData.requiredSkills
      );
    }

    if (Array.isArray(updateData.niceToHaveSkills)) {
      updateData.niceToHaveSkills = normalizeSkillsArray(
        updateData.niceToHaveSkills
      );
    }

    if (updateData.jobDescription) {
      updateData.jobEmbedding = await generateEmbedding(
        updateData.jobDescription
      );
    }

    const updatedJob = await Job.findOneAndUpdate(
      { _id: jobId, createdBy: req.user._id },
      { $set: updateData },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({
        message: "Job not found or unauthorized",
      });
    }

    return res.status(200).json({
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    console.error("Error updating job:", error);
    return res.status(500).json({
      message: "Failed to update job",
      error: error.message,
    });
  }
};

const getJobsByHR = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({
        message: "Unauthorized Access",
      });
    }
    const jobs = await Job.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return res.status(500).json({
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
};

const getJobById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({
        message: "Unauthorized Access",
      });
    }

    const { jobId } = req.params;

    const job = await Job.findOne({ _id: jobId, createdBy: req.user._id });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    return res.status(200).json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    return res.status(500).json({
      message: "Failed to fetch job",
      error: error.message,
    });
  }
};

const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findOneAndDelete({
      _id: jobId,
      createdBy: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found or unauthorized",
      });
    }

    return res.status(200).json({
      message: "Job deleted successfully",
      job,
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    return res.status(500).json({
      message: "Failed to delete job",
      error: error.message,
    });
  }
};

export { createJob, updateJob, getJobsByHR, getJobById, deleteJob };
