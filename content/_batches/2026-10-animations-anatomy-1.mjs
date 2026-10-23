// Content batch (23.10.2026): the first anatomy animation besides the heart – how biceps and triceps move the forearm.
// Every statement is taken from the linked articles (biceps = "Armbeuger"; triceps = "der einzige Strecker des
// Ellenbogens"; biceps and triceps as antagonists with opposite effects; a muscle can only contract, not stretch itself back). AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-anatomy-1.mjs   → the question
//   node content/_batches/2026-10-animations-anatomy-1.mjs                                   → the animation (idempotent)
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-23";
export const verification = "ai_checked";

export const questions = [
  ["qa-arm", "science", 1, 10, null, "Welcher Muskel streckt den Arm im Ellenbogen wieder?", ["Der Trizeps", "Der Bizeps", "Der Deltamuskel", "Die Wadenmuskulatur"], 0, "Der Trizeps auf der Rückseite des Oberarms ist der einzige Strecker des Ellenbogens. Sein Gegenspieler, der Bizeps, beugt den Arm.", "Musculus_triceps_brachii", "Which muscle straightens the arm at the elbow again?", ["The triceps", "The biceps", "The deltoid", "The calf muscles"], "The triceps on the back of the upper arm is the only extensor of the elbow. Its counterpart, the biceps, bends the arm.", ["Anatomie", "Körper"]],
];

const animations = [
  {
    id: "a-arm", scene: "arm", category: "science", timing: [0.7, 1.3], sources: [wiki("Musculus_biceps_brachii"), wiki("Musculus_triceps_brachii"), wiki("Muskulatur"), wiki("Bewegungsapparat")], quiz: "qa-arm", predict: [2, 1],
    de: {
      title: "Wie Muskeln den Arm bewegen", summary: "Zwei Muskeln, ein Gelenk: Der eine beugt den Arm, der andere streckt ihn wieder.",
      goal: "Du kannst erklären, was Bizeps und Trizeps tun und warum sie Gegenspieler heißen.",
      labels: ["Oberarmknochen", "Unterarm", "Ellenbogengelenk", "Bizeps", "Trizeps", "Bizeps zieht – der Arm beugt sich", "Trizeps zieht – der Arm streckt sich", "Muskeln ziehen nur – darum arbeiten sie paarweise"],
      steps: [
        ["Oberarm und Unterarm treffen sich im Ellenbogengelenk. Bewegt werden sie von Muskeln: Vorne am Oberarm liegt der Bizeps, auf der Rückseite der Trizeps.", 8],
        ["Der Bizeps heißt auch Armbeuger. Er zieht sich zusammen, zieht den Unterarm nach oben – und der Arm beugt sich.", 8],
        ["Zum Strecken braucht es den anderen Muskel: Der Trizeps ist der einzige Strecker des Ellenbogens. Er zieht den gebeugten Unterarm wieder nach hinten.", 9],
        ["Ein Muskel kann sich nur zusammenziehen, aber nicht selbst wieder dehnen. Dafür braucht er einen Muskel auf der anderen Seite des Gelenks. Darum sind Bizeps und Trizeps Gegenspieler mit entgegengesetzter Wirkung.", 10],
      ],
      predict: ["Der Arm ist gebeugt. Welcher Muskel muss jetzt arbeiten, damit er sich wieder streckt?", "Der Bizeps", "Der Trizeps", "Gar keiner – der Arm fällt von selbst"],
    },
    en: {
      title: "How muscles move the arm", summary: "Two muscles, one joint: one bends the arm, the other straightens it again.",
      goal: "You can explain what the biceps and triceps do and why they are called antagonists.",
      labels: ["Upper arm bone", "Forearm", "Elbow joint", "Biceps", "Triceps", "Biceps pulls – the arm bends", "Triceps pulls – the arm straightens", "Muscles only pull – so they work in pairs"],
      steps: [
        "The upper arm and the forearm meet at the elbow joint. Muscles move them: at the front of the upper arm lies the biceps, on the back the triceps.",
        "The biceps is also called the arm flexor. It contracts, pulls the forearm up – and the arm bends.",
        "To straighten it, the other muscle is needed: the triceps is the only extensor of the elbow. It pulls the bent forearm back again.",
        "A muscle can only contract – it cannot stretch itself back. For that it needs a muscle on the other side of the joint. That is why biceps and triceps are antagonists with opposite effects.",
      ],
      predict: ["The arm is bent. Which muscle has to work now so that it straightens again?", "The biceps", "The triceps", "Neither – the arm drops by itself"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
