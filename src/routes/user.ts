import { Hono } from "hono";
import { getMsalClient } from "../config";
import { users } from "../data/users";

interface UserEnv {
  Variables: {
    user: {
      id?: number;
      username?: string;
      email: string;
      role: string;
      tenantId?: string;
      authType: "azure" | "local";
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
  console.log({ user });
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (user.authType === "azure") {
    const msalClient = getMsalClient();

    try {
      const accounts = await msalClient.getTokenCache().getAllAccounts();
      const account = accounts.find((acc) => acc.username === user.email);
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
      return c.json({ ...profile, role: "admin", authType: "azure" });
    } catch (error) {
      console.error(error);
      return c.json({ error: "Failed to fetch user profile" }, 500);
    }
  } else {
    const localUser = users.find((u) => u.id === user.id);
    if (!localUser) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({
      id: localUser.id,
      name: localUser.name,
      email: localUser.email,
      role: localUser.role,
    });
  }
});

user.get("/users", async (c) => {
  const user = c.get("user");
  console.log("user ----->", user);
  if (user?.role !== "manager" && user?.role !== "hr") {
    return c.json({ error: "Unauthorized" }, 403);
  }

  return c.json(
    users.map(({ id, name, email, role, username }) => ({
      id,
      name,
      email,
      role,
      username,
    }))
  );
});

export const userRoutes = user;
