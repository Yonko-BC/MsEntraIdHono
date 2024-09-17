import { Context, Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { config } from "../config";
import { verifyToken } from "../services/authService";
import jwt from "jsonwebtoken";

export const sessionMiddleware = async (c: Context, next: Next) => {
  const sessionToken = getCookie(c, "sessionToken");
  const authHeader = c.req.header("Authorization");
  if (sessionToken) {
    try {
      const user = await verifyToken(sessionToken);
      c.set("user", user);
    } catch (error) {
      setCookie(c, "sessionToken", "", { maxAge: 0 });
      return c.json({ error: "Invalid or expired session" }, 401);
    }
  } else if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      c.set("user", decoded);
    } catch (error) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }
  }
  await next();
};
