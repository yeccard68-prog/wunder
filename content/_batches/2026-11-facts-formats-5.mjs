// Content batch (20.11.2026): new card formats for existing facts – truth quizzes and counting figures.
// Figures repeat a number already in the checked fact text. Check, then apply:
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-facts-formats-5.mjs && node scripts/content/annotate-facts.mjs content/_batches/2026-11-facts-formats-5.mjs

export const annotations = {
  // truths: surprising, but true
  "f-venus-tag": { quiz: "truth" },
  "f-saturn-dichte": { quiz: "truth" },
  "f-babyknochen": { quiz: "truth" },
  // figures: the key number counts up
  "f-iss": { figure: { value: 15, suffix: " Sonnenaufgänge" }, figureSuffixEn: " sunrises" },
  "f-gehirn-energie": { figure: { value: 20, suffix: " %" }, figureSuffixEn: "%" },
  "f-mond-entfernt": { figure: { value: 3.8, digits: 1, suffix: " cm pro Jahr" }, figureSuffixEn: " cm per year" },
};

export const evidence = {};

export const facts = [];
