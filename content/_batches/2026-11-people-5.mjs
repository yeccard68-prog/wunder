// Content batch (05.11.2026): four "Persönlichkeiten" clips for the new categories (video/src/people.ts, Lebenslinie.tsx),
// same rules as 2026-10-people-1.mjs: long-dead people known for their work, no portraits, every claim quoted below.
// Merian → Tiere, Caroline Herschel → Weltraum, Clara Schumann → Musik, Albrecht Dürer → Kunst.
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-people-5.mjs
//   node scripts/content/apply-batch.mjs content/_batches/2026-11-people-5.mjs && npm --prefix video run render -- <ids>
import fs from "node:fs";

export const LOCALE = "en";
export const TODAY = "2026-11-05";
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
  own("v-person-merian", "animals", 10, ["Persönlichkeiten", "Tiere"], [wiki("Maria_Sibylla_Merian")],
    ["Maria Sibylla Merian: Forscherin und Künstlerin", "Wegen ihrer genauen Beobachtungen und Bilder gilt sie als wichtige Wegbereiterin der modernen Insektenkunde.",
      "Maria Sibylla Merian wurde am 2. April 1647 in Frankfurt am Main geboren. Schon früh begann sie, Insekten zu beobachten und zu züchten. 1679 veröffentlichte sie in Nürnberg die ersten beiden Bände ihres Lebenswerks „Der Raupen wunderbare Verwandelung und sonderbare Blumennahrung“. Von 1699 bis 1701 bereiste sie mit ihrer jüngeren Tochter die niederländische Kolonie Surinam. 1705 erschien ihr Hauptwerk „Metamorphosis insectorum Surinamensium“. Später zeigte der 500-DM-Schein ihr Porträt.",
      ["Geboren 1647 in Frankfurt am Main.", "1679: ihr erstes Raupenbuch.", "1699 Reise nach Surinam, 1705 ihr Hauptwerk."]],
    ["Maria Sibylla Merian: naturalist and artist", "Because of her precise observations and pictures, she is regarded as an important pioneer of modern entomology.",
      "Maria Sibylla Merian was born in Frankfurt am Main on 2 April 1647. Early on she began to observe and breed insects. In 1679, in Nuremberg, she published the first two volumes of her life's work on the wondrous transformation of caterpillars. From 1699 to 1701 she travelled the Dutch colony of Suriname with her younger daughter. In 1705 her main work, \"Metamorphosis insectorum Surinamensium\", appeared. Later the German 500-mark note showed her portrait.",
      ["Born in Frankfurt am Main in 1647.", "1679: her first caterpillar book.", "1699 journey to Suriname, 1705 her main work."]],
    ["Was beobachtete und malte Maria Sibylla Merian besonders genau?", ["Wie Raupen zu Schmetterlingen werden", "Die Bahnen der Planeten", "Ausbrüche von Vulkanen", "Die Züge der Vögel"], 0,
      "Merian beobachtete und züchtete Insekten und hielt die Entwicklungsstadien von Schmetterlingen und Faltern genau fest. Dafür entwickelte sie einen neuen Bildtyp, das „Metamorphosenbild“.",
      "What did Maria Sibylla Merian observe and paint especially precisely?", ["How caterpillars become butterflies", "The orbits of the planets", "Volcanic eruptions", "The migrations of birds"],
      "Merian observed and bred insects and recorded the stages of development of butterflies and moths in detail. For this she developed a new type of picture, the \"metamorphosis picture\"."]),

  own("v-person-herschel", "space", 10, ["Persönlichkeiten", "Astronomie"], [wiki("Caroline_Herschel")],
    ["Caroline Herschel: Astronomin und Kometenjägerin", "Ihre wichtigsten Beiträge zur Astronomie waren die Entdeckung mehrerer Kometen und ein Katalog hunderter Sternhaufen und Nebel.",
      "Caroline Herschel wurde am 16. März 1750 in Hannover geboren. 1772 folgte sie ihrem zwölf Jahre älteren Bruder Wilhelm nach England in den Badeort Bath. Zuerst unterstützte sie ihn bei seinen Forschungen, dann suchte sie mit einem kleinen Newton-Teleskop selbst nach Kometen: Zwischen 1786 und 1797 entdeckte sie acht. 1828 erhielt sie die Goldmedaille der Royal Astronomical Society – sie war die erste Frau, der Anerkennungen dieser Art zuteilwurden.",
      ["Geboren 1750 in Hannover.", "1772 zog sie zu ihrem Bruder nach England.", "1786 ihr erster Komet, 1828 die Goldmedaille."]],
    ["Caroline Herschel: astronomer and comet hunter", "Her most important contributions to astronomy were the discovery of several comets and a catalogue of hundreds of star clusters and nebulae.",
      "Caroline Herschel was born in Hanover on 16 March 1750. In 1772 she followed her brother William, twelve years older, to the spa town of Bath in England. At first she supported him in his research, then she searched for comets herself with a small Newtonian telescope: between 1786 and 1797 she discovered eight. In 1828 she received the Gold Medal of the Royal Astronomical Society – she was the first woman to receive honours of this kind.",
      ["Born in Hanover in 1750.", "In 1772 she moved to her brother in England.", "1786 her first comet, 1828 the gold medal."]],
    ["Wie viele Kometen entdeckte Caroline Herschel zwischen 1786 und 1797?", ["Acht", "Einen", "Drei", "Zwanzig"], 0,
      "Mit einem kleinen Newton-Teleskop suchte sie nach Kometen und entdeckte zwischen 1786 und 1797 acht – bei fünf davon war sie ohne jeden Zweifel die Erste.",
      "How many comets did Caroline Herschel discover between 1786 and 1797?", ["Eight", "One", "Three", "Twenty"],
      "With a small Newtonian telescope she searched for comets and discovered eight between 1786 and 1797 – for five of them she was without any doubt the first."]),

  own("v-person-schumann", "music", 10, ["Persönlichkeiten", "Musik"], [wiki("Clara_Schumann")],
    ["Clara Schumann: Pianistin und Komponistin", "Sie begann als Wunderkind am Klavier und legte einen Grundstein für das Konzertrepertoire.",
      "Clara Wieck wurde am 13. September 1819 in Leipzig geboren. Am 20. Oktober 1828 trat sie zum ersten Mal öffentlich im Leipziger Gewandhaus auf. Von 1840 bis zu seinem Tod 1856 war sie die Ehefrau des Komponisten Robert Schumann. Später spielte sie vor allem Werke von Robert Schumann, Chopin, Mendelssohn Bartholdy, Beethoven, Bach, Schubert und Brahms – und legte damit einen Grundstein für das Konzertrepertoire des späten 19. und des 20. Jahrhunderts. Seit den 1960er Jahren wird sie auch als Komponistin wiederentdeckt.",
      ["Geboren 1819 in Leipzig.", "1828: erster Auftritt im Gewandhaus.", "1840 heiratete sie Robert Schumann."]],
    ["Clara Schumann: pianist and composer", "She began as a child prodigy at the piano and laid a foundation for the concert repertoire.",
      "Clara Wieck was born in Leipzig on 13 September 1819. On 20 October 1828 she performed in public for the first time, at the Leipzig Gewandhaus. From 1840 until his death in 1856 she was the wife of the composer Robert Schumann. Later she mainly played works by Robert Schumann, Chopin, Mendelssohn Bartholdy, Beethoven, Bach, Schubert and Brahms – laying a foundation for the concert repertoire of the late 19th and the 20th century. Since the 1960s she has also been rediscovered as a composer.",
      ["Born in Leipzig in 1819.", "1828: first concert at the Gewandhaus.", "In 1840 she married Robert Schumann."]],
    ["Auf welchem Geldschein war Clara Schumann abgebildet?", ["Auf dem 100-DM-Schein", "Auf dem 10-Euro-Schein", "Auf dem 5-DM-Schein", "Auf dem 50-Franken-Schein"], 0,
      "Ihr Porträt war auf dem 100-DM-Schein von 1990 zu sehen. Es beruht auf einer Lithografie aus dem Jahr 1838.",
      "Which banknote showed Clara Schumann?", ["The 100-mark note", "The 10-euro note", "The 5-mark note", "The 50-franc note"],
      "Her portrait was on the German 100-mark note of 1990. It is based on a lithograph from 1838."]),

  own("v-person-duerer", "art", 10, ["Persönlichkeiten", "Kunst"], [wiki("Albrecht_Dürer"), wiki("Feldhase_(Dürer)"), wiki("Dürers_Rhinocerus")],
    ["Albrecht Dürer: Maler der Renaissance", "Seine Landschaftsaquarelle und seine Selbstporträts gehören zu den frühesten ihrer Art.",
      "Albrecht Dürer wurde am 21. Mai 1471 in Nürnberg geboren. Von 1490 bis 1494 ging er auf Wanderschaft an den Oberrhein. 1500 malte er sein „Selbstbildnis im Pelzrock“, 1502 entstand das Aquarell „Feldhase“, die wohl bekannteste seiner Naturstudien. 1515 schuf er den Holzschnitt „Rhinocerus“ – ein Panzernashorn, das er selbst nie gesehen hatte. Mit seinen Gemälden, Zeichnungen, Kupferstichen und Holzschnitten zählt er zu den herausragenden Vertretern der Renaissance.",
      ["Geboren 1471 in Nürnberg.", "1500 Selbstbildnis, 1502 der Feldhase.", "1515: der Holzschnitt „Rhinocerus“."]],
    ["Albrecht Dürer: a painter of the Renaissance", "His landscape watercolours and his self-portraits are among the earliest of their kind.",
      "Albrecht Dürer was born in Nuremberg on 21 May 1471. From 1490 to 1494 he travelled as a journeyman to the Upper Rhine. In 1500 he painted his \"Self-Portrait in a Fur Coat\", and in 1502 came the watercolour \"Young Hare\", probably the best known of his nature studies. In 1515 he made the woodcut \"Rhinoceros\" – an Indian rhinoceros he had never seen himself. With his paintings, drawings, engravings and woodcuts he is one of the outstanding artists of the Renaissance.",
      ["Born in Nuremberg in 1471.", "1500 self-portrait, 1502 the Young Hare.", "1515: the woodcut \"Rhinoceros\"."]],
    ["Wie entstand Dürers berühmtes Nashorn von 1515?", ["Ohne dass er das Tier je gesehen hatte", "Im Nürnberger Tiergarten", "Auf einer Reise nach Indien", "In einem Stall in Rom"], 0,
      "Dürer hatte das Panzernashorn, das 1515 nach Lissabon gekommen war, selbst nie gesehen. Seine Vorlage war die Beschreibung eines Augenzeugen, vermutlich mit einer Skizze.",
      "How did Dürer make his famous rhinoceros of 1515?", ["Without ever having seen the animal", "At the Nuremberg zoo", "On a journey to India", "In a stable in Rome"],
      "Dürer had never seen the Indian rhinoceros, which had arrived in Lisbon in 1515. His model was an eyewitness's description, probably with a sketch."]),
];

export const evidence = {
  "v-person-merian": [
    "de|Maria_Sibylla_Merian|Maria Sibylla Merian (* 2. April 1647 in Frankfurt am Main; † 13. Januar 1717 in Amsterdam) war eine Naturforscherin und Künstlerin.",
    "de|Maria_Sibylla_Merian|Wegen ihrer genauen Beobachtungen und Darstellungen gilt sie als wichtige Wegbereiterin der modernen Insektenkunde.",
    "de|Maria_Sibylla_Merian|Schon früh begann sie, Insekten zu beobachten und zu züchten.",
    "de|Maria_Sibylla_Merian|publizierte Merian 1679 nach der Veröffentlichung eines noch konventionellen Blumenbuchs in drei Teilen ab 1675 die ersten beiden Bände ihres Lebenswerks, Der Raupen wunderbare Verwandelung und sonderbare Blumennahrung",
    "de|Maria_Sibylla_Merian|Von 1699 bis 1701 bereiste Merian gemeinsam mit ihrer jüngeren Tochter die niederländische Kolonie Surinam.",
    "de|Maria_Sibylla_Merian|1705 erschien in ledernem, goldverziertem Einband das Hauptwerk der Maria Sibylla Merian: Metamorphosis insectorum Surinamensium.",
    "de|Maria_Sibylla_Merian|der 500-DM-Schein erhielt Merians Porträt",
    "de|Maria_Sibylla_Merian|Sie machte zu den verschiedenen Entwicklungsstadien der Schmetterlinge und Falter detaillierte Aufzeichnungen und entwickelte einen neuen Bildtyp, das „Metamorphosenbild“",
  ],
  "v-person-herschel": [
    "de|Caroline_Herschel|(* 16. März 1750 in Hannover; † 9. Januar 1848 ebenda) war eine deutsche Astronomin",
    "de|Caroline_Herschel|Ihre wichtigsten Beiträge zur Astronomie waren die Entdeckung mehrerer Kometen, die Berechnung genauer astronomischer Reduktionen und der Zonenkatalog hunderter Sternhaufen und Nebel.",
    "de|Caroline_Herschel|1772 folgte sie als 22-Jährige ihrem zwölf Jahre älteren Bruder Friedrich Wilhelm Herschel nach England, der dort seit 1766 als Organist, Musiklehrer und Konzertleiter im vornehmen Badeort Bath tätig war.",
    "de|Caroline_Herschel|Zu Beginn ihrer wissenschaftlichen Karriere unterstützte sie ihren Bruder Wilhelm Herschel bei dessen Forschungen",
    "de|Caroline_Herschel|Sie widmete sich mit einem kleinen Newton-Teleskop der Kometensuche.",
    "de|Caroline_Herschel|zwischen 1786 und 1797 acht Kometen, fünf davon mit unzweifelhafter Priorität",
    "de|Caroline_Herschel|darunter 1828 die Goldmedaille der Royal Astronomical Society",
    "de|Caroline_Herschel|Sie war die erste Frau, der Anerkennungen dieser Art zuteilwurden.",
  ],
  "v-person-schumann": [
    "de|Clara_Schumann|Clara Josephine Schumann geb. Wieck (* 13. September 1819 in Leipzig; † 20. Mai 1896 in Frankfurt am Main) war eine deutsche Pianistin, Komponistin, Klavierpädagogin und Herausgeberin.",
    "de|Clara_Schumann|Am Anfang ihrer Karriere als Pianistin, die sie als Wunderkind begann",
    "de|Clara_Schumann|Am 20. Oktober 1828 trat sie zum ersten Mal öffentlich im Leipziger Gewandhaus auf",
    "de|Clara_Schumann|Sie war von 1840 bis zu seinem Tod 1856 die Ehefrau Robert Schumanns.",
    "de|Clara_Schumann|Später waren Robert Schumann, Frédéric Chopin, Felix Mendelssohn Bartholdy, Ludwig van Beethoven, Johann Sebastian Bach, Franz Schubert und Johannes Brahms ihre bevorzugten Komponisten.",
    "de|Clara_Schumann|Damit legte sie einen Grundstein für das Konzertrepertoire des späten 19. und des 20. Jahrhunderts.",
    "de|Clara_Schumann|Seit den 1960er Jahren wurde sie als Komponistin wiederentdeckt.",
    "de|Clara_Schumann|auf dem 100-DM-Schein von 1990. Sie basieren auf einer Lithografie von Andreas Staub aus dem Jahre 1838.",
  ],
  "v-person-duerer": [
    "de|Albrecht_Dürer|* 21. Mai 1471 in Nürnberg; † 6. April 1528 ebenda) war ein deutscher Maler, Grafiker, Mathematiker und Kunsttheoretiker.",
    "de|Albrecht_Dürer|Seine Landschaftsaquarelle zählen zu den frühesten ihrer Gattung; gleiches gilt für seine Selbstporträts und seine Aktzeichnungen.",
    "de|Albrecht_Dürer|Von Ostern 1490 bis Pfingsten 1494 begab sich Dürer auf Wanderschaft an den Oberrhein",
    "de|Albrecht_Dürer|Selbstbildnis im Pelzrock (München, Alte Pinakothek), 1500",
    "de|Feldhase_(Dürer)|ist der Titel eines Aquarells von Albrecht Dürer und die wohl bekannteste aller Naturstudien Dürers, Entstehungsjahr 1502.",
    "de|Albrecht_Dürer|Im Jahr 1515 entstand der Holzschnitt Rhinocerus, eines der bekanntesten Werke Dürers.",
    "de|Dürers_Rhinocerus|Der Holzschnitt stellt ein aus Indien stammendes Panzernashorn dar, das 1515 nach Lissabon gelangt",
    "de|Dürers_Rhinocerus|Dürer hatte das Nashorn selbst nie gesehen.",
    "de|Dürers_Rhinocerus|Seine Vorlage für den Holzschnitt basierte auf der Beschreibung eines Augenzeugen mit vermutlich beigegebener Skizze",
    "de|Albrecht_Dürer|zählt er zu den herausragenden Vertretern der Renaissance",
  ],
};

// keep the Remotion clip list in step with this batch
const clips = JSON.parse(fs.readFileSync(new URL("../../video/src/clips.json", import.meta.url), "utf8"));
for (const v of videos) if (!clips.some((c) => c.id === v.id)) throw new Error(`${v.id} is missing in video/src/clips.json`);
