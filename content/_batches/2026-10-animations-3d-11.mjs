// Content batch (19.10.2026): a new 3D animation – ebb and flow – with its check question. AI-checked.
// Facts from "Gezeiten": twice a day, period about 24 h 50 min for the Moon, spring tides at new and full moon,
// neap tides at half moon, the Sun's tidal force on average about 46 % of the Moon's.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-3d-11.mjs   → the question
//   node content/_batches/2026-10-animations-3d-11.mjs                                   → the animation (idempotent)
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-19";
export const verification = "ai_checked";

export const questions = [
  ["qa-gezeiten", "earth", 2, 13, null, "Warum gibt es an den meisten Küsten zweimal am Tag Hochwasser?", ["Weil sich die Erde unter zwei Flutbergen hindurchdreht", "Weil der Mond zweimal am Tag um die Erde läuft", "Weil die Sonne das Wasser zweimal erwärmt", "Weil der Wind zweimal am Tag dreht"], 0, "Die Anziehung des Mondes zieht die Meere zu zwei Flutbergen auseinander – einem auf der Seite zum Mond und einem auf der abgewandten Seite. Bei einer Drehung der Erde kommt ein Ort an beiden vorbei.", "Gezeiten", "Why do most coasts have high tide twice a day?", ["Because the Earth turns underneath two tidal bulges", "Because the Moon goes round the Earth twice a day", "Because the Sun warms the water twice", "Because the wind turns twice a day"], "The Moon's pull stretches the oceans into two bulges – one on the side facing the Moon and one on the far side. As the Earth turns once, a place passes both.", ["Meer", "Mond"]],
];

const animations = [
  {
    id: "a-gezeiten", scene: "tides", category: "earth", timing: [0.7, 1.0], sources: [wiki("Gezeiten")], quiz: "qa-gezeiten", predict: [2, 0],
    de: {
      title: "Wie Ebbe und Flut entstehen", summary: "Der Mond zieht an den Meeren – und die Erde dreht sich darunter hindurch.",
      goal: "Du kannst erklären, warum es meist zweimal am Tag Hochwasser gibt und wann die Flut besonders hoch ausfällt.",
      labels: ["Mond", "Flutberg zum Mond", "Flutberg auf der abgewandten Seite", "Hochwasser", "Niedrigwasser", "Springtide: Sonne und Mond in einer Linie", "Nipptide: im rechten Winkel", "Sonne", "Anziehung des Mondes"],
      steps: [
        ["Der Mond zieht mit seiner Schwerkraft an der Erde und an ihren Meeren. Auf der Seite, die ihm zugewandt ist, zieht er etwas stärker – dort wölbt sich das Wasser zu einem Flutberg auf. (Die Höhe ist hier stark übertrieben.)", 9],
        ["Auch auf der abgewandten Seite entsteht ein Flutberg. Dort zieht der Mond etwas schwächer als im Durchschnitt. Der Unterschied streckt die Meere nach beiden Seiten.", 9],
        ["Die Erde dreht sich unter den beiden Flutbergen hindurch. Ein Hafen kommt deshalb an beiden vorbei: zweimal Hochwasser und zweimal Niedrigwasser – und weil der Mond weiterwandert, rund 24 Stunden und 50 Minuten für eine volle Runde.", 10],
        ["Auch die Sonne zieht an den Meeren, im Mittel mit knapp der Hälfte der Kraft des Mondes. Stehen Sonne und Mond in einer Linie – bei Neumond und Vollmond –, addieren sich ihre Wirkungen zur Springtide. Bei Halbmond stehen sie im rechten Winkel: Es gibt eine kleine Nipptide.", 10],
      ],
      predict: ["Gleich dreht sich die Erde unter den Flutbergen hindurch. Wie oft hat ein Hafen dann ungefähr an einem Tag Hochwasser?", "Zweimal", "Einmal", "Viermal"],
    },
    en: {
      title: "How ebb and flow happen", summary: "The Moon pulls on the oceans – and the Earth turns underneath.",
      goal: "You can explain why there is usually high tide twice a day and when the tide is especially high.",
      labels: ["Moon", "bulge facing the Moon", "bulge on the far side", "high tide", "low tide", "spring tide: Sun and Moon in a line", "neap tide: at a right angle", "Sun", "pull of the Moon"],
      steps: [
        "The Moon's gravity pulls on the Earth and its oceans. On the side facing it, it pulls a little harder – there the water rises into a bulge. (The height is greatly exaggerated here.)",
        "A bulge also forms on the far side. There the Moon pulls a little less than on average. The difference stretches the oceans out to both sides.",
        "The Earth turns underneath the two bulges. So a harbour passes both: two high tides and two low tides – and because the Moon moves on, a full round takes about 24 hours and 50 minutes.",
        "The Sun pulls on the oceans too, on average with just under half the force of the Moon. When Sun and Moon are in a line – at new and full moon – their effects add up to a spring tide. At half moon they stand at a right angle: a small neap tide.",
      ],
      predict: ["In a moment the Earth turns underneath the bulges. Roughly how often does a harbour then have high tide in a day?", "Twice", "Once", "Four times"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
