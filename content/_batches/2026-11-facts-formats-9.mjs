// Content batch (27.11.2026): card formats for existing and new facts – myths with a refuting quote, truth quizzes and
// counting figures. Check, then apply (after the facts batch):
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-facts-formats-9.mjs && node scripts/content/annotate-facts.mjs content/_batches/2026-11-facts-formats-9.mjs

export const annotations = {
  // myths: the popular belief is shown first – it is false
  "f-bleistift-blei": { quiz: "myth", myth: "In einem Bleistift steckt Blei.", mythEn: "A pencil contains lead." },
  "f-olympische-ringe": { quiz: "myth", myth: "Jeder olympische Ring steht für einen bestimmten Kontinent.", mythEn: "Each Olympic ring stands for a particular continent." },
  // truths: surprising, but true – the fact itself is shown first
  "f-nintendo-karten": { quiz: "truth" },
  "f-nokia-papier": { quiz: "truth" },
  // figures: the key number counts up
  "f-gutenberg-bibel": { figure: { value: 180, suffix: " Stück" }, figureSuffixEn: " copies" },
  "f-cage-halberstadt": { figure: { value: 639, suffix: " Jahre" }, figureSuffixEn: " years" },
};

export const evidence = {
  "f-bleistift-blei": ["de|Bleistift|der Name Bleistift blieb erhalten, auch wenn kein Blei mehr enthalten ist"],
  "f-olympische-ringe": ["de|Olympische_Ringe|Dieser Hinweis wurde entfernt, da es keine Anhaltspunkte dafür gäbe, dass Coubertin dies so beabsichtigt hätte"],
};

export const facts = [];
