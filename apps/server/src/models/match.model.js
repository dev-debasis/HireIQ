import mongoose, { Schema, skipMiddlewareFunction } from "mongoose";

const matchSchema = new Schema({
    jobId: {
        type: Schema.Types.ObjectId,
        ref: "Job",
        required: true,
    },

    candidateId: {
        type: Schema.Types.ObjectId,
        ref: "Candidate",
        required: true,
    },

    semanticScore: {
        type: Number,
        default: 0,
    },

    skillScore: {
        type: Number,
        default: 0,
    },

    experienceScore: {
        type: Number,
        default: 0,
    },

    finalScore: {
        type: Number,
        default: 0,
    },

    matchedSkills: {
        type: [String],
        default: [],
    },

    missingSkills: {
        type: [String],
        default: [],
    },

    evidenceSnippets: [{
        skill: String,
        snippet: String,
    }],

    shortlisted: {
        type: Boolean,
        default: false,
    },

    notes: {
        type: String,
        trim: true,
        default: "",
    },

}, { timestamps: true });

matchSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

export const Match = mongoose.model("Match", matchSchema);
