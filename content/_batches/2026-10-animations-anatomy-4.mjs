// Content batch (24.10.2026): how the knee works (3D scene "knee", real model from Z-Anatomy). Every statement is taken
// from the linked articles, word-for-word evidence below. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-anatomy-4.mjs   → the question
//   node content/_batches/2026-10-animations-anatomy-4.mjs                                   → the animation (idempotent)
//
// Evidence (de.wikipedia.org):
//   Kniegelenk: "befindliche größte Gelenk der Säugetiere" · "Der Oberschenkelknochen (Femur), das Schienbein (Tibia) und die
//     Kniescheibe (Patella) bilden dabei die knöchernen Gelenkkörper" · "Da die miteinander in Verbindung stehenden
//     (artikulierenden) Gelenkflächen nicht genau aufeinander passen, wird diese „Ungleichheit“ (Inkongruenz) durch
//     halbmondförmige Faserknorpelscheiben, die Menisken ausgeglichen" · "Eine weitere Aufgabe der Menisken besteht in der
//     Vergrößerung der Kontaktfläche zwischen Schienbein und Oberschenkelknochen" · "tragen diese einen wesentlichen Teil der
//     Last" · "Die Kniescheibe gleitet bei Beugung und Streckung in der für sie vorgesehenen Rinne"
//   Kreuzband: "Sie kreuzen sich im Knie zwischen den Gelenkknorren und sichern zusammen mit dem übrigen Bandapparat die
//     Stabilisierung des Gelenks bei jeder Bewegung"
//   Kniescheibe: "Die Kniescheibe fungiert als großes Sesambein in der Sehne des Musculus quadriceps femoris (vierköpfiger
//     Oberschenkelmuskel)" · "Sie schützt das Kniegelenk und vervielfacht die Kraftentwicklung des Quadrizeps durch die
//     Verlängerung des Hebelarmes"
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-24";
export const verification = "ai_checked";

export const questions = [
  ["qa-knie", "science", 1, 10, null, "Wie heißen die halbmondförmigen Knorpelscheiben im Kniegelenk?", ["Menisken", "Bandscheiben", "Kreuzbänder", "Sesambeine"], 0, "Die Menisken sind halbmondförmige Scheiben aus Faserknorpel. Sie gleichen aus, dass die Gelenkflächen von Oberschenkelknochen und Schienbein nicht genau aufeinander passen, und tragen einen wesentlichen Teil der Last.", "Kniegelenk", "What are the crescent-shaped discs of cartilage in the knee joint called?", ["Menisci", "Intervertebral discs", "Cruciate ligaments", "Sesamoid bones"], "The menisci are crescent-shaped discs of fibrocartilage. They make up for the joint surfaces of the thigh bone and the shin bone not fitting exactly, and they carry a substantial part of the load.", ["Anatomie", "Körper"]],
];

const animations = [
  {
    id: "a-knie", scene: "knee", category: "science", timing: [0.7, 1], sources: [wiki("Kniegelenk"), wiki("Kreuzband"), wiki("Kniescheibe")], quiz: "qa-knie", predict: [3, 0],
    de: {
      title: "Wie das Knie funktioniert", summary: "Drei Knochen, zwei Knorpelscheiben, zwei gekreuzte Bänder – und ein Hebel.",
      goal: "Du kannst erklären, wozu Menisken, Kreuzbänder und Kniescheibe im Kniegelenk da sind.",
      labels: ["Oberschenkelknochen", "Schienbein", "Kniescheibe", "Menisken", "Kreuzbänder", "Wadenbein", "Menisken gleichen aus und tragen Last", "Kreuzbänder sichern das Gelenk", "Vierköpfiger Oberschenkelmuskel", "Längerer Hebelarm: mehr Kraft"],
      steps: [
        ["Das Kniegelenk ist das größte Gelenk der Säugetiere. Oberschenkelknochen, Schienbein und Kniescheibe bilden seine knöchernen Gelenkkörper.", 8],
        ["Die Gelenkflächen von Oberschenkelknochen und Schienbein passen nicht genau aufeinander. Das gleichen die Menisken aus, zwei halbmondförmige Scheiben aus Faserknorpel. Sie vergrößern die Kontaktfläche und tragen einen wesentlichen Teil der Last.", 10],
        ["Im Inneren kreuzen sich die beiden Kreuzbänder. Zusammen mit den übrigen Bändern sichern sie das Gelenk bei jeder Bewegung – beim Beugen wie beim Strecken.", 9],
        ["Die Kniescheibe ist ein großes Sesambein in der Sehne des vierköpfigen Oberschenkelmuskels. Beim Beugen und Strecken gleitet sie in einer Rinne. Sie schützt das Gelenk und vervielfacht die Kraft des Muskels, weil sie seinen Hebelarm verlängert.", 11],
      ],
      predict: ["Die Kniescheibe sitzt in der Sehne des großen Oberschenkelmuskels. Wozu ist sie dort gut?", "Sie verlängert den Hebelarm – der Muskel wirkt kräftiger", "Sie stellt die Gelenkschmiere her", "Sie verbindet Oberschenkel und Unterschenkel fest miteinander"],
    },
    en: {
      title: "How the knee works", summary: "Three bones, two discs of cartilage, two crossed ligaments – and a lever.",
      goal: "You can explain what the menisci, the cruciate ligaments and the kneecap are for in the knee joint.",
      labels: ["Thigh bone", "Shin bone", "Kneecap", "Menisci", "Cruciate ligaments", "Fibula", "Menisci even out and carry load", "Cruciate ligaments secure the joint", "Four-headed thigh muscle", "Longer lever arm: more force"],
      steps: [
        "The knee joint is the largest joint of mammals. The thigh bone, the shin bone and the kneecap form its bony parts.",
        "The joint surfaces of the thigh bone and the shin bone do not fit together exactly. The menisci make up for this: two crescent-shaped discs of fibrocartilage. They enlarge the contact area and carry a substantial part of the load.",
        "Inside, the two cruciate ligaments cross. Together with the other ligaments they secure the joint during every movement – when bending as well as when straightening.",
        "The kneecap is a large sesamoid bone in the tendon of the four-headed thigh muscle. When the knee bends and straightens it glides in a groove. It protects the joint and multiplies the muscle's force by lengthening its lever arm.",
      ],
      predict: ["The kneecap sits in the tendon of the big thigh muscle. What is it good for there?", "It lengthens the lever arm – the muscle acts more strongly", "It produces the joint fluid", "It firmly connects the thigh and the lower leg"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
