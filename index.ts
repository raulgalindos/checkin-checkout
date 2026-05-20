import * as fs from "fs";
import { buildBrowser } from "./src/utils";
import { login } from "./src/login";
import { isOnPTO } from "./src/pto";
import { sendMessage } from "./src/teams";

// ─── Config ──────────────────────────────────────────────────────────────────
if (!process.env.CI) {
  if (!fs.existsSync(".env")) {
    console.error("[ERROR] .env file not found");
    process.exit(1);
  }
  require("dotenv").config({ path: ".env" });
}

const accion = process.argv[2] === "checkout" ? "check out" : "check in";

// ─── Main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  // Only wait in CI — skip delay when running locally
  if (process.env.CI) {
    const randomDelay = Math.floor(Math.random() * 12 * 60 * 1000);
    console.log(
      `Waiting ${Math.floor(randomDelay / 60000)} minutes and ${Math.floor((randomDelay % 60000) / 1000)} seconds before starting...`,
    );
    await new Promise((resolve) => setTimeout(resolve, randomDelay));
  }

  const { context, page } = await buildBrowser();

  try {
    await login(page);

    const onPTO = await isOnPTO(page);
    if (onPTO) {
      console.log("User is on PTO today — skipping check in/out ✓");
      return;
    }

    await sendMessage(page, accion);
  } catch (err) {
    console.error("Automation error:", err);
    throw err;
  } finally {
    await context.close();
    process.exit(0);
  }
}

main();
