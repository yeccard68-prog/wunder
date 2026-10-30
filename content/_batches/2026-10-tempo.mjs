// Content batch (30.10.2026): motion graphics "Wie schnell sind wir unterwegs?" (a-tempo, scene speeds) and its check
// question. Speeds quoted from: Verkehrsflugzeug "Boeing 777 … mit 896 km/h" · Erdrotation "einer Umfangsgeschwindigkeit
// von 465,1 m/s" (×3.6 ≈ 1670 km/h) · Erde "Die Bahngeschwindigkeit der Erde beträgt im Mittel 29,78 km/s" (≈ 107,000
// km/h) · Milchstraße "benötigt sie 220 bis 240 Millionen Jahre, was einer Bahngeschwindigkeit von etwa 220 km/s
// entspricht" (≈ 800,000 km/h) and "Neuere Messungen haben eine Umlaufgeschwindigkeit von ca. 267 km/s (961.200 km/h)
// ergeben."
//   node scripts/content/verify-evidence.mjs content/_batches/2026-10-tempo.mjs
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-tempo.mjs   → the question
//   node content/_batches/2026-10-tempo.mjs                                   → the animation (idempotent)
import { pathToFileURL } from "node:url";
import { balance } from "./_balance.mjs";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-30";
export const verification = "ai_checked";

// [id, category, difficulty, minAge, maxAge, question, options, correct, explanation, wiki, enQuestion, enOptions, enExplanation, tags]
export const questions = balance([
  ["tp1", "science", 2, 10, null, "Wie schnell bewegt sich die Erde im Mittel auf ihrer Bahn um die Sonne?", ["Rund 30 Meter pro Sekunde", "Rund 30 Kilometer pro Sekunde", "Rund 300 Kilometer pro Sekunde", "Rund 3.000 Kilometer pro Sekunde"], 1,
    "Die Bahngeschwindigkeit der Erde beträgt im Mittel 29,78 km/s – so legt sie die Länge ihres eigenen Durchmessers in gut sieben Minuten zurück.", "Erde",
    "On average, how fast does the Earth move along its orbit around the Sun?", ["About 30 metres per second", "About 30 kilometres per second", "About 300 kilometres per second", "About 3,000 kilometres per second"],
    "The Earth's orbital speed averages 29.78 km/s – so it covers the length of its own diameter in just over seven minutes.", ["Weltraum", "Erde"]],
]);

export const evidence = {
  tp1: ["de|Erde|Die Bahngeschwindigkeit der Erde beträgt im Mittel 29,78 km/s, im Perihel 30,29 km/s und im Aphel 29,29 km/s; somit legt die Erde eine Strecke der Länge ihres Durchmessers in gut sieben Minuten zurück."],
};

const animations = [
  {
    id: "a-tempo", scene: "speeds", renderer: "svg-scene", category: "science", minAge: 10, difficulty: 1, timing: [0.7, 1.0], quiz: "tp1", predict: [3, 2],
    sources: [wiki("Verkehrsflugzeug"), wiki("Erdrotation"), wiki("Erde"), wiki("Milchstraße")],
    de: {
      title: "Wie schnell sind wir unterwegs?", summary: "Flugzeug, Erddrehung, Erdbahn, Milchstraße – wir rasen, ohne es zu merken.",
      goal: "Du kannst einordnen, wie schnell sich die Erde dreht, um die Sonne läuft und mit der Sonne um das Zentrum der Milchstraße zieht.",
      labels: ["Flugzeug: 896 km/h", "Erddrehung am Äquator: rund 1670 km/h", "Erde um die Sonne: rund 107.000 km/h", "Sonne um die Milchstraße: rund 800.000 km/h", "km/h", "logarithmisch: jede Linie zehnmal mehr"],
      steps: [
        ["Ein Verkehrsflugzeug wie die Boeing 777 fliegt mit rund 896 km/h – schnell, aber nichts gegen das, was wir alle gerade tun.", 7],
        ["Die Erde dreht sich: Am Äquator bewegt sich der Boden mit rund 465 Metern pro Sekunde – das sind etwa 1670 km/h, fast doppelt so schnell wie das Flugzeug.", 9],
        ["Gleichzeitig läuft die Erde um die Sonne: im Mittel mit 29,78 Kilometern pro Sekunde, also rund 107.000 km/h. In gut sieben Minuten legt sie die Länge ihres eigenen Durchmessers zurück.", 9],
        ["Und die Sonne nimmt uns mit auf ihre Bahn um das Zentrum der Milchstraße: mit etwa 220 Kilometern pro Sekunde, rund 800.000 km/h – neuere Messungen ergeben sogar rund 267 km/s. Für eine Runde braucht sie trotzdem 220 bis 240 Millionen Jahre.", 10],
      ],
      predict: ["Die Erde läuft mit rund 107.000 km/h um die Sonne. Wie schnell zieht die Sonne mit uns um das Zentrum der Milchstraße?", "Rund 10.000 km/h", "Rund 100.000 km/h", "Rund 800.000 km/h"],
    },
    en: {
      title: "How fast are we moving?", summary: "Aeroplane, the Earth's spin, its orbit, the Milky Way – we race along without noticing.",
      goal: "You can place how fast the Earth spins, orbits the Sun and travels with the Sun around the centre of the Milky Way.",
      labels: ["aeroplane: 896 km/h", "Earth's spin at the equator: about 1,670 km/h", "Earth around the Sun: about 107,000 km/h", "Sun around the Milky Way: about 800,000 km/h", "km/h", "log scale: each line ten times more"],
      steps: [
        "An airliner such as the Boeing 777 flies at about 896 km/h – fast, but nothing compared with what all of us are doing right now.",
        "The Earth spins: at the equator the ground moves at about 465 metres per second – that is about 1,670 km/h, almost twice as fast as the aeroplane.",
        "At the same time the Earth orbits the Sun: at 29.78 kilometres per second on average, about 107,000 km/h. In just over seven minutes it covers the length of its own diameter.",
        "And the Sun takes us along on its path around the centre of the Milky Way: at about 220 kilometres per second, about 800,000 km/h – newer measurements even give about 267 km/s. Yet one lap still takes it 220 to 240 million years.",
      ],
      predict: ["The Earth orbits the Sun at about 107,000 km/h. How fast does the Sun carry us around the centre of the Milky Way?", "About 10,000 km/h", "About 100,000 km/h", "About 800,000 km/h"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
