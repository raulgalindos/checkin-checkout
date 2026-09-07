import { loadConfig } from "./src/config";
import { parseAction } from "./src/action";
import { openBrowser, closeBrowser } from "./src/browser";
import { login } from "./src/login";
import { sendCheckMessage } from "./src/teams";

const MAX_START_DELAY_MS = 5 * 60 * 1000;
const ERROR_SCREENSHOT_PATH = "debug-error.png";

/** Random start delay so scheduled runs do not land at the exact same second. */
async function waitRandomDelay(): Promise<void> {
  const delayMs = Math.floor(Math.random() * MAX_START_DELAY_MS);
  const minutes = Math.floor(delayMs / 60_000);
  const seconds = Math.floor((delayMs % 60_000) / 1000);
  console.log(`Waiting ${minutes} minutes and ${seconds} seconds before starting...`);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function main(): Promise<void> {
  const config = loadConfig();
  const action = parseAction(process.argv[2]);

  // Only delay in CI — run immediately when testing locally
  if (config.isCI) {
    await waitRandomDelay();
  }

  const session = await openBrowser(config.isCI);

  try {
    await login(session.page, config);
    await sendCheckMessage(session.page, action);
  } catch (err) {
    await session.page.screenshot({ path: ERROR_SCREENSHOT_PATH }).catch(() => {});
    throw err;
  } finally {
    await closeBrowser(session);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Automation error:", err);
    process.exit(1);
  });
