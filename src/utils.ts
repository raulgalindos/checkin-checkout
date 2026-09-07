import { chromium, BrowserContext, Page } from "playwright";
import * as OTPAuth from "otpauth";

export async function buildBrowser(): Promise<{ context: BrowserContext; page: Page }> {
  const browser = await chromium.launch({
    headless: !!process.env.CI,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--lang=es-MX",
      "--start-maximized",
    ],
  });

  const context = await browser.newContext({
    locale: "es-MX",
    timezoneId: "America/Monterrey",
    viewport: process.env.CI ? { width: 1280, height: 900 } : null,
  });

  const page = await context.newPage();
  return { context, page };
}

export function generateTOTP(): string {
  const totp = new OTPAuth.TOTP({
    issuer: "Microsoft",
    label: process.env.M365_USERNAME,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: process.env.M365_OTP_SECRET,
  });
  return totp.generate();
}
