// Content batch (26.10.2026): 7 questions – bird migration, three technical acronyms and three word origins. Every statement
// is taken from the linked article, word-for-word evidence below. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-warum-5.mjs
//
// Evidence (de.wikipedia.org):
//   Vogelzug: "Große und schwere Vögel bevorzugen den Flug am Tag und über Land und nutzen meist die V-Formation, um Energie zu sparen."
//   Laser: "Laser ist ein Akronym und steht für englisch light amplification by stimulated emission of radiation
//     ‚Lichtverstärkung durch stimulierte Emission von Strahlung‘."
//   Radar: "RADAR […] ist die Abkürzung für engl. Radio Detection And Ranging (frei übersetzt „funkgestützte Ortung und
//     Entfernungsmessung“"
//   Universal Serial Bus: "Der Universal Serial Bus (USB) […] ist ein bit-serielles Datenübertragungssystem zur Verbindung eines
//     Computers mit externen Geräten."
//   Kitsch: "Die genaue Abkunft des wahrscheinlich in den 1870er Jahren im Münchner Kunsthandel entstandenen Wortes bleibt unsicher"
//   Pyjama: "Das Wort Pyjama stammt aus dem Persischen (persisch پايجامه pāīdschāma […] wortwörtlich „Beinkleidung“) und
//     bezeichnet ursprünglich eine leichte Hose"
//   Safari: "Als Safari (…; zu Swahili safari ‚Reise‘, arabisch سفر, DMG safar ‚Reise‘) werden Reisen bezeichnet"
import { balance } from "./_balance.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-26";
export const verification = "ai_checked";

// [id, category, difficulty, minAge, maxAge, question, options, correct, explanation, wiki, enQuestion, enOptions, enExplanation, tags]
export const questions = balance([
  ["g52", "earth", 1, 10, null, "Warum fliegen große Zugvögel oft in V-Formation?", ["Um Energie zu sparen", "Damit sie sich nicht verfliegen", "Um Feinde abzuschrecken", "Weil der Anführer sonst nichts sieht"], 0, "Große und schwere Zugvögel fliegen meist am Tag über Land und nutzen dabei meist die V-Formation, um Energie zu sparen.", "Vogelzug", "Why do large migrating birds often fly in a V formation?", ["To save energy", "So that they don't get lost", "To scare off enemies", "Because the leader would otherwise see nothing"], "Large, heavy migrating birds mostly fly by day over land and mostly use the V formation to save energy.", ["Vögel", "Tiere"]],
  ["t52", "technology", 2, 10, null, "Wofür steht das Wort „Laser“?", ["Lichtverstärkung durch stimulierte Emission von Strahlung", "Lichtstrahl aus sehr energiereichem Rubin", "Leuchtende Anlage für schnelle Entfernungsmessung", "Langer, schmaler Energiestrahl"], 0, "Laser ist ein Akronym: light amplification by stimulated emission of radiation – „Lichtverstärkung durch stimulierte Emission von Strahlung“.", "Laser", "What does the word \"laser\" stand for?", ["Light amplification by stimulated emission of radiation", "Light beam from a very energetic ruby", "Luminous apparatus for swift distance measuring", "Long, narrow energy ray"], "Laser is an acronym: light amplification by stimulated emission of radiation.", ["Technik", "Abkürzungen"]],
  ["t53", "technology", 2, 10, null, "Wofür steht die Abkürzung RADAR?", ["Radio Detection And Ranging – funkgestützte Ortung und Entfernungsmessung", "Rapid Data Radio – schneller Datenfunk", "Reflected Air Detection And Response", "Radiated Antenna Direction Range"], 0, "RADAR ist die Abkürzung für Radio Detection And Ranging, frei übersetzt „funkgestützte Ortung und Entfernungsmessung“.", "Radar", "What does the abbreviation RADAR stand for?", ["Radio Detection And Ranging", "Rapid Data Radio", "Reflected Air Detection And Response", "Radiated Antenna Direction Range"], "RADAR stands for Radio Detection And Ranging – locating things and measuring their distance by radio.", ["Technik", "Abkürzungen"]],
  ["t54", "technology", 1, 10, null, "Wofür steht die Abkürzung USB?", ["Universal Serial Bus", "Unified System Board", "Universal Storage Box", "User Service Bridge"], 0, "USB heißt Universal Serial Bus – ein System, um Daten zwischen einem Computer und externen Geräten zu übertragen.", "Universal_Serial_Bus", "What does the abbreviation USB stand for?", ["Universal Serial Bus", "Unified System Board", "Universal Storage Box", "User Service Bridge"], "USB stands for Universal Serial Bus – a system for transferring data between a computer and external devices.", ["Technik", "Abkürzungen"]],
  ["c64", "culture", 3, 13, null, "Wo ist das Wort „Kitsch“ wahrscheinlich entstanden?", ["Im Münchner Kunsthandel der 1870er Jahre", "In einer Pariser Porzellanmanufaktur", "In der Wiener Oper", "In einer Berliner Werbeagentur"], 0, "Das Wort ist wahrscheinlich in den 1870er Jahren im Münchner Kunsthandel entstanden. Seine genaue Herkunft bleibt aber unsicher.", "Kitsch", "Where did the word \"kitsch\" probably come from?", ["The Munich art trade of the 1870s", "A Paris porcelain factory", "The Vienna Opera", "A Berlin advertising agency"], "The word probably arose in the Munich art trade in the 1870s. Its exact origin, however, remains uncertain.", ["Kunst", "Wortherkunft"]],
  ["l69", "language", 2, 10, null, "Aus welcher Sprache stammt das Wort „Pyjama“?", ["Aus dem Persischen", "Aus dem Französischen", "Aus dem Spanischen", "Aus dem Japanischen"], 0, "Pyjama stammt aus dem Persischen und heißt wörtlich „Beinkleidung“ – ursprünglich eine leichte Hose.", "Pyjama", "Which language does the word \"pyjama\" come from?", ["Persian", "French", "Spanish", "Japanese"], "Pyjama comes from Persian and literally means \"leg garment\" – originally a light pair of trousers.", ["Wortherkunft"]],
  ["l70", "language", 1, 10, null, "Was bedeutet das Swahili-Wort „safari“?", ["„Reise“", "„Jagd“", "„Löwe“", "„Steppe“"], 0, "Safari kommt vom Swahili-Wort safari, „Reise“ – das wiederum auf das arabische safar, „Reise“, zurückgeht.", "Safari", "What does the Swahili word \"safari\" mean?", ["\"Journey\"", "\"Hunt\"", "\"Lion\"", "\"Savannah\""], "Safari comes from the Swahili word safari, \"journey\" – which in turn goes back to the Arabic safar, \"journey\".", ["Wortherkunft"]],
]);
