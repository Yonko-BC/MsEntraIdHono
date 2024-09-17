import jwt from "jsonwebtoken";
import { AccountInfo } from "@azure/msal-node";
import { config } from "../config";
import bcrypt from "bcrypt";
import { User } from "../types";

interface RefreshTokenResult {
  accessToken: string;
  user: {
    id: number;
    name: string;
    role: string;
    email: string;
  };
}

export const generateToken = (account: AccountInfo): string => {
  const claims = {
    sub: account.homeAccountId,
    name: account.name,
    email: account.username,
    oid: account.localAccountId, // Object ID (unique identifier for the user in Azure AD)
    tid: account.tenantId, // Tenant ID
    preferred_username: account.username,
    roles: account.idTokenClaims?.roles || [],
    role: "admin",
    authType: "azure",
  };

  return jwt.sign(claims, config.sessionSecret);
};

export const verifyToken = async (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.sessionSecret, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
};

export const generateJwtToken = (user: User) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, authType: "local" },
    config.jwtSecret,
    { expiresIn: 20 }
  );

  const refreshToken = jwt.sign(
    { id: user.id, role: user.role, authType: "local" },
    config.jwtRefreshSecret,
    { expiresIn: 60 }
  );

  return { accessToken, refreshToken };
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
) => {
  return bcrypt.compare(password, hashedPassword);
};

export async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshTokenResult> {
  return new Promise((resolve, reject) => {
    jwt.verify(refreshToken, config.jwtRefreshSecret, (err, decoded) => {
      if (err) return reject(err);
      const { id, role, name, email } = decoded as {
        id: number;
        role: string;
        name: string;
        email: string;
      };
      const accessToken = jwt.sign(
        { id, role, authType: "local" },
        config.jwtSecret,
        { expiresIn: 20 }
      );
      resolve({ accessToken, user: { id, role, name, email } });
    });
  });
}
