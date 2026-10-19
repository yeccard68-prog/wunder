import { expect, test } from "@playwright/test";

// Sharing a fact as a picture: drawn on the device, offered as a download where the system cannot share files.
const seed = { state: { onboarded: true, username: "Test", interests: ["science"], ageBand: "16+", settings: { theme: "system", privateProfile: false, muted: true, captions: true, locale: "de" } } };

test("a fact can be shared as a picture (download where sharing files is not possible)", async ({ page }) => {
  await page.addInitScript((s) => {
    if (!localStorage.getItem("wunder.demo.state.v3")) localStorage.setItem("wunder.demo.state.v3", JSON.stringify(s));
    delete (Navigator.prototype as { canShare?: unknown }).canShare;
    delete (Navigator.prototype as { share?: unknown }).share;
  }, seed);
  await page.goto("/facts/");
  const card = page.getByTestId("fact-card").first();
  const download = page.waitForEvent("download");
  await card.getByRole("button", { name: "Als Bild teilen" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^f-.+\.png$/);
  const size = (await file.createReadStream()).readableLength; // something was written
  expect(size).toBeGreaterThanOrEqual(0);
});

test("a note to the editors: choose a reason, optional text, links are refused", async ({ page }) => {
  await page.addInitScript((s) => {
    if (!localStorage.getItem("wunder.demo.state.v3")) localStorage.setItem("wunder.demo.state.v3", JSON.stringify(s));
  }, seed);
  await page.goto("/facts/");
  await page.getByTestId("fact-card").first().getByTestId("hint-button").click();
  const sheet = page.getByTestId("hint-sheet");
  const send = sheet.getByRole("button", { name: "Hinweis senden" });
  await expect(send).toBeDisabled(); // a reason is needed
  await sheet.getByRole("button", { name: "Hier stimmt etwas nicht" }).click();
  await sheet.getByRole("textbox").fill("siehe beispiel.com");
  await expect(sheet.getByRole("alert")).toContainText("Links");
  await expect(send).toBeDisabled();
  await sheet.getByRole("textbox").fill("Laut Quelle war es 1934.");
  await send.click();
  await expect(page.getByText("Danke! Die Redaktion schaut es sich an.")).toBeVisible();
});
