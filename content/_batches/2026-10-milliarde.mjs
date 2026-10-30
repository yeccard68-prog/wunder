// Content batch (30.10.2026): motion graphics "Wie groß ist eine Milliarde?" (a-milliarde, components/anim/scenes.tsx
// Seconds). The durations are arithmetic (a year of 365.25 days): 10^6 s ≈ 11.6 days, 10^9 s ≈ 31.7 years,
// 10^12 s ≈ 31,700 years. The words are quoted from:
//   Milliarde: "Eine Milliarde ist gleich tausend Millionen." · "Im amerikanischen Sprachraum heißt Milliarde billion"
//   Billion: "steht im deutschsprachigen und kontinentaleuropäischen Sprachgebrauch für die Zahl 1000 Milliarden"
//   · "Eine Billion auf Deutsch entspricht im englischsprachigen Raum einer Trillion."
// Check question: the existing mf3 ("Eine Million Sekunden sind weniger als zwei Wochen.").
//   node content/_batches/2026-10-milliarde.mjs   → merges the animation (idempotent)
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const TODAY = "2026-10-30";
export const verification = "ai_checked";

const animations = [
  {
    id: "a-milliarde", scene: "seconds", renderer: "svg-scene", category: "math", minAge: 10, difficulty: 1, timing: [0.7, 1.0], quiz: "mf3", predict: [1, 1],
    sources: [wiki("Milliarde"), wiki("Billion")],
    de: {
      title: "Wie groß ist eine Milliarde?", summary: "Eine Million, eine Milliarde, eine Billion Sekunden – drei Wörter, die fast gleich klingen und Welten auseinander liegen.",
      goal: "Du kannst einschätzen, wie groß eine Million, eine Milliarde und eine Billion sind, und erklären, warum jede Stufe tausendmal größer ist.",
      labels: ["Sekunden", "eine Million", "eine Milliarde", "eine Billion", "≈ 11,6 Tage", "≈ 31,7 Jahre", "≈ 31.700 Jahre", "Tage", "Jahre", "× 1000"],
      steps: [
        ["Wie lange dauert eine Million Sekunden? Zählt man sie ab, sind es etwa 11,6 Tage – nicht einmal zwei Wochen.", 8],
        ["Eine Milliarde ist tausendmal so viel: tausend Millionen. In Sekunden sind das rund 31,7 Jahre – die knapp zwei Wochen von eben schrumpfen zu einem winzigen Strich.", 9],
        ["Eine Billion – im Deutschen tausend Milliarden – ist wieder tausendmal so viel: rund 31.700 Jahre. Auf Englisch heißt sie übrigens „trillion“, und die deutsche Milliarde heißt „billion“.", 10],
        ["Jede Stufe ist tausendmal größer: Aus knapp zwei Wochen werden gut 30 Jahre, daraus mehr als 30.000 Jahre. Million, Milliarde und Billion klingen ähnlich – und liegen doch Welten auseinander.", 9],
      ],
      predict: ["Eine Million Sekunden sind knapp zwei Wochen. Wie lange dauert eine Milliarde Sekunden?", "Rund 4 Monate", "Rund 32 Jahre", "Rund 3.000 Jahre"],
    },
    en: {
      title: "How big is a billion?", summary: "A million, a billion, a trillion seconds – three words that sound almost the same and are worlds apart.",
      goal: "You can judge how big a million, a billion and a trillion are, and explain why each step is a thousand times bigger.",
      labels: ["seconds", "one million", "one billion", "one trillion", "≈ 11.6 days", "≈ 31.7 years", "≈ 31,700 years", "days", "years", "× 1000"],
      steps: [
        "How long is a million seconds? Counted out, it is about 11.6 days – not even two weeks.",
        "A billion is a thousand times as much: a thousand millions. In seconds that is about 31.7 years – the nearly two weeks from before shrink to a tiny line.",
        "A trillion – a thousand billions – is again a thousand times as much: about 31,700 years. In German, by the way, a billion is called „Milliarde“ and a trillion „Billion“.",
        "Each step is a thousand times bigger: nearly two weeks become just over 30 years, and those become more than 30,000 years. Million, billion and trillion sound alike – and yet are worlds apart.",
      ],
      predict: ["A million seconds is nearly two weeks. How long is a billion seconds?", "About 4 months", "About 32 years", "About 3,000 years"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
