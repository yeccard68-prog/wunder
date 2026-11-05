// Content batch (04.11.2026): card formats for existing and new facts (myth quizzes with a refuting quote, a truth, counting figures).
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-facts-formats-1.mjs && node scripts/content/annotate-facts.mjs content/_batches/2026-11-facts-formats-1.mjs

export const annotations = {
  // myths: the popular belief is shown first – it is false
  "f-mauer-mond": { quiz: "myth", myth: "Die Chinesische Mauer kann man vom Mond aus mit bloßem Auge sehen.", mythEn: "You can see the Great Wall of China from the Moon with the naked eye." },
  "f-erde-kugel-mittelalter": { quiz: "myth", myth: "Im Mittelalter glaubten die Gelehrten, die Erde sei eine flache Scheibe.", mythEn: "In the Middle Ages, scholars believed that the Earth was a flat disc." },
  // truth: surprising, but true
  "f-kupferblut": { quiz: "truth" },
  // figures: the key number counts up
  "f-cherokee-schrift": { figure: { value: 86, suffix: " Zeichen" }, figureSuffixEn: " characters" },
  "f-totes-meer": { figure: { value: 440, suffix: " Meter" }, figureSuffixEn: " metres" },
  "f-lungenblaeschen": { figure: { value: 300, suffix: " Millionen Bläschen" }, figureSuffixEn: " million alveoli" },
};

export const evidence = {
  "f-mauer-mond": ["de|Chinesische_Mauer|Das Bauwerk vom Mond aus mit bloßem Auge zu sehen wäre unmöglich"],
  "f-erde-kugel-mittelalter": ["de|Flache_Erde|wurde als historischer Irrtum entlarvt"],
};

export const facts = [];
