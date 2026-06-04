import { Page } from "playwright";
import { generateTOTP } from "./utils";

export async function login(page: Page): Promise<void> {
  console.log("Starting Microsoft login...");
  await page.goto("https://login.microsoftonline.com", { waitUntil: "domcontentloaded" });

  // Email
  const emailInput = page.locator("input[type='email']");
  await emailInput.waitFor({ state: "visible", timeout: 30_000 });
  await emailInput.fill(process.env.M365_USERNAME || "");
  await page.locator("input[type='submit']").click();

  // Password
  const passwordInput = page.locator("input[type='password']");
  await passwordInput.waitFor({ state: "visible", timeout: 30_000 });
  await passwordInput.fill(process.env.M365_PASSWORD || "");
  await page.locator("input[type='submit']").click();

  // Switch to TOTP if Microsoft Authenticator is primary
  try {
    const otherWayLink = page.locator("a#signInAnotherWay");
    await otherWayLink.waitFor({ state: "visible", timeout: 5_000 });
    await otherWayLink.click();
    const otpOption = page.locator("div[data-value='PhoneAppOTP']");
    await otpOption.waitFor({ state: "visible", timeout: 5_000 });
    await otpOption.click();
  } catch {
    // Already on TOTP step
  }

  // Enter TOTP code
  const otpInput = page.locator("input#idTxtBx_SAOTCC_OTC");
  await otpInput.waitFor({ state: "visible", timeout: 30_000 });
  await otpInput.fill(generateTOTP());

  const submitOtp = page.locator("input[type='submit']");
  await submitOtp.waitFor({ state: "visible", timeout: 10_000 });
  await submitOtp.click();

  // Stay signed in
  try {
    const staySignedIn = page.locator("#idSIButton9");
    await staySignedIn.waitFor({ state: "visible", timeout: 5_000 });
    await staySignedIn.click();
  } catch {
    // Prompt did not appear
  }

  console.log("Login successful ✓");
}
