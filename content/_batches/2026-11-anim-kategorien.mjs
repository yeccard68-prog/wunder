// Content batch (05.11.2026): motion graphics for three of the new categories, each with its check question –
// music "Eine Oktave ist eine Verdopplung" (a-oktave, scene octave), animals "Die längste Reise eines Vogels"
// (a-zugvogel, scene migration), art "Wie kommt die Tiefe ins Bild?" (a-perspektive, scene perspective).
// Numbers in the scenes, quoted from: Kammerton "Der seit einer internationalen Konferenz in London 1939 in vielen Ländern
// gültige Standard-Kammerton oder Normalstimmton ist festgelegt auf a1 = 440 Hertz (Hz)" · Oktave "Rahmentöne im
// Frequenzverhältnis 2:1" · Monochord: shortened to half the length "klingt sie eine Oktave höher" · Klaviatur "88 Tasten
// (7 ⅓ Oktaven von A2 bis c5)" (27.5 Hz and ≈ 4186 Hz computed from 440 Hz) · Hörfläche "tiefsten vom Menschen hörbaren
// Frequenz mit etwa 16 Hz bis 21 Hz und rechts von der höchsten hörbaren Frequenz mit etwa 16.000 Hz bis 20.000 Hz" ·
// Küstenseeschwalbe "33 und 36 cm", "86 und 127 Gramm", "bis zu 30.000 km", "bis 90.000 km in einem Jahr", "innerhalb von
// 10 Monaten einen Weg von 96.000 km", "in insgesamt acht Monaten die Sonne nicht untergeht" · Erdumfang "am Äquator mit
// etwa 40.075 km am größten" · Masaccio "zwischen 1425 und 1428" · Alberti "De pictura („Über die Malkunst“), 1435/1436" ·
// Abendmahl "1495 bis 1497", "Ihr Augpunkt befindet sich in der Schläfe der Christusfigur".
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-anim-kategorien.mjs
//   node scripts/content/apply-batch.mjs content/_batches/2026-11-anim-kategorien.mjs   → the questions
//   node content/_batches/2026-11-anim-kategorien.mjs                                   → the animations (idempotent)
import { pathToFileURL } from "node:url";
import { balance } from "./_balance.mjs";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-11-05";
export const verification = "ai_checked";

// [id, category, difficulty, minAge, maxAge, question, options, correct, explanation, wiki, enQuestion, enOptions, enExplanation, tags]
export const questions = balance([
  // ok1 (Oktave) archived on 06.11.2026 – the same question as the older mu1, which a-oktave now uses as its check.
  ["zv1", "animals", 1, 10, null, "Wohin fliegt die Küstenseeschwalbe nach der Brutzeit in der Arktis?", ["Bis an den Rand des antarktischen Packeises", "Nach Mitteleuropa", "In die Sahara", "Nirgendwohin – sie bleibt in der Arktis"], 0,
    "Sie ist der Zugvogel mit dem längsten Zugweg: Ihre Winterquartiere liegen am Rand der antarktischen Packeiszone, etwa in der Weddell-See. Hin und zurück sind das bis zu 30.000 Kilometer.", "Küstenseeschwalbe",
    "Where does the Arctic tern fly after the breeding season in the Arctic?", ["To the edge of the Antarctic pack ice", "To central Europe", "To the Sahara", "Nowhere – it stays in the Arctic"],
    "It is the migratory bird with the longest migration: its winter quarters lie at the edge of the Antarctic pack ice, for example in the Weddell Sea. There and back, that is up to 30,000 kilometres.", ["Tiere", "Vögel"]],
  ["zp1", "art", 2, 10, null, "Wo treffen sich in Leonardos „Abendmahl“ alle Perspektivlinien?", ["An der Schläfe von Jesus", "Im linken Fenster", "In der Mitte des Tischtuchs", "In der rechten oberen Ecke"], 0,
    "Der Augpunkt der Zentralperspektive liegt in der Schläfe der Christusfigur. Bei der Restaurierung fand man dort das Loch eines Nagels, von dem aus die Linien gespannt wurden. Leonardo malte das Bild von 1495 bis 1497 in Mailand.", "Das_Abendmahl_(Leonardo_da_Vinci)",
    "Where do all the perspective lines meet in Leonardo's “Last Supper”?", ["At Jesus's temple", "In the left window", "In the middle of the tablecloth", "In the top right corner"],
    "The central point of the perspective lies at the temple of the figure of Christ. During the restoration, the hole of a nail was found there, from which the lines were stretched. Leonardo painted the picture from 1495 to 1497 in Milan.", ["Kunst", "Malerei"]],
]);

export const evidence = {
  zv1: [
    "de|Küstenseeschwalbe|Die Küstenseeschwalbe ist der Zugvogel mit dem längsten Zugweg.",
    "de|Küstenseeschwalbe|Ihre Winterquartiere liegen am Rand der antarktischen Packeiszone",
    "de|Küstenseeschwalbe|in der Weddell-See und vor der Antarktis",
    "de|Küstenseeschwalbe|Die Vögel legen auf ihrem Zug von den arktischen Brutplätzen in die antarktischen Überwinterungsgebiete und retour eine Strecke von bis zu 30.000 km zurück",
  ],
  zp1: [
    "de|Das_Abendmahl_(Leonardo_da_Vinci)|Ihr Augpunkt befindet sich in der Schläfe der Christusfigur.",
    "de|Das_Abendmahl_(Leonardo_da_Vinci)|Bei den letzten Restaurierungsarbeiten wurde auch das Loch des Nagels gefunden, von dem aus die Perspektivlinien gespannt wurden.",
    "de|Das_Abendmahl_(Leonardo_da_Vinci)|entstand in den Jahren 1495 bis 1497",
    "de|Das_Abendmahl_(Leonardo_da_Vinci)|im Refektorium des Dominikanerklosters Santa Maria delle Grazie in Mailand",
  ],
};

const animations = [
  {
    id: "a-oktave", scene: "octave", renderer: "svg-scene", category: "music", minAge: 10, difficulty: 2, timing: [0.7, 1.0], quiz: "mu1", predict: [1, 0],
    sources: [wiki("Kammerton"), wiki("Oktave"), wiki("Monochord"), wiki("Klaviatur"), wiki("Hörfläche")],
    de: {
      title: "Eine Oktave ist eine Verdopplung", summary: "Von der schwingenden Saite bis zum Klavier und zu unserem Gehör – Töne, die sich verdoppeln.",
      goal: "Du weißt, was Hertz bedeutet und warum eine Oktave die doppelte Frequenz hat.",
      labels: ["Hertz = Schwingungen pro Sekunde", "Saite", "halbe Saite", "Oktave = doppelte Frequenz", "Klavier: 88 Tasten, 7⅓ Oktaven", "Hörbereich des Menschen: rund 10 Oktaven", "27,5 – 4186", "16 – 20 000", "× 2"],
      steps: [
        ["Ein Ton entsteht, wenn etwas schwingt. Der Kammerton a¹ ist seit 1939 in vielen Ländern auf 440 Hertz festgelegt: Die Saite schwingt 440-mal in der Sekunde.", 8],
        ["Verkürzt man die Saite auf die Hälfte, schwingt sie doppelt so schnell – 880 Hertz. Der Ton klingt gleich, nur eine Oktave höher: Die Frequenzen stehen im Verhältnis 2 zu 1.", 8],
        ["Jede weitere Oktave verdoppelt die Frequenz wieder: 1760, 3520 Hertz. Nach unten halbiert sie sich. Auf dieser Skala ist deshalb jede Oktave ein gleich großer Schritt.", 8],
        ["Die 88 Tasten eines Klaviers umfassen 7⅓ Oktaven: vom tiefsten A mit 27,5 Hertz bis zum höchsten c mit rund 4186 Hertz.", 7],
        ["Unser Gehör reicht noch weiter: von etwa 16 bis höchstens 20 000 Hertz. Das sind rund zehn Oktaven.", 7],
      ],
      predict: ["Die Saite schwingt 440-mal pro Sekunde. Was passiert, wenn man sie auf die Hälfte verkürzt?", "Sie schwingt 880-mal pro Sekunde", "Sie schwingt 220-mal pro Sekunde", "Sie schwingt 440-mal, nur lauter"],
    },
    en: {
      title: "An octave is a doubling", summary: "From a vibrating string to the piano and our hearing – notes that double.",
      goal: "You know what hertz means and why an octave has twice the frequency.",
      labels: ["hertz = vibrations per second", "string", "half the string", "octave = twice the frequency", "piano: 88 keys, 7⅓ octaves", "human hearing: about 10 octaves", "27.5 – 4 186", "16 – 20 000", "× 2"],
      steps: [
        "A note is made when something vibrates. Since 1939 the concert pitch A has been set at 440 hertz in many countries: the string vibrates 440 times a second.",
        "If you shorten the string to half its length, it vibrates twice as fast – 880 hertz. The note sounds the same, just one octave higher: the frequencies have a ratio of 2 to 1.",
        "Every further octave doubles the frequency again: 1,760, 3,520 hertz. Going down, it halves. That is why on this scale every octave is a step of the same size.",
        "The 88 keys of a piano cover 7⅓ octaves: from the lowest A at 27.5 hertz to the highest C at about 4,186 hertz.",
        "Our hearing reaches even further: from about 16 to at most 20,000 hertz. That is about ten octaves.",
      ],
      predict: ["The string vibrates 440 times a second. What happens if you shorten it to half its length?", "It vibrates 880 times a second", "It vibrates 220 times a second", "It vibrates 440 times, just louder"],
    },
  },
  {
    id: "a-zugvogel", scene: "migration", renderer: "svg-scene", category: "animals", minAge: 6, difficulty: 1, timing: [0.7, 1.0], quiz: "zv1", predict: [3, 0],
    sources: [wiki("Küstenseeschwalbe"), wiki("Erdumfang")],
    de: {
      title: "Die längste Reise eines Vogels", summary: "Die Küstenseeschwalbe fliegt jedes Jahr von der Arktis bis vor die Antarktis – und zurück.",
      goal: "Du kannst einordnen, wie weit die Küstenseeschwalbe zieht und warum sich die Reise für sie lohnt.",
      labels: ["86–127 g", "Arktis", "Antarktis", "Kilometer im Jahr", "Erdumfang am Äquator:", "bis zu 30 000 km|fast einmal um die Erde", "Rekord: 96 000 km|in nur 10 Monaten", "8 Monate|ohne Sonnenuntergang", "33–36 cm groß", "Arktis ⇄ Antarktis"],
      steps: [
        ["Die Küstenseeschwalbe ist der Zugvogel mit dem längsten Zugweg. Dabei wird sie nur 33 bis 36 Zentimeter groß und wiegt 86 bis 127 Gramm.", 7],
        ["Im Sommer brütet sie in der Arktis. Danach fliegt sie bis an den Rand des antarktischen Packeises, etwa in die Weddell-See – und dann wieder zurück zu den Brutplätzen.", 8],
        ["Hin und zurück sind das bis zu 30 000 Kilometer – fast einmal um die Erde, die am Äquator rund 40 075 Kilometer misst.", 7],
        ["Mit Sensoren zeigte sich: Einzelne Vögel fliegen sogar bis zu 90 000 Kilometer im Jahr. Ein Vogel von den Farne-Inseln schaffte 96 000 Kilometer in nur zehn Monaten.", 8],
        ["Der Lohn: Sie erlebt den Sommer an beiden Polen. In ihrem Lebensraum geht insgesamt acht Monate lang die Sonne nicht unter – theoretisch kann sie rund um die Uhr jagen.", 8],
      ],
      predict: ["Lange hieß es: bis zu 30 000 Kilometer im Jahr. Wie weit fliegen einzelne Vögel laut Messungen mit Sensoren?", "Bis zu 90 000 Kilometer", "Nur etwa 10 000 Kilometer", "Genau 30 000 Kilometer"],
    },
    en: {
      title: "The longest journey of any bird", summary: "Every year the Arctic tern flies from the Arctic to the edge of Antarctica – and back.",
      goal: "You can judge how far the Arctic tern migrates and why the journey is worth it.",
      labels: ["86–127 g", "Arctic", "Antarctica", "kilometres in one year", "Around the equator:", "up to 30 000 km|almost once around the Earth", "record: 96 000 km|in only 10 months", "8 months|without sunset", "33–36 cm long", "Arctic ⇄ Antarctica"],
      steps: [
        "The Arctic tern is the migratory bird with the longest migration. Yet it is only 33 to 36 centimetres long and weighs 86 to 127 grams.",
        "In summer it breeds in the Arctic. Then it flies to the edge of the Antarctic pack ice, for example the Weddell Sea – and then back to its breeding grounds.",
        "There and back, that is up to 30,000 kilometres – almost once around the Earth, which measures about 40,075 kilometres at the equator.",
        "Sensors showed that some birds even fly up to 90,000 kilometres a year. One bird from the Farne Islands covered 96,000 kilometres in only ten months.",
        "The reward: it gets summer at both poles. Where it lives, the sun does not set for a total of eight months – in theory it can hunt around the clock.",
      ],
      predict: ["For a long time people said: up to 30,000 kilometres a year. How far do some birds fly according to sensor measurements?", "Up to 90,000 kilometres", "Only about 10,000 kilometres", "Exactly 30,000 kilometres"],
    },
  },
  {
    id: "a-perspektive", scene: "perspective", renderer: "svg-scene", category: "art", minAge: 10, difficulty: 2, timing: [0.7, 1.0], quiz: "zp1", predict: [2, 0],
    sources: [wiki("Fluchtpunkt"), wiki("Zentralperspektive"), wiki("Dreifaltigkeit_(Masaccio)"), wiki("Leon_Battista_Alberti"), wiki("Das_Abendmahl_(Leonardo_da_Vinci)")],
    de: {
      title: "Wie kommt die Tiefe ins Bild?", summary: "Horizont, Fluchtpunkt, kleiner werdende Säulen – und der Nagel in Leonardos „Abendmahl“.",
      goal: "Du kannst erklären, wie die Zentralperspektive auf einer flachen Fläche Raum vortäuscht.",
      labels: ["Horizont", "Fluchtpunkt", "gleich groß", "Masaccio · Florenz, 1425–1428", "Alberti: „De pictura“, 1435/36", "Leonardo · Mailand, 1495–1497", "Nagelloch"],
      steps: [
        ["Wie malt man Tiefe auf eine flache Wand? Bei der Zentralperspektive beginnt alles mit dem Horizont, einer waagerechten Linie im Bild.", 7],
        ["Linien, die in Wirklichkeit parallel in die Tiefe laufen – etwa Fugen im Fußboden –, treffen sich im Bild in einem Punkt: dem Fluchtpunkt. Er liegt auf dem Horizont.", 8],
        ["Gleich große Dinge werden mit der Entfernung kleiner und rücken näher an den Horizont. Auch die Linie über ihren Spitzen läuft zum Fluchtpunkt.", 8],
        ["In Florenz malte Masaccio zwischen 1425 und 1428 seine „Dreifaltigkeit“ – als einer der ersten Künstler mit Zentralperspektive. 1435/36 schrieb Leon Battista Alberti in „De pictura“ über Geometrie, Optik und perspektivische Malerei.", 9],
        ["Leonardo da Vinci malte sein „Abendmahl“ von 1495 bis 1497 in Mailand. Alle Linien des Raums laufen zur Schläfe von Jesus – dort fand man bei der Restaurierung das Loch eines Nagels, von dem aus die Linien gespannt wurden.", 9],
      ],
      predict: ["Zwei gleich große Säulen stehen hintereinander. Wie malt man die hintere?", "Kleiner und näher am Horizont", "Genauso groß, nur weiter oben", "Größer, damit man sie noch sieht"],
    },
    en: {
      title: "How does depth get into a picture?", summary: "Horizon, vanishing point, shrinking columns – and the nail in Leonardo's “Last Supper”.",
      goal: "You can explain how central perspective fakes space on a flat surface.",
      labels: ["horizon", "vanishing point", "the same size", "Masaccio · Florence, 1425–1428", "Alberti: “De pictura”, 1435/36", "Leonardo · Milan, 1495–1497", "nail hole"],
      steps: [
        "How do you paint depth on a flat wall? In central perspective, everything starts with the horizon, a horizontal line in the picture.",
        "Lines that in reality run parallel into the depth – such as joints in a floor – meet in the picture at one point: the vanishing point. It lies on the horizon.",
        "Things of the same size get smaller with distance and move closer to the horizon. The line over their tops also runs to the vanishing point.",
        "In Florence, Masaccio painted his “Holy Trinity” between 1425 and 1428 – as one of the first artists to use central perspective. In 1435/36 Leon Battista Alberti wrote in “De pictura” about geometry, optics and painting in perspective.",
        "Leonardo da Vinci painted his “Last Supper” in Milan from 1495 to 1497. All the lines of the room run to Jesus's temple – during the restoration, the hole of a nail was found there, from which the lines were stretched.",
      ],
      predict: ["Two columns of the same size stand one behind the other. How do you paint the one at the back?", "Smaller and closer to the horizon", "Just as big, only higher up", "Bigger, so that you can still see it"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
