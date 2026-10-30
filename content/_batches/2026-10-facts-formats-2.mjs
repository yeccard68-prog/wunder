// Content batch (30.10.2026): card formats for existing and new facts (myth quizzes with a refuting quote, a truth, counting figures).
//   node scripts/content/verify-evidence.mjs content/_batches/2026-10-facts-formats-2.mjs && node scripts/content/annotate-facts.mjs content/_batches/2026-10-facts-formats-2.mjs

export const annotations = {
  // myths: the popular belief is shown first – it is false
  "f-wikinger": { quiz: "myth", myth: "Wikinger trugen im Kampf Helme mit Hörnern.", mythEn: "Vikings wore horned helmets in battle." },
  "f-zungenkarte": { quiz: "myth", myth: "Jede Geschmacksrichtung wird nur in einer eigenen Zone der Zunge wahrgenommen.", mythEn: "Each basic taste is sensed only in its own zone of the tongue." },
  // truth: surprising, but true
  "f-hubble-fehler": { quiz: "truth" },
  // figures: the key number counts up
  "f-sputnik-92": { figure: { value: 92, suffix: " Tage" }, figureSuffixEn: " days" },
  "f-golden-record": { figure: { value: 55, suffix: " Sprachen" }, figureSuffixEn: " languages" },
  "f-terrakotta-arbeiter": { figure: { value: 700000, suffix: " Arbeiter" }, figureSuffixEn: " workers" },
};

export const evidence = {
  "f-wikinger": ["en|Horned_helmet|Viking warriors are often associated with horned helmets in popular culture, but this is merely a modern association starting in the 1800s"],
  "f-zungenkarte": ["en|Tongue_map|is a common misconception that different sections of the tongue are exclusively responsible for different basic tastes"],
};

export const facts = [];
