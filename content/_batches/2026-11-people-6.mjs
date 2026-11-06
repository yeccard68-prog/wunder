// Content batch (06.11.2026): four more "Persönlichkeiten" clips for the new categories (video/src/people.ts,
// Lebenslinie.tsx), same rules as 2026-10-people-1.mjs: long-dead people known for their work, no portraits, every
// claim quoted below. Linné → Tiere, Edwin Hubble → Weltraum, Frédéric Chopin → Musik, Claude Monet → Kunst.
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-people-6.mjs
//   node scripts/content/apply-batch.mjs content/_batches/2026-11-people-6.mjs && npm --prefix video run render -- <ids>
import fs from "node:fs";

export const LOCALE = "en";
export const TODAY = "2026-11-06";
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
  own("v-person-linne", "animals", 10, ["Persönlichkeiten", "Tiere"], [wiki("Carl_von_Linné")],
    ["Carl von Linné: Ordnung für Tiere und Pflanzen", "Er schuf die Grundlagen, nach denen Pflanzen und Tiere bis heute wissenschaftlich benannt werden.",
      "Carl von Linné wurde am 23. Mai 1707 in Råshult in Schweden geboren. Mit der binären Nomenklatur schuf er die Grundlagen der modernen botanischen und zoologischen Taxonomie. Ende 1741 wurde er Professor an der Universität Uppsala. Seine Werke Species Plantarum (1753) und Systema Naturæ in der zehnten Auflage von 1758 begründeten die bis heute verwendete wissenschaftliche Benennung in Botanik und Zoologie. Er starb 1778 in Uppsala.",
      ["Geboren 1707 in Schweden.", "1741 wurde er Professor in Uppsala.", "1758 begründete er die Namen der Zoologie."]],
    ["Carl Linnaeus: order for animals and plants", "He laid the foundations on which plants and animals are still given their scientific names today.",
      "Carl Linnaeus was born in Råshult, Sweden, on 23 May 1707. With binomial nomenclature he laid the foundations of modern botanical and zoological taxonomy. At the end of 1741 he became a professor at Uppsala University. His works Species Plantarum (1753) and the tenth edition of Systema Naturae from 1758 established the scientific names still used in botany and zoology today. He died in Uppsala in 1778.",
      ["Born in Sweden in 1707.", "In 1741 he became a professor in Uppsala.", "In 1758 he founded the names of zoology."]],
    ["Was führte Carl von Linné ein, nach dem Tiere und Pflanzen bis heute benannt werden?", ["Die zweiteilige wissenschaftliche Benennung (binäre Nomenklatur)", "Das Mikroskop", "Die Evolutionstheorie", "Den ersten Zoo"], 0,
      "Mit der binären Nomenklatur schuf Linné die Grundlagen der modernen botanischen und zoologischen Taxonomie – darum tragen Arten zweiteilige Namen wie Homo sapiens.",
      "What did Carl Linnaeus introduce that animals and plants are still named by today?", ["Two-part scientific names (binomial nomenclature)", "The microscope", "The theory of evolution", "The first zoo"],
      "With binomial nomenclature Linnaeus laid the foundations of modern botanical and zoological taxonomy – that is why species have two-part names such as Homo sapiens."]),

  own("v-person-hubble", "space", 10, ["Persönlichkeiten", "Astronomie"], [wiki("Edwin_Hubble"), wiki("Andromedagalaxie")],
    ["Edwin Hubble: Astronom und Namensgeber eines Teleskops", "Er klassifizierte die Spiralgalaxien und befasste sich mit der Expansion des Weltalls.",
      "Edwin Hubble wurde am 20. November 1889 in Marshfield, Missouri, geboren. 1910 schloss er sein Studium der Physik und Astronomie in Chicago ab. Am Mount-Wilson-Observatorium wies er 1923 nach, dass der Andromedanebel M31 weit außerhalb unserer Galaxis liegt. Er klassifizierte die Spiralgalaxien und befasste sich mit der Expansion des Weltalls. 1940 erhielt er die Goldmedaille der Royal Astronomical Society; das Hubble-Weltraumteleskop trägt seinen Namen.",
      ["Geboren 1889 in Missouri.", "1923: Andromeda liegt weit außerhalb unserer Galaxis.", "Heute trägt ein Weltraumteleskop seinen Namen."]],
    ["Edwin Hubble: astronomer and namesake of a telescope", "He classified the spiral galaxies and studied the expansion of the universe.",
      "Edwin Hubble was born in Marshfield, Missouri, on 20 November 1889. In 1910 he finished his studies of physics and astronomy in Chicago. At Mount Wilson Observatory in 1923 he showed that the Andromeda Nebula M31 lies far outside our galaxy. He classified the spiral galaxies and studied the expansion of the universe. In 1940 he received the Gold Medal of the Royal Astronomical Society; the Hubble Space Telescope bears his name.",
      ["Born in Missouri in 1889.", "1923: Andromeda lies far outside our galaxy.", "Today a space telescope bears his name."]],
    ["Was wies Edwin Hubble 1923 über den Andromedanebel M31 nach?", ["Dass er weit außerhalb unserer Galaxis liegt", "Dass er ein Komet ist", "Dass er zum Sonnensystem gehört", "Dass er bald erlischt"], 0,
      "Am Mount-Wilson-Observatorium konnte Hubble 1923 nachweisen, dass M31 weit außerhalb unserer Galaxis liegt. Heute weiß man: Die Andromedagalaxie ist die nächste Spiralgalaxie, rund 2,5 Millionen Lichtjahre entfernt.",
      "What did Edwin Hubble prove about the Andromeda Nebula M31 in 1923?", ["That it lies far outside our galaxy", "That it is a comet", "That it belongs to the solar system", "That it will soon go out"],
      "At Mount Wilson Observatory in 1923, Hubble proved that M31 lies far outside our galaxy. Today we know the Andromeda Galaxy is the nearest spiral galaxy, about 2.5 million light years away."]),

  own("v-person-chopin", "music", 10, ["Persönlichkeiten", "Musik"], [wiki("Frédéric_Chopin")],
    ["Frédéric Chopin: Komponist und Pianist", "Der polnische Komponist und Pianist galt schon als Kind als Wunderkind.",
      "Frédéric Chopin wurde am 22. Februar oder 1. März 1810 in Żelazowa Wola geboren. Seine musikalische Ausbildung erhielt er in Warschau, wo er auch seine ersten Stücke komponierte. Am 2. November 1830 verließ er Polen; ab Oktober 1831 bis zu seinem Tod 1849 lebte er überwiegend in Frankreich. Sein Klavierkonzert e-Moll erschien 1833 als 1. Klavierkonzert op. 11. Er starb im Alter von 39 Jahren in Paris.",
      ["Geboren 1810 in Polen.", "1830 verließ er Polen.", "Ab 1831 lebte er in Frankreich."]],
    ["Frédéric Chopin: composer and pianist", "The Polish composer and pianist was regarded as a child prodigy.",
      "Frédéric Chopin was born in Żelazowa Wola on 22 February or 1 March 1810. He received his musical training in Warsaw, where he also composed his first pieces. On 2 November 1830 he left Poland; from October 1831 until his death in 1849 he lived mostly in France. His Piano Concerto in E minor appeared in 1833 as Piano Concerto No. 1, Op. 11. He died in Paris at the age of 39.",
      ["Born in Poland in 1810.", "In 1830 he left Poland.", "From 1831 he lived in France."]],
    ["In welchem Land lebte Chopin ab Oktober 1831 bis zu seinem Tod überwiegend?", ["Frankreich", "Polen", "Österreich", "Italien"], 0,
      "Am 2. November 1830 verließ Chopin Polen. Ab Oktober 1831 bis zu seinem Tod 1849 lebte er überwiegend in Frankreich.",
      "In which country did Chopin mostly live from October 1831 until his death?", ["France", "Poland", "Austria", "Italy"],
      "On 2 November 1830 Chopin left Poland. From October 1831 until his death in 1849 he lived mostly in France."]),

  own("v-person-monet", "art", 10, ["Persönlichkeiten", "Kunst"], [wiki("Claude_Monet")],
    ["Claude Monet: Maler des Impressionismus", "Ein Bild von ihm gab einer ganzen Kunstrichtung ihren Namen.",
      "Claude Monet wurde am 14. November 1840 in Paris geboren. 1872 malte er in Le Havre das Bild „Impression – Sonnenaufgang“. Es war 1874 in der ersten Gruppenausstellung im Atelier des Fotografen Nadar zu sehen und gab der gesamten Bewegung ihren Namen. In Giverny legte er seinen berühmten Garten an, der zum Motiv vieler seiner Bilder wurde; 1890 kaufte er dort sein Haus. Er starb 1926 in Giverny.",
      ["Geboren 1840 in Paris.", "1872 malte er „Impression – Sonnenaufgang“.", "In Giverny malte er seinen Garten."]],
    ["Claude Monet: painter of Impressionism", "One of his pictures gave a whole art movement its name.",
      "Claude Monet was born in Paris on 14 November 1840. In 1872 he painted \"Impression, Sunrise\" in Le Havre. It was shown in 1874 at the first group exhibition in the studio of the photographer Nadar and gave the whole movement its name. In Giverny he created his famous garden, which became the subject of many of his pictures; in 1890 he bought his house there. He died in Giverny in 1926.",
      ["Born in Paris in 1840.", "In 1872 he painted \"Impression, Sunrise\".", "In Giverny he painted his garden."]],
    ["Was malte Claude Monet in Giverny besonders oft?", ["Seerosen", "Schiffe im Sturm", "Porträts von Königen", "Berglandschaften der Alpen"], 0,
      "In Giverny legte Monet seinen berühmten Garten an, der zum Motiv vieler seiner Bilder wurde. Dort arbeitete er vor allem an den Seerosenbildern.",
      "What did Claude Monet paint especially often in Giverny?", ["Water lilies", "Ships in a storm", "Portraits of kings", "Alpine mountain landscapes"],
      "In Giverny Monet created his famous garden, which became the subject of many of his pictures. There he worked above all on his water lily paintings."]),
];

export const evidence = {
  "v-person-linne": [
    "de|Carl_von_Linné|* 23. Mai 1707 in Råshult bei Älmhult; † 10. Januar 1778 in Uppsala) war ein schwedischer Naturforscher, der mit der binären Nomenklatur die Grundlagen der modernen botanischen und zoologischen Taxonomie schuf",
    "de|Carl_von_Linné|Ende 1741 wurde Linné Professor an der Universität Uppsala",
    "de|Carl_von_Linné|Seine beiden Werke Species Plantarum (1753) und Systema Naturæ (in der zehnten Auflage von 1758) begründeten die bis heute verwendete wissenschaftliche Nomenklatur in der Botanik und der Zoologie.",
    "de|Carl_von_Linné|Homo sapiens wurde dadurch nach den zoologischen Nomenklaturregeln gültig als diejenige Tierart definiert, zu der Carl von Linné gehörte.",
  ],
  "v-person-hubble": [
    "de|Edwin_Hubble|Edwin Powell Hubble (* 20. November 1889 in Marshfield, Missouri; † 28. September 1953 in San Marino, Kalifornien) war ein US-amerikanischer Astronom.",
    "de|Edwin_Hubble|Er klassifizierte die Spiralgalaxien, befasste sich mit der Expansion des Weltalls",
    "de|Edwin_Hubble|Er ist Namensgeber des Hubble-Weltraumteleskops.",
    "de|Edwin_Hubble|Hubble studierte Physik und Astronomie in Chicago und beendete dies 1910 mit dem Abschluss als Bachelor of Science.",
    "de|Edwin_Hubble|Am Mount-Wilson-Observatorium konnte er 1923 nachweisen, dass M31 weit außerhalb unserer Galaxis liegt.",
    "de|Edwin_Hubble|1940 wurde er mit der Goldmedaille der Royal Astronomical Society ausgezeichnet.",
    "de|Andromedagalaxie|ist mit rund 2,5 Millionen Lichtjahren Entfernung die am nächsten zur Milchstraße gelegene Spiralgalaxie",
  ],
  "v-person-chopin": [
    "de|Frédéric_Chopin|* 22. Februar oder 1. März 1810 in Żelazowa Wola, Herzogtum Warschau; † 17. Oktober 1849 in Paris",
    "de|Frédéric_Chopin|war ein polnischer Komponist, Pianist und Klavierpädagoge",
    "de|Frédéric_Chopin|Der als Wunderkind geltende Chopin erhielt seine musikalische Ausbildung in Warschau, wo er auch seine ersten Stücke komponierte.",
    "de|Frédéric_Chopin|das er am 2. November 1830 aus beruflichen und politischen Gründen verließ",
    "de|Frédéric_Chopin|Ab Oktober 1831 bis zu seinem Tod (1849) lebte Chopin überwiegend in Frankreich.",
    "de|Frédéric_Chopin|das Klavierkonzert e-Moll (1833 als 1. Klavierkonzert op. 11 veröffentlicht)",
    "de|Frédéric_Chopin|Er starb im Alter von 39 Jahren",
  ],
  "v-person-monet": [
    "de|Claude_Monet|14. November 1840 in Paris als Oscar-Claude Monet; † 5. Dezember 1926 in Giverny",
    "de|Claude_Monet|dessen mittlere Schaffensperiode der Stilrichtung des Impressionismus zugeordnet wird",
    "de|Claude_Monet|Sein Bild Impression, Sonnenaufgang aus dieser Schaffensphase, eine Hafenansicht von Le Havre, gab der gesamten Bewegung ihren Namen.",
    "de|Claude_Monet|Impression – Sonnenaufgang, das Monet 1872 in Le Havre zusammen mit anderen Bildern gemalt hatte",
    "de|Claude_Monet|Die erste Gruppenausstellung fand 1874 im Atelier des Fotografen Nadar am Boulevard des Capucines in Paris statt.",
    "de|Claude_Monet|begann er in Giverny seinen berühmten Garten anzulegen, der als Motiv vieler seiner Bilder diente",
    "de|Claude_Monet|1890 erwarb Monet das Haus in Giverny, welches er schon seit sieben Jahren bewohnt hatte",
    "de|Claude_Monet|In Giverny arbeitete er währenddessen vor allem an den Seerosenbildern",
  ],
};

// keep the Remotion clip list in step with this batch
const clips = JSON.parse(fs.readFileSync(new URL("../../video/src/clips.json", import.meta.url), "utf8"));
for (const v of videos) if (!clips.some((c) => c.id === v.id)) throw new Error(`${v.id} is missing in video/src/clips.json`);
