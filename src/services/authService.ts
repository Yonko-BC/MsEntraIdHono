import jwt from "jsonwebtoken";
import { AccountInfo } from "@azure/msal-node";
import { config } from "../config";

export const generateToken = (account: AccountInfo): string => {
  return jwt.sign(
    {
      sub: account.homeAccountId,
      name: account.name,
      email: account.username,
      role: account.idTokenClaims?.role,
      tenantId: account.idTokenClaims?.tid,
    },
    config.sessionSecret,
    { expiresIn: "1h" }
  );
};

export const verifyToken = async (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.sessionSecret, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
};
