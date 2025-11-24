import { Job } from "../models/job.model.js";
import { Candidate } from "../models/candidate.model.js";
import { Match } from "../models/match.model.js";

const fmtDate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getDashboardStats = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const hrId = req.user._id;
    console.log("[dashboard] request by HR id:", hrId && hrId.toString ? hrId.toString() : hrId);

    const jobs = await Job.find({ createdBy: hrId }).select("_id");
    console.log("[dashboard] jobs found:", jobs.length);
    const jobIds = jobs.map((j) => j._id);
    if (jobs.length > 0) {
      console.log("[dashboard] jobIds sample:", jobIds.slice(0, 10));
    }

    const totalJobs = jobIds.length;
    if (totalJobs === 0) {
      return res.status(200).json({ totalJobs: 0, totalCandidates: 0, avgMatchScore: 0, shortlistedCandidates: 0 });
    }

    const totalCandidates = await Candidate.countDocuments({ uploadedForJob: { $in: jobIds }, uploadedBy: hrId });

    const matchAgg = await Match.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      {
        $group: {
          _id: null,
          avgFinalScore: { $avg: "$finalScore" },
          shortlistedCount: { $sum: { $cond: ["$shortlisted", 1, 0] } },
          matchesCount: { $sum: 1 },
        },
      },
    ]);

    const avgMatchScore = matchAgg.length && matchAgg[0].avgFinalScore ? matchAgg[0].avgFinalScore * 100 : 0;
    const shortlistedCandidates = matchAgg.length ? matchAgg[0].shortlistedCount : 0;

    return res.status(200).json({
      totalJobs,
      totalCandidates,
      avgMatchScore,
      shortlistedCandidates,
      debug: {
        hrId: hrId && hrId.toString ? hrId.toString() : hrId,
        jobsQueried: jobs.length,
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return res.status(500).json({ message: "Failed to fetch dashboard stats", error: err.message });
  }
};

export { getDashboardStats };

const getActivity = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const hrId = req.user._id;

    const jobs = await Job.find({ createdBy: hrId }).select("_id");
    const jobIds = jobs.map((j) => j._id);

    const days = 14;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const uploadsAgg = await Candidate.aggregate([
      { $match: { uploadedForJob: { $in: jobIds }, uploadedBy: hrId, createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    ]);

    const matchesAgg = await Match.aggregate([
      { $match: { jobId: { $in: jobIds }, createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    ]);

    const uploadsByDate = {};
    uploadsAgg.forEach((r) => (uploadsByDate[r._id] = r.count));
    const matchesByDate = {};
    matchesAgg.forEach((r) => (matchesByDate[r._id] = r.count));

    const series = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = fmtDate(d);
      series.push({ date: key, uploads: uploadsByDate[key] || 0, matches: matchesByDate[key] || 0 });
    }

    return res.status(200).json({ series });
  } catch (err) {
    console.error("Dashboard activity error:", err);
    return res.status(500).json({ message: "Failed to fetch activity", error: err.message });
  }
};

export { getActivity };

const getScoreDistribution = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const hrId = req.user._id;

    const jobs = await Job.find({ createdBy: hrId }).select("_id");
    const jobIds = jobs.map((j) => j._id);

    if (jobIds.length === 0) {
      const buckets = [];
      for (let b = 0; b < 100; b += 10) {
        buckets.push({ bucket: b, count: 0 });
      }
      return res.status(200).json({ buckets });
    }

    const agg = await Match.aggregate([
      { $match: { jobId: { $in: jobIds }, finalScore: { $exists: true } } },
      {
        $project: {
          scorePercent: { $multiply: ["$finalScore", 100] },
        },
      },
      {
        $project: {
          bucket: {
            $multiply: [
              { $floor: { $divide: ["$scorePercent", 10] } },
              10,
            ],
          },
        },
      },
      { $group: { _id: "$bucket", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const map = {};
    agg.forEach((r) => {
      map[r._id] = r.count;
    });

    const buckets = [];
    for (let b = 0; b < 100; b += 10) {
      buckets.push({ bucket: b, count: map[b] || 0 });
    }

    return res.status(200).json({ buckets });
  } catch (err) {
    console.error("Score distribution error:", err);
    return res.status(500).json({ message: "Failed to fetch score distribution", error: err.message });
  }
};

export { getScoreDistribution };
