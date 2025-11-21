import express from "express";
import cors from "cors";

const app = express();

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
  next();
});

export { app };
