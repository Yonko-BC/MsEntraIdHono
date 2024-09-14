import { Hono } from "hono";
import { getMsalClient, config } from "../config";
import { generateToken } from "../services/authService";
import { setCookie } from "hono/cookie";

const auth = new Hono();

auth.get("/login", async (c) => {
  const msalClient = getMsalClient();
  const authCodeUrlParameters = {
    scopes: ["User.Read"],
    redirectUri: config.entraId.redirectUri,
  };

  const response = await msalClient.getAuthCodeUrl(authCodeUrlParameters);
  return c.redirect(response);
});

auth.get("/redirect", async (c) => {
  const msalClient = getMsalClient();
  const code = c.req.query("code");
  if (!code) {
    return c.text("Authorization code missing", 400);
  }
  const tokenRequest = {
    code,
    scopes: ["User.Read"],
    redirectUri: config.entraId.redirectUri,
  };

  try {
    const response = await msalClient.acquireTokenByCode(tokenRequest);
    const token = generateToken(response.account!);
    setCookie(c, "sessionToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    });
    return c.redirect(config.frontendUrl);
  } catch (error) {
    console.error(error);
    return c.text("Authentication failed", 401);
  }
});

auth.get("/logout", (c) => {
  setCookie(c, "sessionToken", "", { maxAge: 0 });
  return c.redirect("/");
});

export const authRoutes = auth;
