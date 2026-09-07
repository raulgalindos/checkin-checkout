import * as fs from "fs";

export interface Config {
  username: string;
  password: string;
  otpSecret: string;
  isCI: boolean;
}

const REQUIRED_VARS = ["M365_USERNAME", "M365_PASSWORD", "M365_OTP_SECRET"] as const;

/**
 * Loads and validates configuration from the environment.
 * Outside CI, reads `.env` from the working directory first.
 * Throws with the list of missing variables so failures are obvious up front.
 */
export function loadConfig(): Config {
  const isCI = Boolean(process.env.CI);

  if (!isCI) {
    if (!fs.existsSync(".env")) {
      throw new Error(".env file not found");
    }
    require("dotenv").config({ path: ".env" });
  }

  const missing = REQUIRED_VARS.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    username: process.env.M365_USERNAME!.trim(),
    password: process.env.M365_PASSWORD!,
    otpSecret: process.env.M365_OTP_SECRET!.trim(),
    isCI,
  };
}
