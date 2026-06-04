import { Page, Locator } from "playwright";

const TEAMS_URL = "https://teams.microsoft.com";
const DEFAULT_TIMEOUT_MS = 0;
const FRIDA_XPATH =
  "//div[contains(@class,'fui-TreeItemLayout__main')]//span[text()='Frida Assistant']";

const CHECKIN_VARIATIONS = ["check in", "Check in"];
const CHECKOUT_VARIATIONS = ["check out", "Check out"];

async function waitForElement(
  page: Page,
  xpath: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Locator> {
  const locator = page.locator(`xpath=${xpath}`);
  await locator.waitFor({ state: "visible", timeout: timeoutMs });
  return locator;
}

export async function sendMessage(page: Page, accion: string): Promise<void> {
  const isCheckIn = accion === "check in";
  const variations = isCheckIn ? CHECKIN_VARIATIONS : CHECKOUT_VARIATIONS;
  const mensaje = variations[Math.floor(Math.random() * variations.length)];

  console.log(`Starting ${accion}...`);
  console.log("Navigating to Microsoft Teams...");
  await page.goto(TEAMS_URL, { waitUntil: "domcontentloaded" });
  console.log("Teams loaded ✓");

  // 1. Wait and click Frida in the sidebar
  console.log("Waiting for Frida Assistant...");
  const frida = await waitForElement(page, FRIDA_XPATH);
  await frida.click();
  console.log("Clicked Frida ✓");

  // 2. Wait for Frida chat to open
  console.log("Waiting for chat to open...");
  await page
    .locator("//span[@data-tid='message-author-name' and text()='Frida Assistant']")
    .first()
    .waitFor({ state: "visible", timeout: DEFAULT_TIMEOUT_MS });
  console.log("Frida chat opened ✓");

  // 3. Type message
  console.log(`Typing "${mensaje}"...`);
  const input = page.locator("[data-tid='ckeditor']");
  await input.waitFor({ state: "visible", timeout: 30_000 });
  await input.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.keyboard.type(mensaje, { delay: 100 });
  console.log("Message typed ✓");

  // 4. Click send
  console.log("Sending message...");
  const sendBtn = await waitForElement(page, "//button[@name='send']", 30_000);
  await sendBtn.click();

  // Try to catch "sending" indicator — may be too fast
  try {
    await page
      .locator("[aria-label='Enviando...']")
      .last()
      .waitFor({ state: "visible", timeout: 5_000 });
    console.log("Sending indicator detected ✓");
  } catch {
    // Went too fast, that's fine
  }

  // Wait for sent confirmation
  console.log("Waiting for sent confirmation...");
  await page
    .locator("[aria-label='Enviado']")
    .last()
    .waitFor({ state: "visible", timeout: 30_000 });
  console.log("Message sent ✓");

  await page.waitForTimeout(60_000);
  console.log(`${accion} completed ✓`);
}
