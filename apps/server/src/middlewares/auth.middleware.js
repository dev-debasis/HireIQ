import { getAuth } from "@clerk/express";
import { Hr } from "../models/hr.model.js";

export const requireHR = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized - No Clerk user" });
    }

    const hr = await Hr.findOne({ clerkUserId: userId });
    if (!hr) {
      return res.status(403).json({ message: "HR not found in database" });
    }

    req.user = hr;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res
      .status(401)
      .json({ message: "Invalid token", error: err.message });
  }
};
