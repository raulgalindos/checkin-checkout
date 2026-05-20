import { Page } from "playwright";
import * as XLSX from "xlsx";
import * as fs from "fs";
import { downloadFile } from "./utils";

const SHAREPOINT_BASE_URL =
  "https://onesofttek.sharepoint.com/sites/SKPmetap/qanstt/Shared%20Documents/Project%20Tracking";
const PTO_CALENDAR_URL = `${SHAREPOINT_BASE_URL}/PTOs/PTO%2023-24%20Softtek.xlsx?download=1`;

const PTO_VALUES = ["PTO", "PTO(PA)", "ML(PA)", "ML"];
const MONTH_NAMES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export async function isOnPTO(
  page: Page,
  downloader: typeof downloadFile = downloadFile,
): Promise<boolean> {
  const shortName = (process.env.PTO_CALENDAR_NAME || "").trim();
  if (!shortName) {
    console.log("PTO_CALENDAR_NAME not set — skipping PTO check");
    return false;
  }

  const today = new Date();
  const dayOfMonth = today.getDate();
  const currentTab = `${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;

  console.log(
    `Checking PTO for ${shortName} on ${today.toDateString()} (tab: ${currentTab})...`,
  );

  await page.goto("https://onesofttek.sharepoint.com", { waitUntil: "domcontentloaded" });

  // ─── PTO Calendar ─────────────────────────────────────────────────────────
  console.log("Downloading PTO Calendar...");
  await downloader(page, PTO_CALENDAR_URL, "pto-calendar.xlsx");

  const ptoWorkbook = XLSX.readFile("pto-calendar.xlsx");
  const tabName = ptoWorkbook.SheetNames.find((name) => name.includes(currentTab));
  fs.unlinkSync("pto-calendar.xlsx");

  if (!tabName) {
    console.log(`Tab "${currentTab}" not found in PTO Calendar — skipping PTO check`);
    return false;
  }

  const ptoSheet = ptoWorkbook.Sheets[tabName];
  const ptoData: any[][] = XLSX.utils.sheet_to_json(ptoSheet, { header: 1 });

  const headerRow = ptoData[7];

  const collabColIndex = headerRow.findIndex(
    (cell: any) =>
      String(cell || "")
        .trim()
        .toLowerCase() === "collab",
  );

  if (collabColIndex === -1) {
    console.log("Collab column not found — skipping PTO check");
    return false;
  }

  const dayColIndex = headerRow.findIndex((cell: any) => Number(cell) === dayOfMonth);

  if (dayColIndex === -1) {
    console.log(`Day ${dayOfMonth} not found in PTO Calendar — skipping PTO check`);
    return false;
  }

  const userPtoRow = ptoData
    .slice(8)
    .find((row: any[]) => String(row[collabColIndex] || "").trim() === shortName);

  if (!userPtoRow) {
    console.log(`${shortName} not found in PTO Calendar — no PTO`);
    return false;
  }

  const ptoValue = String(userPtoRow[dayColIndex] || "")
    .trim()
    .toUpperCase();
  const isPTO = PTO_VALUES.some((v) => ptoValue.includes(v.toUpperCase()));

  console.log(
    `PTO check for ${shortName} on day ${dayOfMonth}: "${ptoValue}" → ${isPTO}`,
  );

  return isPTO;
}
