import dotenv from "dotenv";
import { ConfidentialClientApplication, Configuration } from "@azure/msal-node";

dotenv.config();

export interface AppConfig {
  port: number;
  frontendUrl: string;
  entraId: {
    clientId: string;
    tenantId: string;
    clientSecret: string;
    redirectUri: string;
    authority: string;
  };
  sessionSecret: string;
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 3000,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:8080",
  entraId: {
    clientId: process.env.ENTRA_CLIENT_ID!,
    tenantId: process.env.ENTRA_TENANT_ID!,
    clientSecret: process.env.ENTRA_CLIENT_SECRET!,
    redirectUri: process.env.ENTRA_REDIRECT_URI!,
    authority: `https://${process.env.TENANT_SUBDOMAIN}.ciamlogin.com/`,
  },
  sessionSecret: process.env.SESSION_SECRET!,
};

let msalClient: ConfidentialClientApplication;

export const configureApp = async () => {
  const msalConfig: Configuration = {
    auth: {
      clientId: config.entraId.clientId,
      authority: config.entraId.authority,
      clientSecret: config.entraId.clientSecret,
    },
  };

  msalClient = new ConfidentialClientApplication(msalConfig);
};

export const getMsalClient = () => msalClient;
