import express from "express";
import cors from "cors";
import candidateRouter from "./routes/candidate.routes.js";
import jobRouter from "./routes/job.routes.js";
import matchRouter from "./routes/match.routes.js";
import webhookRouter from "./routes/webhook.routes.js";
import { clerkMiddleware } from "@clerk/express";

const app = express();

app.use(clerkMiddleware());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20kb",
  })
);

app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/v1/webhook")) {
    next();
  } else {
    express.json({
      limit: "20kb",
    })(req, res, next);
  }
});

app.use("/api/v1/webhook", webhookRouter);
app.use("/api/v1/candidate", candidateRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/match", matchRouter);

export { app };
