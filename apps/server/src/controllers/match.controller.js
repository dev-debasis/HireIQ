import { Job } from "../models/job.model.js";
import { Candidate } from "../models/candidate.model.js";
import { Match } from "../models/match.model.js";

const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0.0;
  let magA = 0.0;
  let magB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) return 0;

  return dotProduct / (magA * magB);
};

const extractEvidenceSnippets = (resumeText, skill) => {
  const textLower = resumeText.toLowerCase();
  const skillLower = skill.toLowerCase();
  const index = textLower.indexOf(skillLower);

  if (index === -1) return null;

  const start = Math.max(0, index - 50);
  const end = Math.min(resumeText.length, index + skill.length + 50);

  return resumeText.substring(start, end).trim();
};

const matchCandidatesToJob = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized Access",
      });
    }
    const { jobId } = req.params;

    const job = await Job.findOne({
      _id: jobId,
      createdBy: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    const candidates = await Candidate.find({
      uploadedForJob: jobId,
      status: "ready",
    });

    const matchResults = [];

    for (const candidate of candidates) {
      const semanticScore = cosineSimilarity(
        job.jobEmbedding,
        candidate.embedding
      );

      const resumeTextLower = candidate.resumeText.toLowerCase();
      const matchedSkills = [];
      const missingSkills = [];

      for (const skill of job.requiredSkills) {
        if (resumeTextLower.includes(skill.toLowerCase())) {
          matchedSkills.push(skill);
        } else {
          missingSkills.push(skill);
        }
      }

      const skillScore = matchedSkills.length / job.requiredSkills.length || 0;

      const experienceScore = candidate.yearsExperience
        ? Math.min(candidate.yearsExperience / 10, 1)
        : 0;

      const finalScore =
        semanticScore * 0.6 + skillScore * 0.3 + experienceScore * 0.1;

      const evidenceSnippets = matchedSkills
        .map((skill) => ({
          skill,
          snippet: extractEvidenceSnippets(candidate.resumeText, skill),
        }))
        .filter((s) => s.snippet !== null);

      const matchRecord = await Match.findOneAndUpdate(
        { jobId, candidateId: candidate._id },
        {
          semanticScore,
          skillScore,
          experienceScore,
          finalScore,
          matchedSkills,
          missingSkills,
          evidenceSnippets,
        },
        { upsert: true, new: true }
      );

      matchResults.push(matchRecord);
    }

    matchResults.sort((a, b) => b.finalScore - a.finalScore);

    return res.status(200).json({
      message: "Matching complete",
      matches: matchResults,
    });
  } catch (err) {
    console.error("Match error:", err);
    res.status(500).json({
      message: "Failed to match candidates",
      error: err.message,
    });
  }
};

const getMatchesForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findOne({
      _id: jobId,
      createdBy: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    const matches = await Match.find({ jobId })
      .populate("candidateId")
      .sort({ finalScore: -1 });

    return res.status(200).json(matches);
  } catch (err) {
    console.error("Fetch match error:", err);
    res.status(500).json({
      message: "Failed to fetch matches",
      error: err.message,
    });
  }
};

const shortlistCandidate = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findByIdAndUpdate(
      matchId,
      { shortlisted: true },
      { new: true }
    );

    return res.status(200).json({
      message: "Candidate shortlisted",
      match,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to shortlist",
      error: err.message,
    });
  }
};

const addNotesToMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { notes } = req.body;

    const match = await Match.findByIdAndUpdate(
      matchId,
      { notes },
      { new: true }
    );

    return res.status(200).json({
      message: "Notes updated",
      match,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to add notes",
      error: err.message,
    });
  }
};

export {
  matchCandidatesToJob,
  getMatchesForJob,
  shortlistCandidate,
  addNotesToMatch,
};
