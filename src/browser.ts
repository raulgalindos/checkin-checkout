import { chromium, Browser, BrowserContext, Page } from "playwright";

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

export async function openBrowser(isCI: boolean): Promise<BrowserSession> {
  const browser = await chromium.launch({
    headless: isCI,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--lang=es-MX", "--start-maximized"],
  });

  const context = await browser.newContext({
    locale: "es-MX",
    timezoneId: "America/Monterrey",
    viewport: isCI ? { width: 1280, height: 900 } : null,
  });

  const page = await context.newPage();
  return { browser, context, page };
}

export async function closeBrowser({ browser, context }: BrowserSession): Promise<void> {
  await context.close();
  await browser.close();
}
