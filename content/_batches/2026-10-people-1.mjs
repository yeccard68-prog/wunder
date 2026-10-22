// Content batch (22.10.2026): the first "Persönlichkeiten" clips – a life on an animated timeline (video/src/people.ts,
// Lebenslinie.tsx). Purely typographic, no portraits. Every claim in the picture, the texts and the quiz is quoted
// below from the linked article and checked word for word:
//   node scripts/content/verify-evidence.mjs content/_batches/2026-10-people-1.mjs
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-people-1.mjs && npm --prefix video run render -- v-person-curie …
import fs from "node:fs";

export const LOCALE = "en";
export const TODAY = "2026-10-22";
export const verification = "ai_checked";

const W = "https://de.wikipedia.org/wiki/";
const wiki = (title) => ({ name: "Wikipedia: " + title.replaceAll("_", " "), url: W + title });
const own = (id, category_id, min_age, tags, sources, de, en, quiz) => ({
  id, category_id, min_age, tags, title: de[0], hook: de[1], description: de[2], captions: de[3],
  en: { title: en[0], hook: en[1], description: en[2], captions: en[3], file: `/clips/${id}.en.mp4`, poster: `/clips/${id}.en.jpg` },
  quiz, creator_name: "Wunder Redaktion", license: "Eigene Produktion", source: sources[0], sources, format: "animated_fact",
  production: { provider: "remotion", composition: id, start: 0, end: 10 },
});

export const videos = [
  own("v-person-curie", "science", 10, ["Persönlichkeiten", "Nobelpreis"], [wiki("Marie_Curie")],
    ["Marie Curie: zwei Nobelpreise in zwei Fächern", "Marie Curie erhielt Nobelpreise für Physik und für Chemie – Nobelpreise in zwei verschiedenen Fachgebieten bekam sonst nur Linus Pauling.",
      "Marie Curie wurde am 7. November 1867 in Warschau geboren. Weil Frauen dort nicht studieren durften, zog sie nach Paris und begann Ende 1891 ein Studium an der Sorbonne. Gemeinsam mit ihrem Ehemann Pierre Curie entdeckte sie die chemischen Elemente Polonium und Radium. 1903 erhielt sie einen anteiligen Nobelpreis für Physik, 1911 den Nobelpreis für Chemie. Sie ist die einzige Frau, der bisher mehrfach ein Nobelpreis verliehen wurde, und neben Linus Pauling die einzige Person mit Nobelpreisen in zwei verschiedenen Fachgebieten. Sie war auch die erste Frau, die an der Sorbonne lehrte. Marie Curie starb am 4. Juli 1934.",
      ["Geboren 1867 in Warschau – studiert hat sie in Paris.", "Mit Pierre Curie entdeckte sie Polonium und Radium.", "Nobelpreise 1903 für Physik und 1911 für Chemie."]],
    ["Marie Curie: two Nobel Prizes in two subjects", "Marie Curie won Nobel Prizes in physics and in chemistry – only Linus Pauling has also won them in two different fields.",
      "Marie Curie was born in Warsaw on 7 November 1867. Because women were not allowed to study there, she moved to Paris and began studying at the Sorbonne at the end of 1891. Together with her husband Pierre Curie she discovered the chemical elements polonium and radium. In 1903 she received a share of the Nobel Prize in Physics, in 1911 the Nobel Prize in Chemistry. She is the only woman to have been awarded a Nobel Prize more than once so far, and apart from Linus Pauling the only person with Nobel Prizes in two different fields. She was also the first woman to teach at the Sorbonne. Marie Curie died on 4 July 1934.",
      ["Born in Warsaw in 1867 – she studied in Paris.", "With Pierre Curie she discovered polonium and radium.", "Nobel Prizes in 1903 for physics and in 1911 for chemistry."]],
    ["In welchen beiden Fächern erhielt Marie Curie einen Nobelpreis?", ["Physik und Chemie", "Chemie und Medizin", "Physik und Medizin", "Chemie und Literatur"], 0,
      "1903 erhielt sie einen anteiligen Nobelpreis für Physik, 1911 den Nobelpreis für Chemie.",
      "In which two subjects did Marie Curie win a Nobel Prize?", ["Physics and chemistry", "Chemistry and medicine", "Physics and medicine", "Chemistry and literature"],
      "In 1903 she received a share of the Nobel Prize in Physics, in 1911 the Nobel Prize in Chemistry."]),

  own("v-person-gutenberg", "history", 10, ["Persönlichkeiten", "Erfindungen"], [wiki("Johannes_Gutenberg")],
    ["Gutenberg: Bücher in Serie statt von Hand", "Mit beweglichen Metalllettern veränderte Johannes Gutenberg ab 1450 die Herstellung von Büchern – bis dahin wurden sie abgeschrieben.",
      "Johannes Gutenberg wurde um 1400 in Mainz geboren; sein genaues Geburtsdatum lässt sich nicht feststellen. Er gilt als Erfinder des modernen Buchdrucks mit beweglichen Metalllettern und der Druckerpresse. Ab 1450 revolutionierten die beweglichen Lettern die herkömmliche Buchproduktion, das Abschreiben von Hand. Zwischen 1452 und 1454 entstand sein Hauptwerk, die Gutenberg-Bibel. Zu seinen Neuerungen gehört auch eine besonders praktikable Legierung aus Zinn, Blei und Antimon. 1997 wählte das US-Magazin Time Gutenbergs Buchdruck zur bedeutendsten Erfindung des zweiten Jahrtausends. Gutenberg starb vor dem 26. Februar 1468.",
      ["Geboren um 1400 in Mainz.", "Ab 1450: Druck mit beweglichen Lettern aus Metall statt Abschreiben.", "1452 bis 1454 entstand die berühmte Gutenberg-Bibel."]],
    ["Gutenberg: books in series instead of by hand", "With movable metal type, Johannes Gutenberg changed how books were made from 1450 on – until then they were copied by hand.",
      "Johannes Gutenberg was born in Mainz around 1400; his exact date of birth cannot be determined. He is regarded as the inventor of modern printing with movable metal type and of the printing press. From 1450, movable type revolutionised the traditional way of making books, copying them by hand. His main work, the Gutenberg Bible, was made between 1452 and 1454. His innovations also include a particularly practical alloy of tin, lead and antimony. In 1997 the US magazine Time chose Gutenberg's printing as the most important invention of the second millennium. Gutenberg died before 26 February 1468.",
      ["Born in Mainz around 1400.", "From 1450: printing with movable metal type instead of copying.", "The famous Gutenberg Bible was made from 1452 to 1454."]],
    ["Woraus bestanden Gutenbergs bewegliche Lettern?", ["Aus Metall", "Aus Holz", "Aus Ton", "Aus Stein"], 0,
      "Gutenberg druckte mit beweglichen Metalllettern – aus einer Legierung von Zinn, Blei und Antimon.",
      "What was Gutenberg's movable type made of?", ["Metal", "Wood", "Clay", "Stone"],
      "Gutenberg printed with movable metal type – made of an alloy of tin, lead and antimony."]),

  own("v-person-lovelace", "technology", 10, ["Persönlichkeiten", "Computer"], [wiki("Ada_Lovelace")],
    ["Ada Lovelace: ein Programm, bevor es Computer gab", "1843 veröffentlichte Ada Lovelace einen Plan, mit dem eine Rechenmaschine Bernoulli-Zahlen berechnen sollte – gebaut wurde die Maschine nie.",
      "Ada Lovelace wurde am 10. Dezember 1815 in London geboren; sie war die Tochter des Dichters Lord Byron. Nach ihrem ersten Treffen mit Charles Babbage im Jahr 1833 war sie schnell fasziniert von seiner Arbeit an der „analytischen Maschine“, die nie fertiggestellt wurde. 1843 übersetzte sie einen Artikel über diese Analytical Engine und fügte eigene Notizen hinzu, zweimal so lang wie der ursprüngliche Text. Darin legte sie einen Plan zur Berechnung der Bernoulli-Zahlen vor, der als das erste veröffentlichte formale Computerprogramm gelten kann. Kritiker wenden ein, dass konkrete Programmbeispiele schon mehrere Jahre zuvor in Babbages Aufzeichnungen standen. Ada Lovelace starb am 27. November 1852 mit 36 Jahren. Die Programmiersprache Ada ist nach ihr benannt.",
      ["Geboren 1815 in London, Tochter des Dichters Lord Byron.", "1833 lernte sie Charles Babbage und seine Rechenmaschine kennen.", "1843 veröffentlichte sie einen Plan zur Berechnung von Bernoulli-Zahlen."]],
    ["Ada Lovelace: a program before computers existed", "In 1843 Ada Lovelace published a plan for a calculating engine to compute Bernoulli numbers – the engine itself was never built.",
      "Ada Lovelace was born in London on 10 December 1815; she was the daughter of the poet Lord Byron. After first meeting Charles Babbage in 1833 she was soon fascinated by his work on the \"Analytical Engine\", which was never completed. In 1843 she translated an article about this engine and added her own notes, twice as long as the original text. In them she set out a plan for calculating the Bernoulli numbers that can count as the first published formal computer program. Critics object that concrete program examples had already appeared in Babbage's notes several years earlier. Ada Lovelace died on 27 November 1852, aged 36. The programming language Ada is named after her.",
      ["Born in London in 1815, daughter of the poet Lord Byron.", "In 1833 she met Charles Babbage and his calculating engine.", "In 1843 she published a plan for calculating Bernoulli numbers."]],
    ["Was sollte das Programm berechnen, das Ada Lovelace 1843 veröffentlichte?", ["Bernoulli-Zahlen", "Planetenbahnen", "Zinsen", "Primzahlen"], 0,
      "In ihren Notizen zur Analytical Engine legte sie einen Plan zur Berechnung der Bernoulli-Zahlen vor.",
      "What was the program Ada Lovelace published in 1843 meant to calculate?", ["Bernoulli numbers", "Planetary orbits", "Interest", "Prime numbers"],
      "In her notes on the Analytical Engine she set out a plan for calculating the Bernoulli numbers."]),
];

// word for word from the linked articles (checked by verify-evidence.mjs); every year shown in the clip must appear here
export const evidence = {
  "v-person-curie": [
    "de|Marie_Curie|7. November 1867 in Warschau",
    "de|Marie_Curie|† 4. Juli 1934 bei Passy",
    "de|Marie_Curie|Da Frauen dort nicht zum Studium zugelassen wurden, zog sie nach Paris und begann Ende 1891 ein Studium an der Sorbonne",
    "de|Marie_Curie|entdeckte sie gemeinsam mit ihrem Ehemann Pierre Curie die chemischen Elemente Polonium und Radium",
    "de|Marie_Curie|1903 ein anteiliger Nobelpreis für Physik und 1911 der Nobelpreis für Chemie zugesprochen wurde",
    "de|Marie_Curie|die einzige Frau unter den fünf Personen, denen bisher mehrfach ein Nobelpreis verliehen wurde, und neben Linus Pauling die einzige Person, die Nobelpreise auf zwei unterschiedlichen Fachgebieten erhielt",
    "de|Marie_Curie|Sie war die erste Frau und die erste Professorin, die an der Sorbonne lehrte",
  ],
  "v-person-gutenberg": [
    "de|Johannes_Gutenberg|um 1400 in Mainz",
    "de|Johannes_Gutenberg|vor dem 26. Februar 1468 ebenda",
    "de|Johannes_Gutenberg|Da sich sein Geburtsdatum nicht genau feststellen lässt",
    "de|Johannes_Gutenberg|gilt als Erfinder des modernen Buchdrucks mit beweglichen Metalllettern (Mobilletterndruck) und der Druckerpresse",
    "de|Johannes_Gutenberg|Die Verwendung von beweglichen Lettern ab 1450 revolutionierte die herkömmliche Methode der Buchproduktion (das Abschreiben von Hand)",
    "de|Johannes_Gutenberg|die Gutenberg-Bibel, zwischen 1452 und 1454 entstanden",
    "de|Johannes_Gutenberg|einer besonders praktikablen Legierung aus Zinn, Blei und Antimon",
    "de|Johannes_Gutenberg|1997 wurde Gutenbergs Buchdruck vom US-Magazin Time zur bedeutendsten Erfindung des zweiten Jahrtausends gewählt",
  ],
  "v-person-lovelace": [
    "de|Ada_Lovelace|10. Dezember 1815 in London",
    "de|Ada_Lovelace|† 27. November 1852 ebenda",
    "de|Ada_Lovelace|Sie war die Tochter des Dichters Lord Byron",
    "de|Ada_Lovelace|Nach ihrem ersten Treffen mit Babbage im Jahre 1833 war sie schnell fasziniert von dessen Arbeit",
    "de|Ada_Lovelace|Diese wurde zwar niemals fertiggestellt",
    "de|Ada_Lovelace|Das manifestierte sich 1843 in selbst hinzugefügten Notizen zu ihrer Übersetzung eines Artikels",
    "de|Ada_Lovelace|die zweimal so lang waren wie der ursprüngliche Text",
    "de|Ada_Lovelace|welcher als das erste veröffentlichte formale Computerprogramm gelten kann",
    "de|Ada_Lovelace|konkrete Programmbeispiele hätten sich auch mehrere Jahre zuvor in Babbages Aufzeichnungen befunden",
    "de|Ada_Lovelace|Die Programmiersprache Ada, die Lovelace Medal und der Ada Lovelace Award wurden nach ihr benannt",
  ],
};

// keep the Remotion clip list in step with this batch
const clips = JSON.parse(fs.readFileSync(new URL("../../video/src/clips.json", import.meta.url), "utf8"));
for (const v of videos) if (!clips.some((c) => c.id === v.id)) throw new Error(`${v.id} is missing in video/src/clips.json`);
