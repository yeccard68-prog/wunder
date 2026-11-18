// Content batch (18.11.2026): new card formats for existing facts – "Mythos oder Wahrheit?" (guess first, then the
// fact) and counting figures. A myth needs a quote that refutes the belief; figures repeat a number already in the
// checked fact text. Check, then apply:
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-facts-formats-4.mjs && node scripts/content/annotate-facts.mjs content/_batches/2026-11-facts-formats-4.mjs

export const annotations = {
  // myth: the popular belief is shown first – it is false
  "f-kuli": { quiz: "myth", myth: "„Kuli“ ist die Kurzform von „Kugelschreiber“.", mythEn: "The German word “Kuli” is short for “Kugelschreiber” (ballpoint pen)." },
  // truths: surprising, but true – the fact itself is shown first
  "f-marianengraben": { quiz: "truth" },
  "f-wikinger-amerika": { quiz: "truth" },
  // figures: the key number counts up
  "f-methusalem": { figure: { value: 4850, suffix: " Jahre" }, figureSuffixEn: " years" },
  "f-geburtstag": { figure: { value: 23, suffix: " Menschen" }, figureSuffixEn: " people" },
  "f-marathon-1921": { figure: { value: 42.195, digits: 3, suffix: " km" }, figureSuffixEn: " km" },
};

export const evidence = {
  "f-kuli": ["de|Kugelschreiber|hat „Kuli“ also nichts mit „Kugel“ zu tun"],
};

export const facts = [];
