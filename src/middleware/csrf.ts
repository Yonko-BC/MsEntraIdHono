import { Context, Next } from "hono";
import { csrf } from "hono/csrf";

export const csrfProtection = csrf({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
});
