// src/index.ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { configureApp } from "./config";
import { sessionMiddleware } from "./middleware/session";
import { csrfProtection } from "./middleware/csrf";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/user";
import { errorHandler } from "./middleware/errorHandler";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", errorHandler);
app.use("*", sessionMiddleware);
app.use("*", csrfProtection);

// Routes
app.route("/auth", authRoutes);
app.route("/user", userRoutes);

app.get("/", (c) => c.text("Hono Entra ID Auth Service"));

const port = process.env.PORT || 3000;

const main = async () => {
  await configureApp();
  console.log(`Server is running on port ${port}`);
  serve({
    fetch: app.fetch,
    port: Number(port),
  });
};

main().catch(console.error);
