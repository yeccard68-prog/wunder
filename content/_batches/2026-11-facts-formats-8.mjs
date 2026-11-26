// Content batch (26.11.2026): new card formats for the facts of 2026-11-facts-10 – guess-first truths and counting
// figures (numbers repeat what is already in the checked fact texts). Check, then apply (after the facts batch):
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-facts-formats-8.mjs && node scripts/content/annotate-facts.mjs content/_batches/2026-11-facts-formats-8.mjs

export const annotations = {
  "f-kilimandscharo-eis": { figure: { value: 1.85, digits: 2, suffix: " km²" }, figureSuffixEn: " km²" },
  "f-beatles-tontraeger": { figure: { value: 600, suffix: " Millionen Tonträger" }, figureSuffixEn: " million records" },
  "f-gitarre-kithara": { quiz: "truth" },
};

export const evidence = {};

export const facts = [];
