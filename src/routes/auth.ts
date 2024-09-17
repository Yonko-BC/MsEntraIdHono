import { Hono } from "hono";
import { getMsalClient, config } from "../config";
import {
  generateToken,
  generateJwtToken,
  verifyPassword,
  refreshAccessToken,
} from "../services/authService";
import { setCookie, getCookie } from "hono/cookie";
import { users } from "../data/users";

const auth = new Hono();

auth.get("/login/azure", async (c) => {
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

auth.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  const user = users.find((u) => u.email === email);

  if (user && (await verifyPassword(password, user.password))) {
    const { accessToken, refreshToken } = generateJwtToken(user);
    setCookie(c, "refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    });
    return c.json({
      // refreshToken,
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } else {
    return c.json({ error: "Invalid credentials" }, 401);
  }
});

auth.post("/token", async (c) => {
  const refreshToken = getCookie(c, "refreshToken");
  if (!refreshToken) {
    return c.json({ error: "Refresh Token Required" }, 400);
  }

  try {
    const { accessToken, user } = await refreshAccessToken(refreshToken);
    return c.json({ accessToken, user });
  } catch (error) {
    return c.json({ error: "Invalid Refresh Token" }, 401);
  }
});

auth.post("/logout", (c) => {
  setCookie(c, "sessionToken", "", { maxAge: 0 });
  setCookie(c, "refreshToken", "", { maxAge: 0 });
  return c.json({ message: "Logged out successfully" });
});

// Add a new route for silent token refresh
// auth.post("/refresh-entra-token", async (c) => {
//   const msalClient = getMsalClient();
//   const sessionToken = getCookie(c, "sessionToken");

//   if (!sessionToken) {
//     return c.json({ error: "No session token found" }, 401);
//   }

//   try {
//     const account = await msalClient
//       .getTokenCache()
//       .getAccountByHomeId(sessionToken);
//     if (!account) {
//       throw new Error("No account found");
//     }

//     const silentRequest = {
//       account: account,
//       scopes: ["User.Read"],
//     };

//     const response = await msalClient.acquireTokenSilent(silentRequest);
//     const newToken = generateToken(response.account!);

//     setCookie(c, "sessionToken", newToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "Lax",
//       maxAge: 120,
//     });

//     return c.json({ message: "Token refreshed successfully" });
//   } catch (error) {
//     console.error(error);
//     return c.json({ error: "Failed to refresh token" }, 401);
//   }
// });

export const authRoutes = auth;
