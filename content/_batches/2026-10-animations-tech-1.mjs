// Content batch (24.10.2026): how a touchscreen detects a touch (3D scene "touchscreen"). Every statement is taken from
// the linked article, word-for-word evidence below. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-tech-1.mjs   → the question
//   node content/_batches/2026-10-animations-tech-1.mjs                                   → the animation (idempotent)
//
// Evidence (de.wikipedia.org, Touchscreen, section "Projiziert-kapazitive Touchscreens"):
//   "nutzt zwei Ebenen mit einem leitfähigen Muster (meistens Streifen oder Rauten). Die Ebenen sind voneinander isoliert
//   angebracht. Eine Ebene dient als Sensor, die andere übernimmt die Aufgabe des Treibers. Befindet sich ein Finger am
//   Kreuzungspunkt zweier Streifen, so ändert sich die Kapazität des Kondensators, und es kommt ein größeres Signal am
//   Empfängerstreifen an." · "dass der Sensor auf der Rückseite des Deckglases angebracht werden kann" · "Ferner ist die
//   Erkennung von Gesten und mehreren Berührungen (also Multi-Touch) möglich. Diese Touch-Variante wird inzwischen von
//   praktisch allen Smartphones und Tablet-Computern verwendet." · "Kapazitive Touchscreens können nur mit dem bloßen Finger
//   (ob der Touchscreen nun mit kalten oder warmen Fingern berührt wird, spielt keine Rolle), leitfähigen Eingabestiften oder
//   speziell angefertigten Hilfsmitteln, nicht aber mit einem herkömmlichen Eingabestift oder dicken Handschuhen bedient werden."
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-24";
export const verification = "ai_checked";

export const questions = [
  ["qa-touch", "technology", 1, 10, null, "Womit lässt sich der Touchscreen eines Smartphones nicht bedienen?", ["Mit dicken Handschuhen", "Mit dem bloßen Finger", "Mit einem leitfähigen Eingabestift", "Mit kalten Fingern"], 0, "Smartphones nutzen kapazitive Touchscreens. Die reagieren auf den bloßen Finger – ob kalt oder warm – und auf leitfähige Stifte, nicht aber auf dicke Handschuhe oder herkömmliche Stifte.", "Touchscreen", "What can you not use to operate a smartphone's touchscreen?", ["Thick gloves", "A bare finger", "A conductive stylus", "Cold fingers"], "Smartphones use capacitive touchscreens. They respond to a bare finger – cold or warm – and to conductive styluses, but not to thick gloves or ordinary styluses.", ["Smartphone", "Technik"]],
];

const animations = [
  {
    id: "a-touchscreen", scene: "touchscreen", category: "technology", timing: [0.7, 1], sources: [wiki("Touchscreen")], quiz: "qa-touch", predict: [3, 0],
    de: {
      title: "Wie ein Touchscreen Berührungen erkennt", summary: "Unter dem Glas liegt ein Gitter aus Streifen – und ein Finger verändert es.",
      goal: "Du kannst erklären, wie ein Smartphone-Bildschirm merkt, wo dein Finger ist, und warum Handschuhe nicht funktionieren.",
      labels: ["Deckglas", "Sensor-Streifen", "Treiber-Streifen", "Display", "Kreuzungspunkt", "Größeres Signal: hier ist der Finger", "Mehrere Finger zugleich", "Isoliert voneinander"],
      steps: [
        ["Fast alle Smartphones und Tablets nutzen projiziert-kapazitive Touchscreens. Auf der Rückseite des Deckglases liegen zwei Ebenen mit einem leitfähigen Muster aus Streifen – voneinander isoliert.", 9],
        ["Eine Ebene dient als Treiber, die andere als Sensor. Ihre Streifen kreuzen sich, und an jedem Kreuzungspunkt liegt ein winziger Kondensator.", 9],
        ["Kommt ein Finger an einen Kreuzungspunkt, ändert sich die Kapazität dieses Kondensators – und am Empfängerstreifen kommt ein größeres Signal an. Die Stelle des Signals ist die Stelle des Fingers.", 10],
        ["Der Bildschirm erkennt auch Gesten und mehrere Finger zugleich (Multi-Touch). Bedienen lässt er sich nur mit dem bloßen Finger – ob kalt oder warm – oder mit leitfähigen Stiften, nicht mit dicken Handschuhen.", 10],
      ],
      predict: ["Funktioniert so ein Touchscreen auch mit dicken Handschuhen?", "Nein – er braucht den bloßen Finger oder einen leitfähigen Stift", "Ja – er reagiert auf Druck", "Nur wenn die Hände warm sind"],
    },
    en: {
      title: "How a touchscreen detects a touch", summary: "Under the glass lies a grid of stripes – and a finger changes it.",
      goal: "You can explain how a smartphone screen notices where your finger is, and why gloves do not work.",
      labels: ["Cover glass", "Sensor stripes", "Driver stripes", "Display", "Crossing point", "Bigger signal: the finger is here", "Several fingers at once", "Insulated from each other"],
      steps: [
        "Almost all smartphones and tablets use projected capacitive touchscreens. On the back of the cover glass lie two layers with a conductive pattern of stripes – insulated from each other.",
        "One layer works as the driver, the other as the sensor. Their stripes cross, and at every crossing point there is a tiny capacitor.",
        "When a finger comes to a crossing point, the capacitance of this capacitor changes – and a bigger signal arrives at the receiving stripe. Where the signal is, the finger is.",
        "The screen also recognises gestures and several fingers at once (multi-touch). It only works with a bare finger – cold or warm – or with conductive styluses, not with thick gloves.",
      ],
      predict: ["Does such a touchscreen also work with thick gloves?", "No – it needs a bare finger or a conductive stylus", "Yes – it reacts to pressure", "Only when your hands are warm"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
