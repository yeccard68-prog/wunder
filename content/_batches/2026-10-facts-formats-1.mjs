// Content batch (21.10.2026): new card formats for existing facts – "Mythos oder Wahrheit?" (guess first, then the
// fact) and a counting figure. A myth needs a quote that refutes the belief; figures repeat a number already in the
// checked fact text. Check, then apply:
//   node scripts/content/verify-evidence.mjs content/_batches/2026-10-facts-formats-1.mjs && node scripts/content/annotate-facts.mjs content/_batches/2026-10-facts-formats-1.mjs

export const annotations = {
  // myths: the popular belief is shown first – it is false
  "f-mauer-mond": { quiz: "myth", myth: "Die Chinesische Mauer kann man vom Mond aus mit bloßem Auge sehen.", mythEn: "You can see the Great Wall of China from the Moon with the naked eye." },
  "f-erde-kugel-mittelalter": { quiz: "myth", myth: "Im Mittelalter glaubte man, die Erde sei eine Scheibe.", mythEn: "In the Middle Ages people believed the Earth was flat." },
  // truths: surprising, but true – the fact itself is shown first
  "f-banane-beere": { quiz: "truth" },
  "f-seepferdchen": { quiz: "truth" },
  "f-golf-mond": { quiz: "truth" },
  "f-oxford": { quiz: "truth" },
  "f-bug-motte": { quiz: "truth" },
  "f-wombat": { quiz: "truth" },
  // figures: the key number counts up
  "f-zitteraal": { figure: { value: 860, suffix: " Volt" }, figureSuffixEn: " volts" },
  "f-inflation-1923": { figure: { value: 4.2, digits: 1, suffix: " Billionen Mark" }, figureSuffixEn: " trillion marks" },
  "f-erdrotation": { figure: { value: 1670, suffix: " km/h" }, figureSuffixEn: " km/h" },
  "f-lichtjahr": { figure: { value: 9.46, digits: 2, suffix: " Billionen km" }, figureSuffixEn: " trillion km" },
  "f-blitz-heiss": { figure: { value: 30000, suffix: " °C" }, figureSuffixEn: " °C" },
  "f-kuerzester-krieg": { quiz: "truth", figure: { value: 38, suffix: " Minuten" }, figureSuffixEn: " minutes" },
  "f-schnecken-zaehne": { figure: { value: 800000, suffix: " Zähne" }, figureSuffixEn: " teeth" },
  "f-sonne-masse": { figure: { value: 99.86, digits: 2, suffix: " %" }, figureSuffixEn: "%" },
  "f-hawaii-alphabet": { figure: { value: 13, suffix: " Zeichen" }, figureSuffixEn: " characters" },
  "f-eis-ausdehnung": { figure: { value: 8.92, digits: 2, suffix: " %" }, figureSuffixEn: "%" },
};

export const evidence = {
  "f-mauer-mond": ["de|Chinesische_Mauer|Das Bauwerk vom Mond aus mit dem Auge zu sehen wäre unmöglich"],
  "f-erde-kugel-mittelalter": ["de|Flache_Erde|Die im 19. Jahrhundert aufgekommene Legende, die mittelalterliche Christenheit habe an eine Erdscheibe geglaubt, wurde als historischer Irrtum entlarvt"],
};

export const facts = [];
