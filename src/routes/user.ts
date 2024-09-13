import { Hono } from "hono";
import { getMsalClient } from "../config";

interface UserEnv {
  Variables: {
    user: {
      username: string;
      email: string;
      role: string;
      tenantId: string;
    } | null;
  };
}

const user = new Hono<UserEnv>();

user.use(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

user.get("/profile", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const msalClient = getMsalClient();

  try {
    const accounts = await msalClient.getTokenCache().getAllAccounts();

    const account = accounts.find((acc) => acc.username === user.email);
    console.log({ account });
    if (!account) {
      throw new Error("No account found for the user");
    }

    const result = await msalClient.acquireTokenSilent({
      account: account,
      scopes: ["User.Read"],
    });

    const response = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${result.accessToken}`,
      },
    });

    const profile = await response.json();
    return c.json(profile);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch user profile" }, 500);
  }
});

export const userRoutes = user;
