// Content batch (25.10.2026): the Pythagorean theorem to watch (3D scene "pythagoras"). Every statement is taken from the
// linked article, word-for-word evidence below; the arithmetic (9 + 16 = 25, 36 + 64 = 100) is plain calculation. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-math-1.mjs   → the question
//   node content/_batches/2026-10-animations-math-1.mjs                                   → the animation (idempotent)
//
// Evidence (de.wikipedia.org, Satz des Pythagoras):
//   "die Längen der am rechten Winkel anliegenden Seiten, der Katheten" · "die Länge der dem rechten Winkel gegenüberliegenden
//   Seite, der Hypotenuse" · "In geometrischer Deutung ist demnach in einem rechtwinkligen Dreieck die Summe der Flächen der
//   beiden Quadrate über den Katheten gleich der Fläche des Quadrats über der Hypotenuse." · "am Beispiel des rechtwinkligen
//   Dreiecks (gougu) mit den Seiten 3, 4 und 5" · "Eine einfache und wichtige Anwendung des Satzes ist, aus zwei bekannten Seiten
//   eines rechtwinkligen Dreiecks die dritte zu berechnen." · "Die Umkehrung des Satzes kann dazu verwendet werden, zu
//   überprüfen, ob ein gegebenes Dreieck rechtwinklig ist." · "Die Aussage des Satzes war schon lange vor der Zeit des Pythagoras
//   in Babylon und Indien bekannt" · "Für den Satz sind mehrere hundert Beweise bekannt"
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-25";
export const verification = "ai_checked";

export const questions = [
  ["qa-pythagoras", "math", 1, 10, null, "Ein rechtwinkliges Dreieck hat Katheten von 3 cm und 4 cm. Wie lang ist die Hypotenuse?", ["5 cm", "7 cm", "6 cm", "12 cm"], 0, "Nach dem Satz des Pythagoras gilt a² + b² = c²: 3² + 4² = 9 + 16 = 25 = 5². Die Hypotenuse ist also 5 cm lang.", "Satz_des_Pythagoras", "A right-angled triangle has legs of 3 cm and 4 cm. How long is the hypotenuse?", ["5 cm", "7 cm", "6 cm", "12 cm"], "By the Pythagorean theorem a² + b² = c²: 3² + 4² = 9 + 16 = 25 = 5². So the hypotenuse is 5 cm long.", ["Geometrie", "Mathe"]],
];

const animations = [
  {
    id: "a-pythagoras", scene: "pythagoras", category: "math", difficulty: 1, timing: [0.7, 1], sources: [wiki("Satz_des_Pythagoras")], quiz: "qa-pythagoras", predict: [3, 0],
    de: {
      title: "Der Satz des Pythagoras zum Anfassen", summary: "Zwei kleine Quadrate füllen zusammen genau ein großes – in jedem rechtwinkligen Dreieck.",
      goal: "Du kannst den Satz des Pythagoras erklären, mit ihm eine Seite berechnen und prüfen, ob ein Dreieck rechtwinklig ist.",
      labels: ["Kathete a", "Kathete b", "Hypotenuse c", "Rechter Winkel", "a² = 9", "b² = 16", "c² = 25", "9 + 16 = 25", "36 + 64 = 100: rechtwinklig"],
      steps: [
        ["In einem rechtwinkligen Dreieck heißen die beiden Seiten am rechten Winkel Katheten. Die Seite gegenüber dem rechten Winkel ist die Hypotenuse – hier mit den Längen 3, 4 und 5.", 9],
        ["Über jede Seite legen wir ein Quadrat. Der Satz des Pythagoras sagt: Die Flächen der beiden Quadrate über den Katheten sind zusammen genauso groß wie die Fläche des Quadrats über der Hypotenuse – kurz a² + b² = c².", 10],
        ["Hier zählt man nach: 9 Kästchen und 16 Kästchen – zusammen 25. Genau so viele passen in das Quadrat über der Hypotenuse, kein Kästchen bleibt übrig.", 10],
        ["Mit dem Satz lässt sich aus zwei bekannten Seiten die dritte berechnen – und umgekehrt prüfen, ob ein Dreieck rechtwinklig ist. Bekannt war die Aussage schon lange vor Pythagoras in Babylon und Indien; heute kennt man mehrere hundert Beweise.", 11],
      ],
      predict: ["Ein Dreieck hat die Seiten 6, 8 und 10. Ist es rechtwinklig?", "Ja – 36 + 64 = 100", "Nein – dafür müsste 6 + 8 = 10 sein", "Das lässt sich nicht prüfen"],
    },
    en: {
      title: "The Pythagorean theorem to watch", summary: "Two small squares together fill exactly one big one – in every right-angled triangle.",
      goal: "You can explain the Pythagorean theorem, use it to work out a side and check whether a triangle is right-angled.",
      labels: ["Leg a", "Leg b", "Hypotenuse c", "Right angle", "a² = 9", "b² = 16", "c² = 25", "9 + 16 = 25", "36 + 64 = 100: right-angled"],
      steps: [
        "In a right-angled triangle the two sides at the right angle are called the legs. The side opposite the right angle is the hypotenuse – here with the lengths 3, 4 and 5.",
        "We put a square on each side. The Pythagorean theorem says: the areas of the two squares on the legs together are exactly as large as the area of the square on the hypotenuse – in short a² + b² = c².",
        "Count them here: 9 little squares and 16 little squares – 25 together. Exactly that many fit into the square on the hypotenuse, with none left over.",
        "With the theorem you can work out the third side from two known sides – and the other way round check whether a triangle is right-angled. The statement was known in Babylon and India long before Pythagoras; today several hundred proofs are known.",
      ],
      predict: ["A triangle has the sides 6, 8 and 10. Is it right-angled?", "Yes – 36 + 64 = 100", "No – for that 6 + 8 would have to be 10", "That cannot be checked"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
