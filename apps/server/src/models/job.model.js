import mongoose, { Schema } from "mongoose";

const jobSchema = new Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "Hr",
        required: true,
    },

    jobTitle: {
        type: String,
        required: true,
        trim: true,
    },

    jobDescription: {
        type: String,
        required: true,
    },

    requiredSkills: {
        type: [String],
        default: [],
    },

    niceToHaveSkills: {
        type: [String],
        default: [],
    },

    experienceLevel: {
        type: String,
        enum: ["Fresher","Junior", "Mid", "Senior", "Any"],
        default: "Any",
    },

    jobEmbedding: {
        type: [Number],
        default: [],
    },

}, { timestamps: true });

jobSchema.index({ jobEmbedding: "vector" });

export const Job = mongoose.model("Job", jobSchema);
