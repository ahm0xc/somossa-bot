import { Hono } from "hono";
import healthRoute from "./health";
import logRoute from "./log";
import feedbackRoute from "./feedback";

export function setupRoutes(app: Hono) {
  app.route("/health", healthRoute);
  app.route("/log", logRoute);
  app.route("/feedback", feedbackRoute);
  
  return app;
} 