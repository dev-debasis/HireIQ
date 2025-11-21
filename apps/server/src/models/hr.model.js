import mongoose, { Schema } from "mongoose";

const hrSchema = new Schema({
    clerkUserId: {
        type: String,
        required: true,
        unique: true,
    },

    name: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    avatar: {
        type: String,
        default: "https://res.cloudinary.com/debasiskhamari/image/upload/v1763738636/user_akcrnl.png",
    },

}, 
{
    timestamps: true,
});

export const Hr = mongoose.model("Hr", hrSchema);
