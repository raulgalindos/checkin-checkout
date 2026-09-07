import { Page } from "playwright";
import { Action, pickMessage } from "./action";

const TEAMS_URL = "https://teams.microsoft.com";
// Teams can take a long time to render the sidebar; the CI job timeout is the real ceiling.
const NO_TIMEOUT_MS = 0;
const STEP_TIMEOUT_MS = 30_000;
const SENDING_INDICATOR_TIMEOUT_MS = 5_000;
// Keep the session open after sending so Frida's reply is registered before we leave.
const POST_SEND_WAIT_MS = 60_000;

const FRIDA_SIDEBAR_XPATH =
  "//div[contains(@class,'fui-TreeItemLayout__main')]//span[text()='Frida Assistant']";
const FRIDA_AUTHOR_XPATH =
  "//span[@data-tid='message-author-name' and text()='Frida Assistant']";

export async function sendCheckMessage(page: Page, action: Action): Promise<void> {
  const message = pickMessage(action);

  console.log(`Starting ${action}...`);
  console.log("Navigating to Microsoft Teams...");
  await page.goto(TEAMS_URL, { waitUntil: "domcontentloaded" });
  console.log("Teams loaded ✓");

  console.log("Waiting for Frida Assistant...");
  const frida = page.locator(`xpath=${FRIDA_SIDEBAR_XPATH}`);
  await frida.waitFor({ state: "visible", timeout: NO_TIMEOUT_MS });
  await frida.click();
  console.log("Clicked Frida ✓");

  console.log("Waiting for chat to open...");
  await page
    .locator(`xpath=${FRIDA_AUTHOR_XPATH}`)
    .first()
    .waitFor({ state: "visible", timeout: NO_TIMEOUT_MS });
  console.log("Frida chat opened ✓");

  console.log(`Typing "${message}"...`);
  const input = page.locator("[data-tid='ckeditor']");
  await input.waitFor({ state: "visible", timeout: STEP_TIMEOUT_MS });
  await input.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.keyboard.type(message, { delay: 100 });
  console.log("Message typed ✓");

  console.log("Sending message...");
  const sendButton = page.locator("xpath=//button[@name='send']");
  await sendButton.waitFor({ state: "visible", timeout: STEP_TIMEOUT_MS });
  await sendButton.click();

  // The "sending" state is often too brief to observe; it is not required
  try {
    await page
      .locator("[aria-label='Enviando...']")
      .last()
      .waitFor({ state: "visible", timeout: SENDING_INDICATOR_TIMEOUT_MS });
    console.log("Sending indicator detected ✓");
  } catch {
    // Went too fast, that's fine
  }

  console.log("Waiting for sent confirmation...");
  await page
    .locator("[aria-label='Enviado']")
    .last()
    .waitFor({ state: "visible", timeout: STEP_TIMEOUT_MS });
  console.log("Message sent ✓");

  await page.waitForTimeout(POST_SEND_WAIT_MS);
  console.log(`${action} completed ✓`);
}
