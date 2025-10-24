// src: ./supertokens-api/app.js

// import dotenv from "dotenv";
// // Load the environment variables from .env file in development mode

// if (process.env.ENVIRONMENT !== "production") {
//   dotenv.config({ path: ".env.dev" });
//   console.log("Development mode: Loaded .env.dev file");
// }
// console.log(
//   "From ./supertokens-api/app.js Environment:",
//   process.env.ENVIRONMENT
// );
// console.log("\n");

import express from "express";
import cors from "cors";

import indexRouter from "./routes/indexRoutes.js";
import usersRouter from "./routes/usersRoutes.js";

// ----------------------------SuperTokens Imports--------------------------
import { initSuperTokens } from "./config/SuperTokens.js";
import supertokens from "supertokens-node";
import { errorHandler } from "supertokens-node/framework/express";
import { middleware } from "supertokens-node/framework/express";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import pkg from "supertokens-node/framework/express";
const { SessionRequest } = pkg;
// -------------------------------------------------------------------------
import { setupViewEngine } from "./config/viewEngine.js";
import { setupMiddleware } from "./config/middleware.js";

import {
  notFoundHandler,
  generalErrorHandler,
} from "./middlewares/errorHandlers.js";

const app = express();

// ℹ️ IMPORTANT: initSuperTokens should be called before any other SuperTokens middleware
// Initialize SuperTokens with the required configurations from the config file.
initSuperTokens();

// ℹ️ IMPORTANT: CORS should be before any other middleware
const websiteUrl = String(process.env.SUPERTOKENS_WEBSITE_DOMAIN);
console.log("CORS - websiteUrl:", websiteUrl);

app.use(
  cors({
    origin: websiteUrl,
    allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
    credentials: true,
  })
);

setupViewEngine(app);
setupMiddleware(app);

// This middleware will add the SuperTokens routes to your app
app.use(middleware());

app.use((req, res, next) => {
  // Skip SuperTokens and any public endpoints
  if (req.path.startsWith("/auth") || req.path === "/health") return next();
  return verifySession({ checkDatabase: true })(req, res, next);
});

app.use("/", indexRouter);
app.use("/hello", verifySession(), usersRouter);

// catch 404 and forward to error handler
app.use(notFoundHandler);
app.use(generalErrorHandler);

// Add this AFTER all your routes for SuperTokens to handle its errors
app.use(errorHandler());

export default app;
