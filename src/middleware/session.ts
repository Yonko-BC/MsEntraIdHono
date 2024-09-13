import { Context, Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { config } from "../config";
import { verifyToken } from "../services/authService";

export const sessionMiddleware = async (c: Context, next: Next) => {
  const sessionToken = getCookie(c, "sessionToken");
  if (sessionToken) {
    try {
      const user = await verifyToken(sessionToken);
      c.set("user", user);
    } catch (error) {
      setCookie(c, "sessionToken", "", { maxAge: 0 });
    }
  }
  await next();
};
