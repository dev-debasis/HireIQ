import dotenv from "dotenv";

dotenv.config();

import { app } from "./app.js";
import connectDB from "./db/index.js";

const PORT = process.env.PORT || 8000;

connectDB()
.then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running at port 3000`);
    });
})
.catch((error) => {
    console.log("MongoDB Connection Error: ",error);
})
