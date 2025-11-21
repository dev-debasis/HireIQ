import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(MONGODB_URI);
    console.log("MongoDB Connected Successfully!!");
  } catch (error) {
    console.log("MongoDB Connection Failed: ", error);
    process.exit(1);
  }
};

export default connectDB;
