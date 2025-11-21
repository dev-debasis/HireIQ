import mongoose, { Schema } from "mongoose";

const candidateSchema = new Schema({
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: "Hr",
        required: true,
    },

    uploadedForJob: {
        type: Schema.Types.ObjectId,
        ref: "Job",
        required: true,
    },

    name: {
        type: String,
        trim: true,
    },

    email: {
        type: String,
        trim: true,
        lowercase: true,
    },

    resumeUrl: {
        type: String,
        required: true,
    },

    resumeText: {
        type: String,
        default: "",
    },

    parsedSkills: {
        type: [String],
        default: [],
    },

    yearsExperience: {
        type: Number,
        default: 0,
    },

    embedding: {
        type: [Number],
        default: [],
    },

    status: {
        type: String,
        enum: ["uploaded", "parsed", "ready"],
        default: "uploaded",
    },

}, { timestamps: true });

candidateSchema.index({ embedding: "vector" });

export const Candidate = mongoose.model("Candidate", candidateSchema);
