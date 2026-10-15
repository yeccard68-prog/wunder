import { expect, test, type Page } from "@playwright/test";

// Demo mode: the practice duel against the computer, on the device. (Duels between people need the
// live backend; their rules are tested in supabase/tests/duels.sql.)
const seed = { state: { onboarded: true, username: "Test", interests: ["science", "history"], ageBand: "16+", settings: { theme: "system", privateProfile: false, muted: true, captions: true, locale: "de" } } };
const signIn = (page: Page) =>
  page.addInitScript((s) => {
    if (!localStorage.getItem("wunder.demo.state.v3")) localStorage.setItem("wunder.demo.state.v3", JSON.stringify(s));
  }, seed);

async function playRound(page: Page, opts: { timeout?: number } = {}) {
  const card = page.getByTestId("duel-question");
  for (let i = 0; i < 3; i++) {
    await expect(card).toContainText(`Frage ${i + 1} von 3`);
    if (opts.timeout === i) {
      await page.clock.fastForward(21_000); // let the 20 seconds run out
      await expect(card).toContainText("Zeit abgelaufen");
    } else await card.locator("button").first().click();
    await card.getByRole("button", { name: i === 2 ? "Runde beenden" : "Nächste Frage" }).click();
  }
}

test("a practice duel: choose topics, answer against the clock, the computer plays, and a winner is found", async ({ page }) => {
  await page.clock.install();
  await signIn(page);
  await page.goto("/explore/");
  await page.getByRole("link", { name: /Duell/ }).click();
  await expect(page.getByRole("heading", { name: "Duell", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Übungsduell starten" }).click();

  // round 1: three topics to choose from, then three questions
  const headline = page.getByTestId("duel-headline");
  await expect(headline).toHaveText("Wähle das Thema für Runde 1");
  const topics = page.getByRole("region", { name: "Thema wählen" }).getByRole("button");
  await expect(topics).toHaveCount(3);
  await topics.first().click();
  await playRound(page, { timeout: 1 });

  // the computer answers round 1 and picks round 2; its round-2 answers stay hidden until you have played it
  await expect(headline).toHaveText("Runde 2: du bist dran");
  const board = page.getByTestId("duel-board");
  await expect(board.locator("li").nth(1)).toContainText("?");
  await page.getByRole("button", { name: "Runde 2 spielen" }).click();
  await playRound(page);

  await expect(headline).toHaveText("Wähle das Thema für Runde 3");
  await topics.first().click();
  await playRound(page);

  await expect(headline).toHaveText(/^(Gewonnen!|Verloren|Unentschieden)$/);
  await expect(page.getByTestId("duel-score")).toHaveText(/^\d : \d$/);
  await expect(board.locator("li span.bg-raised")).toHaveCount(0); // all 18 answers are shown
  await expect(page.getByRole("button", { name: "Revanche" })).toBeVisible();

  // the list keeps the finished duel and the record
  await page.getByRole("button", { name: "Alle Duelle" }).click();
  await expect(page.getByRole("heading", { name: "Beendet" })).toBeVisible();
  await expect(page.getByTestId("duel-record")).toContainText(/\d Siege · \d Unentschieden · \d Niederlagen/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Beendet" })).toBeVisible();
});

test("a practice duel can be given up – it counts as a loss", async ({ page }) => {
  await signIn(page);
  await page.goto("/duel/");
  await page.getByRole("button", { name: "Übungsduell starten" }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await page.getByRole("button", { name: "Aufgeben" }).click();
  await page.getByRole("button", { name: /Wirklich aufgeben/ }).click();
  await expect(page.getByTestId("duel-headline")).toHaveText("Verloren");
  await expect(page.getByText("Du hast aufgegeben oder zu lange nicht gespielt.")).toBeVisible();
});
