// Content batch (21.11.2026): guess-first "truth" cards for two new facts of 2026-11-facts-8. Nothing new is claimed.
// Apply AFTER the facts batch has been merged:
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-facts-formats-6.mjs && node scripts/content/annotate-facts.mjs content/_batches/2026-11-facts-formats-6.mjs

export const annotations = {
  // truths: surprising, but true – the fact itself is shown first
  "f-antikythera": { quiz: "truth" },
  "f-fountain": { quiz: "truth" },
};

export const evidence = {};

export const facts = [];
