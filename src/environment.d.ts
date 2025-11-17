import { type User } from "stytch";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      STYTCH_PROJECT_ID: string;
      STYTCH_SECRET: string;
      SESSION_SECRET: string;
      NODE_ENV: "development" | "production";
    }
  }

  interface DocumentEventMap {
    "alfred-prompt-submitted": CustomEvent;
  }
}

declare module "express-session" {
  interface SessionData {
    StytchSessionToken?: string;
    user?: User;
  }
}

export {};
