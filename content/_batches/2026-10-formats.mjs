// Content batch 9 (October 2026): the first 24 questions in the new formats – order, estimate, blank.
//   order:    options are shown in this (mixed) sequence; answer.order lists their indices in the right sequence
//   estimate: options = [min, max, unit, step]; answer = { value, abs } or { value, rel }
//   blank:    the question is the sentence with ___; options = [hint, format name]; answer = { accept: [lower-case answers], show }
// AI-checked; every explanation states the solution, because it is all a learner sees after a reload.
export const LOCALE = "en";
export const TODAY = "2026-10-16";
export const verification = "ai_checked";

const f = (id, kind, category, difficulty, minAge, question, options, answer, explanation, wiki, en, tags) => ({ id, kind, category, difficulty, minAge, question, options, answer, explanation, wiki, en, tags });

export const formats = [
  // ---------------------------------------------------------------- order
  f("o1", "order", "history", 2, 10, "Bring die Ereignisse in die richtige zeitliche Reihenfolge – das älteste zuerst.", ["Mondlandung", "Französische Revolution", "Fall der Berliner Mauer", "Erfindung des Buchdrucks"], { order: [3, 1, 0, 2] },
    "Buchdruck (um 1450), Französische Revolution (1789), Mondlandung (1969), Fall der Berliner Mauer (1989).", "Zeitleiste",
    { question: "Put the events in chronological order – the oldest first.", options: ["Moon landing", "French Revolution", "Fall of the Berlin Wall", "Invention of printing"], explanation: "Printing (around 1450), French Revolution (1789), Moon landing (1969), fall of the Berlin Wall (1989)." }, ["Zeitleiste"]),
  f("o2", "order", "science", 1, 10, "Ordne die Planeten nach ihrem Abstand zur Sonne – der nächste zuerst.", ["Mars", "Merkur", "Erde", "Venus"], { order: [1, 3, 2, 0] },
    "Merkur, Venus, Erde, Mars – das sind die vier Gesteinsplaneten des inneren Sonnensystems.", "Sonnensystem",
    { question: "Order the planets by their distance from the Sun – the nearest first.", options: ["Mars", "Mercury", "Earth", "Venus"], explanation: "Mercury, Venus, Earth, Mars – these are the four rocky planets of the inner solar system." }, ["Astronomie"]),
  f("o3", "order", "technology", 2, 10, "Welche Erfindung kam zuerst? Ordne von alt nach neu.", ["World Wide Web", "Telefon", "iPhone", "Transistor"], { order: [1, 3, 0, 2] },
    "Telefon (1876), Transistor (1947), World Wide Web (1989), iPhone (2007).", "Erfindung",
    { question: "Which invention came first? Order from old to new.", options: ["World Wide Web", "Telephone", "iPhone", "Transistor"], explanation: "Telephone (1876), transistor (1947), World Wide Web (1989), iPhone (2007)." }, ["Erfindungen"]),
  f("o4", "order", "technology", 2, 10, "Bring die vier Takte eines Benzinmotors in die richtige Reihenfolge.", ["Verdichten", "Ausstoßen", "Ansaugen", "Arbeiten"], { order: [2, 0, 3, 1] },
    "Ansaugen, Verdichten, Arbeiten, Ausstoßen – nur der dritte Takt liefert Kraft.", "Viertaktmotor",
    { question: "Put the four strokes of a petrol engine in the right order.", options: ["Compression", "Exhaust", "Intake", "Power"], explanation: "Intake, compression, power, exhaust – only the third stroke delivers power." }, ["Motor"]),
  f("o5", "order", "math", 2, 10, "Ordne die Zahlen der Größe nach – die kleinste zuerst.", ["0,5", "1/4", "0,3", "2/3"], { order: [1, 2, 0, 3] },
    "1/4 = 0,25 · 0,3 · 0,5 · 2/3 ≈ 0,67.", "Bruchrechnung",
    { question: "Order the numbers by size – the smallest first.", options: ["0.5", "1/4", "0.3", "2/3"], explanation: "1/4 = 0.25 · 0.3 · 0.5 · 2/3 ≈ 0.67." }, ["Rechnen"]),
  f("o6", "order", "earth", 2, 10, "Ordne die Kontinente nach ihrer Fläche – der größte zuerst.", ["Afrika", "Europa", "Asien", "Südamerika"], { order: [2, 0, 3, 1] },
    "Asien (rund 44 Mio. km²), Afrika (30 Mio.), Südamerika (18 Mio.), Europa (10 Mio.).", "Kontinent",
    { question: "Order the continents by area – the largest first.", options: ["Africa", "Europe", "Asia", "South America"], explanation: "Asia (about 44 million km²), Africa (30 million), South America (18 million), Europe (10 million)." }, ["Geographie"]),
  f("o7", "order", "history", 1, 10, "Bring die Epochen in die richtige Reihenfolge – die älteste zuerst.", ["Mittelalter", "Antike", "Neuzeit", "Steinzeit"], { order: [3, 1, 0, 2] },
    "Steinzeit, Antike, Mittelalter, Neuzeit.", "Epoche_(Chronologie)",
    { question: "Put the eras in the right order – the oldest first.", options: ["Middle Ages", "Antiquity", "Modern era", "Stone Age"], explanation: "Stone Age, antiquity, Middle Ages, modern era." }, ["Epochen"]),
  f("o8", "order", "culture", 3, 13, "Ordne die Komponisten nach ihrem Geburtsjahr – der älteste zuerst.", ["Mozart", "Bach", "Beethoven", "Vivaldi"], { order: [3, 1, 0, 2] },
    "Vivaldi (1678), Bach (1685), Mozart (1756), Beethoven (1770).", "Klassische_Musik",
    { question: "Order the composers by year of birth – the oldest first.", options: ["Mozart", "Bach", "Beethoven", "Vivaldi"], explanation: "Vivaldi (1678), Bach (1685), Mozart (1756), Beethoven (1770)." }, ["Musik"]),

  // ---------------------------------------------------------------- estimate
  f("s-e1", "estimate", "earth", 1, 10, "Schätze: Wie viel Prozent der Erdoberfläche sind von Wasser bedeckt?", ["0", "100", "%", "1"], { value: 71, abs: 5 },
    "Es sind rund 71 Prozent. Der größte Teil davon ist Salzwasser in den Ozeanen.", "Erde",
    { question: "Estimate: what percentage of the Earth's surface is covered by water?", options: ["0", "100", "%", "1"], explanation: "It is about 71 percent. Most of it is salt water in the oceans." }, ["Geographie"]),
  f("s-e2", "estimate", "science", 2, 10, "Schätze: Wie heiß ist die Oberfläche der Sonne?", ["1000", "20000", "°C", "500"], { value: 5500, abs: 1000 },
    "Rund 5.500 °C. Im Kern der Sonne sind es dagegen etwa 15 Millionen Grad.", "Sonne",
    { question: "Estimate: how hot is the surface of the Sun?", options: ["1000", "20000", "°C", "500"], explanation: "About 5,500 °C. In the Sun's core, by contrast, it is around 15 million degrees." }, ["Astronomie"]),
  f("s-e3", "estimate", "science", 2, 10, "Schätze: Wie weit ist der Mond im Mittel von der Erde entfernt?", ["50000", "1000000", "km", "10000"], { value: 384400, abs: 60000 },
    "Im Mittel rund 384.400 Kilometer. Licht braucht für die Strecke gut eine Sekunde.", "Mond",
    { question: "Estimate: how far is the Moon from the Earth on average?", options: ["50000", "1000000", "km", "10000"], explanation: "About 384,400 kilometres on average. Light needs just over a second for the distance." }, ["Astronomie"]),
  f("s-e4", "estimate", "technology", 2, 10, "Schätze: In welchem Jahr schlug Tim Berners-Lee das World Wide Web vor?", ["1950", "2010", "n. Chr.", "1"], { value: 1989, abs: 3 },
    "1989 am Forschungszentrum CERN. Die erste Website ging 1991 online.", "World_Wide_Web",
    { question: "Estimate: in which year did Tim Berners-Lee propose the World Wide Web?", options: ["1950", "2010", "AD", "1"], explanation: "In 1989 at the CERN research centre. The first website went online in 1991." }, ["Internet"]),
  f("s-e5", "estimate", "culture", 2, 13, "Schätze: Wie viele Mitgliedstaaten haben die Vereinten Nationen?", ["50", "300", "Staaten", "1"], { value: 193, abs: 10 },
    "193 Staaten. Als bisher letzter kam 2011 der Südsudan dazu.", "Mitgliedstaaten_der_Vereinten_Nationen",
    { question: "Estimate: how many member states does the United Nations have?", options: ["50", "300", "states", "1"], explanation: "193 states. The most recent to join was South Sudan in 2011." }, ["Politik"]),
  f("s-e6", "estimate", "science", 1, 10, "Schätze: Zu wie viel Prozent besteht der Körper eines Erwachsenen aus Wasser?", ["0", "100", "%", "1"], { value: 60, abs: 8 },
    "Etwa 60 Prozent – bei Säuglingen ist der Anteil höher, im Alter sinkt er.", "Körperwasser",
    { question: "Estimate: what percentage of an adult's body consists of water?", options: ["0", "100", "%", "1"], explanation: "About 60 percent – the share is higher in infants and falls in old age." }, ["Menschlicher Körper"]),
  f("s-e7", "estimate", "earth", 2, 10, "Schätze: Wie lang ist der Äquator?", ["10000", "100000", "km", "1000"], { value: 40075, abs: 5000 },
    "Rund 40.075 Kilometer. Das Meter wurde ursprünglich so festgelegt, dass der Erdumfang über die Pole 40.000 Kilometer beträgt.", "Äquator",
    { question: "Estimate: how long is the equator?", options: ["10000", "100000", "km", "1000"], explanation: "About 40,075 kilometres. The metre was originally defined so that the Earth's circumference through the poles is 40,000 kilometres." }, ["Geographie"]),
  f("s-e8", "estimate", "math", 1, 10, "Wie viele Sekunden hat eine Stunde? Stell den Wert genau ein.", ["600", "10000", "Sekunden", "100"], { value: 3600, abs: 0 },
    "60 Minuten mal 60 Sekunden: 3.600.", "Sekunde",
    { question: "How many seconds are there in an hour? Set the exact value.", options: ["600", "10000", "seconds", "100"], explanation: "60 minutes times 60 seconds: 3,600." }, ["Rechnen"]),

  // ---------------------------------------------------------------- blank
  f("l-b1", "blank", "earth", 1, 10, "Die Hauptstadt von Frankreich ist ___.", ["eine Stadt", "Lückentext"], { accept: ["paris"], show: "Paris" },
    "Paris ist die Hauptstadt und mit Abstand größte Stadt Frankreichs.", "Paris",
    { question: "The capital of France is ___.", options: ["a city", "Fill the gap"], explanation: "Paris is the capital and by far the largest city in France." }, ["Geographie"]),
  f("l-b2", "blank", "science", 1, 10, "Die chemische Formel für Wasser lautet ___.", ["Buchstaben und eine Zahl", "Lückentext"], { accept: ["h2o", "h₂o", "h 2 o"], show: "H₂O" },
    "H₂O: zwei Wasserstoffatome und ein Sauerstoffatom.", "Wasser",
    { question: "The chemical formula for water is ___.", options: ["letters and a number", "Fill the gap"], explanation: "H₂O: two hydrogen atoms and one oxygen atom." }, ["Chemie"]),
  f("l-b3", "blank", "science", 1, 10, "Die Erde dreht sich in rund ___ Stunden einmal um sich selbst.", ["eine Zahl", "Lückentext"], { accept: ["24", "vierundzwanzig", "twenty-four", "twenty four"], show: "24" },
    "In rund 24 Stunden – deshalb gibt es Tag und Nacht.", "Erdrotation",
    { question: "The Earth turns once on its axis in about ___ hours.", options: ["a number", "Fill the gap"], explanation: "In about 24 hours – which is why there is day and night." }, ["Astronomie"]),
  f("l-b4", "blank", "science", 1, 10, "Der größte Planet unseres Sonnensystems heißt ___.", ["ein Planet", "Lückentext"], { accept: ["jupiter"], show: "Jupiter" },
    "Jupiter: In ihm hätte die Erde mehr als tausendmal Platz.", "Jupiter_(Planet)",
    { question: "The largest planet in our solar system is called ___.", options: ["a planet", "Fill the gap"], explanation: "Jupiter: the Earth would fit into it more than a thousand times." }, ["Astronomie"]),
  f("l-b5", "blank", "science", 2, 10, "Pflanzen stellen mit Licht aus Wasser und Kohlendioxid Zucker her. Dieser Vorgang heißt ___.", ["ein Fachwort", "Lückentext"], { accept: ["fotosynthese", "photosynthese", "photosynthesis"], show: "Fotosynthese" },
    "Fotosynthese. Dabei wird auch der Sauerstoff frei, den wir atmen.", "Photosynthese",
    { question: "Plants use light to make sugar from water and carbon dioxide. This process is called ___.", options: ["a technical term", "Fill the gap"], explanation: "Photosynthesis. It also releases the oxygen we breathe." }, ["Biologie"]),
  f("l-b6", "blank", "history", 1, 10, "Der erste Mensch auf dem Mond hieß Neil ___.", ["ein Nachname", "Lückentext"], { accept: ["armstrong"], show: "Armstrong" },
    "Neil Armstrong betrat den Mond am 21. Juli 1969 (mitteleuropäischer Zeit).", "Neil_Armstrong",
    { question: "The first person on the Moon was called Neil ___.", options: ["a surname", "Fill the gap"], explanation: "Neil Armstrong stepped onto the Moon on 21 July 1969 (Central European Time)." }, ["Raumfahrt"]),
  f("l-b7", "blank", "technology", 1, 10, "Die Abkürzung „www“ steht für World Wide ___.", ["ein englisches Wort", "Lückentext"], { accept: ["web"], show: "Web" },
    "World Wide Web – das „weltweite Netz“ aus verlinkten Seiten.", "World_Wide_Web",
    { question: "The abbreviation “www” stands for World Wide ___.", options: ["an English word", "Fill the gap"], explanation: "World Wide Web – the worldwide network of linked pages." }, ["Internet"]),
  f("l-b8", "blank", "math", 1, 10, "Ein Dreieck hat ___ Ecken.", ["eine Zahl", "Lückentext"], { accept: ["3", "drei", "three"], show: "3" },
    "Drei Ecken, drei Seiten – und die Innenwinkel ergeben zusammen 180 Grad.", "Dreieck",
    { question: "A triangle has ___ corners.", options: ["a number", "Fill the gap"], explanation: "Three corners, three sides – and the interior angles add up to 180 degrees." }, ["Geometrie"]),
];
