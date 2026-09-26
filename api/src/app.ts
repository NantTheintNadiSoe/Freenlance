import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOrigins } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { contractsRouter } from "./routes/contracts.js";
import { healthRouter } from "./routes/health.js";
import { jobsRouter } from "./routes/jobs.js";
import { messagesRouter } from "./routes/messages.js";
import { proposalsRouter } from "./routes/proposals.js";
import { profilesRouter } from "./routes/profiles.js";
import { notificationsRouter } from "./routes/notifications.js";
import { reviewsRouter } from "./routes/reviews.js";
import { errorHandler, notFound } from "./middleware/errors.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use((request, _response, next) => {
    request.logError = (error) => console.error(JSON.stringify({ method: request.method, path: request.path, error }));
    next();
  });

  app.use(healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/jobs", jobsRouter);
  app.use("/api/v1/proposals", proposalsRouter);
  app.use("/api/v1/profiles", profilesRouter);
  app.use("/api/v1/notifications", notificationsRouter);
  app.use("/api/v1/reviews", reviewsRouter);
  app.use("/api/v1/contracts", contractsRouter);
  app.use("/api/v1/conversations", messagesRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
