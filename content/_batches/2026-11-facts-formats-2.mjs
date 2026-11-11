// Content batch (11.11.2026): new card formats – a myth with a refuting quote, truth quizzes and counting figures for
// facts from 2026-11-facts-4 (apply after that batch) and one existing fact. Check, then apply:
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-facts-formats-2.mjs && node scripts/content/annotate-facts.mjs content/_batches/2026-11-facts-formats-2.mjs

export const annotations = {
  // myth: the popular belief is shown first – it is false
  "f-napoleon": { quiz: "myth", myth: "Napoleon war ungewöhnlich klein.", mythEn: "Napoleon was unusually short." },
  // truths: surprising, but true – the fact itself is shown first
  "f-baikalrobbe": { quiz: "truth" },
  "f-everest-waechst": { quiz: "truth" },
  "f-taschenrechner-1967": { quiz: "truth" },
  // figures: the key number counts up
  "f-baikalsee": { figure: { value: 1642, suffix: " Meter" }, figureSuffixEn: " metres" },
  "f-vatikan-klein": { figure: { value: 0.44, digits: 2, suffix: " km²" }, figureSuffixEn: " km²" },
};

export const evidence = {
  "f-napoleon": ["de|Napoleon_Bonaparte|hätte Napoleon mit gut 1,68 m eine für Männer seiner Zeit durchschnittliche Körpergröße erreicht"],
};

export const facts = [];
