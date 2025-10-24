// src: ./config/middleware.js

import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import path from "path";
import { requestLogger } from "../middlewares/requestLogger.js";

export function setupMiddleware(app) {
  // ✅ trust the real client IP forwarded by Nginx/Proxy
  app.set("trust proxy", true);

  // Morgan dev logs
  app.use(logger("dev"));

  // Custom request logger
  app.use(requestLogger);

  // JSON and URL-encoded body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Cookie parser
  app.use(cookieParser());

  // Static file serving
  app.use(
    express.static(
      path.join(path.dirname(new URL(import.meta.url).pathname), "public")
    )
  );
}
