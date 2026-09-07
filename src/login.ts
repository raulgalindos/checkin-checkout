import { Page } from "playwright";
import { Config } from "./config";
import { generateTotp } from "./totp";

const LOGIN_URL = "https://login.microsoftonline.com";
const STEP_TIMEOUT_MS = 30_000;
const OPTIONAL_STEP_TIMEOUT_MS = 5_000;

/** Clicks the element if it shows up in time; optional prompts may not appear. */
async function clickIfVisible(page: Page, selector: string): Promise<boolean> {
  const locator = page.locator(selector);
  try {
    await locator.waitFor({ state: "visible", timeout: OPTIONAL_STEP_TIMEOUT_MS });
    await locator.click();
    return true;
  } catch {
    return false;
  }
}

async function fillAndSubmit(page: Page, selector: string, value: string): Promise<void> {
  const input = page.locator(selector);
  await input.waitFor({ state: "visible", timeout: STEP_TIMEOUT_MS });
  await input.fill(value);
  await page.locator("input[type='submit']").click();
}

export async function login(page: Page, config: Config): Promise<void> {
  console.log("Starting Microsoft login...");
  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });

  await fillAndSubmit(page, "input[type='email']", config.username);
  await fillAndSubmit(page, "input[type='password']", config.password);

  // Switch to TOTP when Microsoft Authenticator push is the primary method
  const switchedMethod = await clickIfVisible(page, "a#signInAnotherWay");
  if (switchedMethod) {
    await clickIfVisible(page, "div[data-value='PhoneAppOTP']");
  }

  const totp = generateTotp(config.otpSecret, config.username);
  await fillAndSubmit(page, "input#idTxtBx_SAOTCC_OTC", totp);

  // "Stay signed in?" prompt does not always appear
  await clickIfVisible(page, "#idSIButton9");

  console.log("Login successful ✓");
}
