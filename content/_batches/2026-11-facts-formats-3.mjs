// Content batch (17.11.2026): new card formats – truth quizzes, one myth with a refuting quote, counting figures.
// Figures repeat a number already in the checked fact text. Check, then apply (after the facts batch 2026-11-facts-5):
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-facts-formats-3.mjs && node scripts/content/annotate-facts.mjs content/_batches/2026-11-facts-formats-3.mjs

export const annotations = {
  // myth: the popular belief is shown first – it is false
  "f-kamel-hoecker": { quiz: "myth", myth: "Im Höcker eines Kamels speichert das Tier Wasser.", mythEn: "A camel stores water in its hump." },
  // truth: surprising, but true
  "f-cage-433": { quiz: "truth" },
  "f-beethoven-9-taub": { quiz: "truth" },
  // figures: the key number counts up
  "f-atacama": { figure: { value: 0.5, digits: 1, suffix: " mm Niederschlag" }, figureSuffixEn: " mm of precipitation" },
  "f-great-barrier-reef": { figure: { value: 2900, suffix: " Riffe" }, figureSuffixEn: " reefs" },
  "f-bitcoin-pizza": { figure: { value: 10000, suffix: " Bitcoin" }, figureSuffixEn: " bitcoins" },
};

export const evidence = {
  "f-kamel-hoecker": ["de|Kamele|entgegen der landläufigen Meinung nicht als Wasser-, sondern als Fettspeicher fungieren"],
};

export const facts = [];
