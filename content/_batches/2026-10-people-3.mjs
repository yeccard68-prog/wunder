// Content batch (22.10.2026): six more "Persönlichkeiten" clips (video/src/people.ts, Lebenslinie.tsx), same rules as
// 2026-10-people-1.mjs: long-dead people known for their work, no portraits, every claim quoted below.
//   node scripts/content/verify-evidence.mjs content/_batches/2026-10-people-3.mjs
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-people-3.mjs && npm --prefix video run render -- <ids>
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
  own("v-person-zuse", "technology", 10, ["Persönlichkeiten", "Computer"], [wiki("Konrad_Zuse")],
    ["Konrad Zuse: der erste Computer der Welt", "Mit der Z3 baute Konrad Zuse 1941 den Rechner, der als erster funktionsfähiger Computer der Welt gilt.",
      "Konrad Zuse wurde am 22. Juni 1910 in Deutsch-Wilmersdorf geboren. Schon mit 14 Jahren tüftelte er an Erfindungen. In der Wohnung seiner Eltern entstand die Z1, 1938 fertiggestellt: ein elektrisch angetriebener mechanischer Rechner, der als erster Rechner mit binären Zahlen arbeitete. Mit der Z3 baute Zuse 1941 den ersten funktionstüchtigen, vollautomatischen, frei programmierbaren Rechner und damit den ersten funktionsfähigen Computer der Welt. 1949 gründete er die Zuse KG. Konrad Zuse starb am 18. Dezember 1995 in Hünfeld.",
      ["Geboren 1910, schon als Jugendlicher ein Tüftler.", "1938: die Z1 rechnete mit binären Zahlen.", "1941: die Z3 – der erste funktionsfähige Computer."]],
    ["Konrad Zuse: the world's first computer", "With the Z3 in 1941, Konrad Zuse built the machine regarded as the world's first working computer.",
      "Konrad Zuse was born in Deutsch-Wilmersdorf on 22 June 1910. At 14 he was already tinkering with inventions. In his parents' flat he built the Z1, completed in 1938: an electrically driven mechanical calculator, the first to work with binary numbers. With the Z3 in 1941, Zuse built the first working, fully automatic, freely programmable calculator and thus the world's first functioning computer. In 1949 he founded the company Zuse KG. Konrad Zuse died in Hünfeld on 18 December 1995.",
      ["Born in 1910, a tinkerer from his youth.", "1938: the Z1 calculated with binary numbers.", "1941: the Z3 – the first working computer."]],
    ["Wie hieß der Rechner, den Konrad Zuse 1941 baute?", ["Z3", "ENIAC", "Mark I", "UNIVAC"], 0,
      "Mit der Z3 baute Zuse 1941 den ersten funktionstüchtigen, frei programmierbaren Rechner – den ersten funktionsfähigen Computer der Welt.",
      "What was the machine Konrad Zuse built in 1941 called?", ["Z3", "ENIAC", "Mark I", "UNIVAC"],
      "With the Z3 in 1941 Zuse built the first working, freely programmable calculator – the world's first functioning computer."]),

  own("v-person-kepler", "science", 10, ["Persönlichkeiten", "Astronomie"], [wiki("Johannes_Kepler")],
    ["Johannes Kepler: die Gesetze der Planetenbahnen", "Kepler entdeckte, nach welchen Gesetzen sich die Planeten um die Sonne bewegen – sie tragen bis heute seinen Namen.",
      "Johannes Kepler wurde am 27. Dezember 1571 in Weil der Stadt geboren. Nach dem Tod des Astronomen Tycho Brahe im Oktober 1601 wurde er dessen Nachfolger als kaiserlicher Mathematiker und Hofastronom. 1609 veröffentlichte er die „Astronomia nova“; das Buch enthielt das erste und zweite Keplersche Gesetz. Am 15. Mai 1618 entdeckte er das dritte Gesetz, das er in seinem 1619 veröffentlichten Werk „Harmonices mundi“ erläuterte. Von 1615 bis 1621 organisierte er die erfolgreiche Verteidigung seiner Mutter, die der Hexerei angeklagt war. Kepler starb am 15. November 1630 in Regensburg.",
      ["Geboren 1571 in Weil der Stadt.", "Ab 1601 war er Hofastronom des Kaisers.", "1609 und 1619 veröffentlichte er die Gesetze der Planetenbahnen."]],
    ["Johannes Kepler: the laws of planetary orbits", "Kepler discovered the laws by which the planets move around the Sun – they still bear his name today.",
      "Johannes Kepler was born in Weil der Stadt on 27 December 1571. After the death of the astronomer Tycho Brahe in October 1601 he became his successor as imperial mathematician and court astronomer. In 1609 he published the Astronomia nova; the book contained Kepler's first and second laws. On 15 May 1618 he discovered the third law, which he explained in his work Harmonices mundi, published in 1619. From 1615 to 1621 he organised the successful defence of his mother, who had been accused of witchcraft. Kepler died in Regensburg on 15 November 1630.",
      ["Born in Weil der Stadt in 1571.", "From 1601 he was the emperor's court astronomer.", "In 1609 and 1619 he published the laws of planetary orbits."]],
    ["Was beschreiben die Keplerschen Gesetze?", ["Wie sich Planeten um die Sonne bewegen", "Wie Licht gebrochen wird", "Wie sich Gase ausdehnen", "Wie ein Pendel schwingt"], 0,
      "Kepler entdeckte die Gesetzmäßigkeiten, nach denen sich Planeten um die Sonne bewegen; sie heißen nach ihm Keplersche Gesetze.",
      "What do Kepler's laws describe?", ["How planets move around the Sun", "How light is refracted", "How gases expand", "How a pendulum swings"],
      "Kepler discovered the laws by which planets move around the Sun; they are named after him."]),

  own("v-person-amundsen", "earth", 10, ["Persönlichkeiten", "Entdecker"], [wiki("Roald_Amundsen")],
    ["Roald Amundsen: der Erste am Südpol", "Am 14. Dezember 1911 erreichte Roald Amundsen als erster Mensch den Südpol – vor seinem Rivalen Robert Falcon Scott.",
      "Roald Amundsen wurde am 16. Juli 1872 in Borge in Norwegen geboren. Von 1903 bis 1906 erkundete er mit dem kleinen Segelschiff Gjøa die Nordwestpassage; er durchfuhr sie als Erster. Am 14. Dezember 1911 erreichte er mit vier Begleitern als erster Mensch den geographischen Südpol, vor seinem britischen Rivalen Robert Falcon Scott. Am 12. Mai 1926 überquerte er im Luftschiff Norge mit 15 weiteren Expeditionsteilnehmern den Nordpol. Amundsen kam 1928 bei einem Rettungsflug für den Polarforscher Umberto Nobile ums Leben.",
      ["Geboren 1872 in Norwegen.", "1903 bis 1906: als Erster durch die Nordwestpassage.", "1911 stand er als erster Mensch am Südpol."]],
    ["Roald Amundsen: first at the South Pole", "On 14 December 1911 Roald Amundsen became the first person to reach the South Pole – ahead of his rival Robert Falcon Scott.",
      "Roald Amundsen was born in Borge, Norway, on 16 July 1872. From 1903 to 1906 he explored the Northwest Passage in the small sailing ship Gjøa; he was the first to sail through it. On 14 December 1911, with four companions, he became the first person to reach the geographic South Pole, ahead of his British rival Robert Falcon Scott. On 12 May 1926 he crossed the North Pole in the airship Norge with 15 other expedition members. Amundsen died in 1928 on a rescue flight for the polar explorer Umberto Nobile.",
      ["Born in Norway in 1872.", "1903 to 1906: first through the Northwest Passage.", "In 1911 he was the first person at the South Pole."]],
    ["Wen ließ Roald Amundsen 1911 im Wettlauf zum Südpol hinter sich?", ["Robert Falcon Scott", "Fridtjof Nansen", "Umberto Nobile", "Ernest Shackleton"], 0,
      "Amundsen erreichte den Südpol am 14. Dezember 1911 – vor seinem britischen Rivalen Robert Falcon Scott.",
      "Whom did Roald Amundsen beat in the race to the South Pole in 1911?", ["Robert Falcon Scott", "Fridtjof Nansen", "Umberto Nobile", "Ernest Shackleton"],
      "Amundsen reached the South Pole on 14 December 1911 – ahead of his British rival Robert Falcon Scott."]),

  own("v-person-vangogh", "culture", 10, ["Persönlichkeiten", "Kunst"], [wiki("Vincent_van_Gogh")],
    ["Vincent van Gogh: ein einziges Bild verkauft", "Zu Lebzeiten verkaufte van Gogh nur ein Bild – heute erzielen seine Werke Rekordpreise.",
      "Vincent van Gogh wurde am 30. März 1853 in Groot-Zundert geboren. Er gilt als einer der Begründer der modernen Malerei. Am 19. Februar 1888 reiste er ins südfranzösische Arles; dort malte er in kurzer Zeit zahlreiche Bilder, darunter die bekannten Sonnenblumenbilder. Seine Gemälde entstanden überwiegend in den letzten zehn seiner 37 Lebensjahre. Nach dem Wissensstand von 2021 hinterließ er über 900 Gemälde und über 1000 Zeichnungen. Zu Lebzeiten konnte er nur ein Bild verkaufen, an die Künstlerin Anna Boch; seit den 1980er Jahren erzielen seine Werke bei Auktionen Rekordpreise. Er starb am 29. Juli 1890 in Auvers-sur-Oise.",
      ["Geboren 1853 in den Niederlanden.", "1888 in Arles entstanden die Sonnenblumenbilder.", "Über 900 Gemälde – verkauft hat er zu Lebzeiten nur eines."]],
    ["Vincent van Gogh: just one painting sold", "Van Gogh sold only one painting in his lifetime – today his works fetch record prices.",
      "Vincent van Gogh was born in Groot-Zundert on 30 March 1853. He is regarded as one of the founders of modern painting. On 19 February 1888 he travelled to Arles in the south of France, where he painted many pictures in a short time, among them the famous sunflower paintings. Most of his paintings were made in the last ten of his 37 years. As of 2021 he is known to have left more than 900 paintings and more than 1,000 drawings. In his lifetime he was able to sell only one painting, to the artist Anna Boch; since the 1980s his works have fetched record prices at auction. He died in Auvers-sur-Oise on 29 July 1890.",
      ["Born in the Netherlands in 1853.", "In Arles in 1888 he painted the sunflowers.", "Over 900 paintings – he sold only one in his lifetime."]],
    ["Wie viele seiner Bilder konnte Vincent van Gogh zu Lebzeiten verkaufen?", ["Nur eines", "Rund 50", "Über 300", "Gar keines"], 0,
      "Zu Lebzeiten konnte er nur ein Bild verkaufen, an die Künstlerin Anna Boch.",
      "How many of his paintings did Vincent van Gogh sell in his lifetime?", ["Just one", "About 50", "More than 300", "None at all"],
      "In his lifetime he was able to sell only one painting, to the artist Anna Boch."]),

  own("v-person-owens", "sport", 10, ["Persönlichkeiten", "Olympia"], [wiki("Jesse_Owens")],
    ["Jesse Owens: fünf Weltrekorde in 45 Minuten", "An einem einzigen Nachmittag im Mai 1935 stellte Jesse Owens innerhalb von 45 Minuten fünf neue Weltrekorde auf.",
      "Jesse Owens wurde am 12. September 1913 in Oakville in Alabama geboren; den Spitznamen „Jesse“ bekam er von einer Lehrerin, die seinen Akzent nicht verstand, als er sagte, man nenne ihn J. C. Am 25. Mai 1935 stellte er in Ann Arbor innerhalb von 45 Minuten fünf neue Weltrekorde auf und stellte einen weiteren ein. Seine Weitsprung-Weltrekordweite von 8,13 Metern wurde erst am 12. August 1960 übertroffen. Bei den Olympischen Spielen 1936 in Berlin gewann er vier Goldmedaillen und war damit der erfolgreichste Athlet. Owens starb am 31. März 1980 in Tucson.",
      ["Geboren 1913 in Alabama.", "1935: fünf neue Weltrekorde in 45 Minuten.", "1936 gewann er vier olympische Goldmedaillen."]],
    ["Jesse Owens: five world records in 45 minutes", "On a single afternoon in May 1935 Jesse Owens set five new world records within 45 minutes.",
      "Jesse Owens was born in Oakville, Alabama, on 12 September 1913; he got the nickname \"Jesse\" from a teacher who did not understand his accent when he said he was called J. C. On 25 May 1935 in Ann Arbor he set five new world records within 45 minutes and equalled another. His long jump world record of 8.13 metres was only beaten on 12 August 1960. At the 1936 Olympic Games in Berlin he won four gold medals, making him the most successful athlete. Owens died in Tucson on 31 March 1980.",
      ["Born in Alabama in 1913.", "1935: five new world records in 45 minutes.", "In 1936 he won four Olympic gold medals."]],
    ["Wie viele Goldmedaillen gewann Jesse Owens bei den Olympischen Spielen 1936?", ["Vier", "Zwei", "Sechs", "Eine"], 0,
      "Mit vier Goldmedaillen – drei im Sprint und eine im Weitsprung – war er der erfolgreichste Athlet der Spiele.",
      "How many gold medals did Jesse Owens win at the 1936 Olympic Games?", ["Four", "Two", "Six", "One"],
      "With four gold medals – three in sprint events and one in the long jump – he was the most successful athlete of the Games."]),

  own("v-person-hopper", "technology", 10, ["Persönlichkeiten", "Computer"], [wiki("Grace_Hopper")],
    ["Grace Hopper: Programme in verständlicher Sprache", "Grace Hopper wollte Programme in verständlicher Sprache schreiben statt in Einsen und Nullen – und entwickelte 1952 den ersten Compiler.",
      "Grace Hopper wurde am 9. Dezember 1906 in New York City geboren. Mit dem 1944 fertiggestellten Computer Mark I führte sie an der Harvard University mathematische Berechnungen durch. Ende der 1940er Jahre kam sie auf die Idee, Computerprogramme in einer verständlichen Sprache zu verfassen statt nur mit Einsen und Nullen. 1952 entwickelte sie den ersten Compiler (A-0). Mit der Programmiersprache FLOW-MATIC und dem zugehörigen Compiler (1957) leistete sie wesentliche Vorarbeiten für die Programmiersprache COBOL. Grace Hopper starb am 1. Januar 1992.",
      ["Geboren 1906 in New York City.", "Ab 1944 rechnete sie am Computer Mark I.", "1952 entwickelte sie den ersten Compiler."]],
    ["Grace Hopper: programs in plain language", "Grace Hopper wanted to write programs in understandable language instead of ones and zeros – and developed the first compiler in 1952.",
      "Grace Hopper was born in New York City on 9 December 1906. With the Mark I computer, completed in 1944, she carried out mathematical calculations at Harvard University. In the late 1940s she had the idea of writing computer programs in an understandable language instead of only ones and zeros. In 1952 she developed the first compiler (A-0). With the programming language FLOW-MATIC and its compiler (1957) she laid important groundwork for the programming language COBOL. Grace Hopper died on 1 January 1992.",
      ["Born in New York City in 1906.", "From 1944 she calculated on the Mark I computer.", "In 1952 she developed the first compiler."]],
    ["Was entwickelte Grace Hopper 1952?", ["Den ersten Compiler", "Die erste Computermaus", "Das erste E-Mail-Programm", "Den ersten Mikrochip"], 0,
      "1952 entwickelte sie den ersten Compiler (A-0) – damit konnten Programme in verständlicherer Sprache geschrieben werden.",
      "What did Grace Hopper develop in 1952?", ["The first compiler", "The first computer mouse", "The first e-mail program", "The first microchip"],
      "In 1952 she developed the first compiler (A-0) – it let programs be written in more understandable language."]),
];

export const evidence = {
  "v-person-zuse": [
    "de|Konrad_Zuse|22. Juni 1910 in Deutsch-Wilmersdorf",
    "de|Konrad_Zuse|18. Dezember 1995 in Hünfeld",
    "de|Konrad_Zuse|Bereits im Alter von 14 Jahren tüftelte er an Erfindungen",
    "de|Konrad_Zuse|richtete eine Erfinderwerkstatt in der Wohnung seiner Eltern ein. Hier entstand die Z1",
    "de|Konrad_Zuse|Das Resultat war der 1938 fertiggestellte, elektrisch angetriebene mechanische Rechner Z1. Er arbeitete als erster Rechner mit binären Zahlen",
    "de|Konrad_Zuse|Mit seiner Entwicklung der Rechenmaschine Z3 im Jahre 1941 baute Zuse den ersten funktionstüchtigen, vollautomatischen, programmgesteuerten und frei programmierbaren",
    "de|Konrad_Zuse|und somit den ersten funktionsfähigen Computer der Welt",
    "de|Konrad_Zuse|Nach dem Krieg gründete Zuse 1949 in Neukirchen im damaligen Kreis Hünfeld die Zuse KG",
  ],
  "v-person-kepler": [
    "de|Johannes_Kepler|27. Dezember 1571",
    "de|Johannes_Kepler|in Weil der Stadt",
    "de|Johannes_Kepler|15. November 1630greg. in Regensburg",
    "de|Johannes_Kepler|Nach Brahes Tod im Oktober 1601 wurde Kepler sein Nachfolger als kaiserlicher Mathematiker und Hofastronom",
    "de|Johannes_Kepler|Diese Arbeiten vollendete er 1606 und veröffentlichte sie 1609 als Astronomia nova. Das Buch enthielt das erste und zweite Keplersche Gesetz",
    "de|Johannes_Kepler|entdeckte Kepler am 15. Mai 1618 das dritte der nach ihm benannten Gesetze, das er in dem im Jahr 1619 veröffentlichten Werk Harmonices mundi",
    "de|Johannes_Kepler|Von 1615 bis 1621 organisierte Kepler die letztlich erfolgreiche Verteidigung seiner Mutter, die der Hexerei angeklagt",
    "de|Johannes_Kepler|Johannes Kepler entdeckte die Gesetzmäßigkeiten, nach denen sich Planeten um die Sonne bewegen",
  ],
  "v-person-amundsen": [
    "de|Roald_Amundsen|16. Juli 1872 in Borge, Norwegen",
    "de|Roald_Amundsen|Von 1903 bis 1906 erkundete Amundsen die Nordwestpassage mit Hilfe des kleinen Segelschiffes Gjøa",
    "de|Roald_Amundsen|Er durchfuhr als Erster die Nordwestpassage",
    "de|Roald_Amundsen|erreichte am 14. Dezember 1911, vor seinem britischen Rivalen Robert Falcon Scott, mit vier Begleitern als erster Mensch den geographischen Südpol",
    "de|Roald_Amundsen|den er als Leiter einer transarktischen Fahrt im Luftschiff Norge zusammen mit 15 weiteren Expeditionsteilnehmern am 12. Mai 1926 überquerte",
    "de|Roald_Amundsen|Amundsen kam 1928 bei einem Rettungsflug für den in Not geratenen italienischen Polarforscher Umberto Nobile ums Leben",
  ],
  "v-person-vangogh": [
    "de|Vincent_van_Gogh|30. März 1853 in Groot-Zundert",
    "de|Vincent_van_Gogh|29. Juli 1890 in Auvers-sur-Oise",
    "de|Vincent_van_Gogh|Er gilt als einer der Begründer der modernen Malerei",
    "de|Vincent_van_Gogh|Am 19. Februar 1888 reiste er in das südfranzösische Arles",
    "de|Vincent_van_Gogh|malte er in kurzer Zeit zahlreiche Bilder, darunter die bekannten Sonnenblumenbilder",
    "de|Vincent_van_Gogh|Die Gemälde entstanden überwiegend in den letzten zehn seiner 37 Lebensjahre",
    "de|Vincent_van_Gogh|Nach dem Wissensstand von 2021 hinterließ er über 900 Gemälde und über 1000 Zeichnungen",
    "de|Vincent_van_Gogh|Während er zu Lebzeiten nur ein Bild an die Künstlerin Anna Boch verkaufen konnte, erzielen seine Werke seit den 1980er Jahren bei Auktionen Rekordpreise",
  ],
  "v-person-owens": [
    "de|Jesse_Owens|12. September 1913 in Oakville, Lawrence County, Alabama",
    "de|Jesse_Owens|31. März 1980 in Tucson, Arizona",
    "de|Jesse_Owens|Den Spitznamen „Jesse“ erhielt er von einer Lehrerin. Diese hatte seinen Akzent nicht verstanden, als er ihr sagte, dass man ihn J. C. nenne",
    "de|Jesse_Owens|Dennoch stellte Jesse Owens am 25. Mai 1935 in Ann Arbor",
    "de|Jesse_Owens|innerhalb von 45 Minuten fünf neue Weltrekorde auf, einen Weltrekord stellte er ein",
    "de|Jesse_Owens|sprang er die Weltrekordweite von 8,13 m, die erst am 12. August 1960 von",
    "de|Jesse_Owens|durch seine Siege bei den Olympischen Spielen 1936 in Berlin. Mit vier Goldmedaillen (Erstplatzierung bei drei Sprintdisziplinen und beim Weitsprung) war er deren erfolgreichster Athlet",
  ],
  "v-person-hopper": [
    "de|Grace_Hopper|9. Dezember 1906 in New York City",
    "de|Grace_Hopper|1. Januar 1992 in Arlington",
    "de|Grace_Hopper|Während dieser Zeit führte sie mit dem 1944 fertiggestellten Computer Mark I an der Harvard University mathematische Berechnungen durch",
    "de|Grace_Hopper|Hopper kam Ende der 1940er Jahre auf die Idee, Computerprogramme in einer verständlichen Sprache zu verfassen statt nur mit Einsen und Nullen",
    "de|Grace_Hopper|Sie entwickelte 1952 den ersten Compiler (A-0)",
    "de|Grace_Hopper|mit der Programmiersprache FLOW-MATIC und dem zugehörigen Compiler (1957) wesentliche Vorarbeiten zur Entwicklung der Programmiersprache COBOL",
  ],
};

// keep the Remotion clip list in step with this batch
const clips = JSON.parse(fs.readFileSync(new URL("../../video/src/clips.json", import.meta.url), "utf8"));
for (const v of videos) if (!clips.some((c) => c.id === v.id)) throw new Error(`${v.id} is missing in video/src/clips.json`);
