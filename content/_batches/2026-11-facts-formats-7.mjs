// Content batch (25.11.2026): new card formats for the facts of content/_batches/2026-11-facts-9.mjs (apply after that batch):
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-facts-formats-7.mjs && node scripts/content/annotate-facts.mjs content/_batches/2026-11-facts-formats-7.mjs

export const annotations = {
  "f-venedig-karneval": { quiz: "myth", myth: "Napoleon hat den Karneval von Venedig verboten, sodass bis 1979 nicht mehr gefeiert wurde.", mythEn: "Napoleon banned the Venice Carnival, so nothing was celebrated there until 1979." },
  "f-spardose-tempel": { quiz: "truth" },
  "f-metronom-beethoven": { figure: { value: 25, suffix: " Werke" }, figureSuffixEn: " works" },
};

export const evidence = {
  "f-venedig-karneval": ["de|Karneval_in_Venedig|Napoléon habe den venezianischen Karneval verboten, weshalb bis 1979 in Venedig nicht mehr gefeiert worden sei, geht hingegen zu weit"],
};

export const facts = [];
