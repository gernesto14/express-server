import "dotenv/config";
import express from "express";
import indexRouter from "./routes/indexRoutes.js";
import usersRouter from "./routes/usersRoutes.js";

import { setupViewEngine } from "./config/viewEngine.js";
import { setupMiddleware } from "./config/middleware.js";

import {
  notFoundHandler,
  generalErrorHandler,
} from "./middlewares/errorHandlers.js";

const app = express();

setupViewEngine(app);
setupMiddleware(app);

app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(notFoundHandler);
app.use(generalErrorHandler);

export default app;
