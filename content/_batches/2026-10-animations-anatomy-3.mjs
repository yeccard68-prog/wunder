// Content batch (24.10.2026): how the eye sees (3D scene "eye", real model from Z-Anatomy). Every statement is taken
// from the linked articles, word-for-word evidence below. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-anatomy-3.mjs   → the question
//   node content/_batches/2026-10-animations-anatomy-3.mjs                                   → the animation (idempotent)
//
// Evidence (de.wikipedia.org):
//   Hornhaut: "Die Hornhaut ist ein klares Scheibchen"
//   Iris (Auge): "die durch Pigmente gefärbte Blende des Auges" · "lässt in ihrer Mitte eine Öffnung, die Pupille, frei" ·
//     "Der innere Irisrand bildet die Pupille, das Sehloch, und liegt als Margo pupillaris auf der Vorderfläche der Linse" ·
//     "Die glatte Irismuskulatur reguliert durch die Veränderung des Pupillendurchmessers den Lichteinfall in das Auge"
//   Linse (Auge): "bündelt als Sammellinse das durch die Pupille eintretende Licht an der Hinterseite des Auges so, dass auf der
//     Netzhaut ein scharfes Bild entstehen kann"
//   Netzhaut: "wird das einfallende Licht – nachdem es die Hornhaut, die Linse und den Glaskörper durchquert hat – in
//     Nervenimpulse umgewandelt"
//   Pupille: "Rasche Zunahmen der Leuchtdichte der betrachteten Umgebung werden normalerweise mit einer Verengung der Pupillen
//     beantwortet (Miosis), Abnahmen umgekehrt mit einer Erweiterung (Mydriasis), sodass die auf die Netzhaut einstrahlende
//     Lichtmenge weniger stark schwankt."
//   Sehnerv: "Ein Sehnerv enthält rund eine Million Nervenfasern"
//   Auge: "gelangen über die Sehnervenbahnen zum Sehzentrum des Gehirns, wo sie schließlich zu einer visuellen Wahrnehmung
//     verarbeitet werden"
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-24";
export const verification = "ai_checked";

export const questions = [
  ["qa-auge", "science", 1, 10, null, "Wie heißt die Öffnung in der Mitte der Iris, durch die Licht ins Auge fällt?", ["Pupille", "Linse", "Netzhaut", "Hornhaut"], 0, "Die Iris ist die gefärbte Blende des Auges. In ihrer Mitte lässt sie eine Öffnung frei: die Pupille. Ihre Größe regelt, wie viel Licht ins Auge fällt.", "Iris_(Auge)", "What is the opening in the middle of the iris through which light enters the eye called?", ["Pupil", "Lens", "Retina", "Cornea"], "The iris is the coloured aperture of the eye. It leaves an opening in its middle: the pupil. Its size controls how much light enters the eye.", ["Anatomie", "Körper"]],
];

const animations = [
  {
    id: "a-auge", scene: "eye", category: "science", timing: [0.7, 1], sources: [wiki("Hornhaut"), wiki("Iris_(Auge)"), wiki("Linse_(Auge)"), wiki("Netzhaut"), wiki("Pupille"), wiki("Sehnerv"), wiki("Auge")], quiz: "qa-auge", predict: [2, 0],
    de: {
      title: "Wie das Auge sieht", summary: "Vom Lichtstrahl zum Bild: Hornhaut, Linse und Netzhaut arbeiten zusammen.",
      goal: "Du kannst den Weg des Lichts durch das Auge beschreiben und erklären, wozu Pupille und Linse da sind.",
      labels: ["Hornhaut", "Iris", "Pupille", "Linse", "Netzhaut", "Sehnerv", "Glaskörper", "Scharfes Bild auf der Netzhaut", "Hell: Die Pupille wird enger", "Nervenimpulse zum Gehirn"],
      steps: [
        ["Licht fällt zuerst durch die Hornhaut, ein klares Scheibchen. Dahinter liegt die Iris, die gefärbte Blende des Auges. In ihrer Mitte lässt sie eine Öffnung frei: die Pupille.", 9],
        ["Hinter der Pupille sitzt die Linse. Als Sammellinse bündelt sie das einfallende Licht so, dass hinten im Auge auf der Netzhaut ein scharfes Bild entsteht.", 9],
        ["Wird es plötzlich heller, verengt sich die Pupille; wird es dunkler, erweitert sie sich. So schwankt die Lichtmenge, die auf die Netzhaut fällt, weniger stark.", 9],
        ["In der Netzhaut wird das Licht in Nervenimpulse umgewandelt. Der Sehnerv mit rund einer Million Nervenfasern leitet sie weiter. Erst im Sehzentrum des Gehirns entsteht daraus, was wir sehen.", 10],
      ],
      predict: ["Gleich wird es plötzlich hell. Was macht die Pupille?", "Sie wird enger", "Sie wird weiter", "Sie bleibt genau gleich"],
    },
    en: {
      title: "How the eye sees", summary: "From a ray of light to a picture: cornea, lens and retina work together.",
      goal: "You can describe the path of light through the eye and explain what the pupil and the lens are for.",
      labels: ["Cornea", "Iris", "Pupil", "Lens", "Retina", "Optic nerve", "Vitreous body", "Sharp image on the retina", "Bright: the pupil narrows", "Nerve impulses to the brain"],
      steps: [
        "Light first passes through the cornea, a clear little disc. Behind it lies the iris, the coloured aperture of the eye. It leaves an opening in its middle: the pupil.",
        "Behind the pupil sits the lens. As a converging lens it focuses the incoming light so that a sharp image forms at the back of the eye, on the retina.",
        "When it suddenly gets brighter, the pupil narrows; when it gets darker, it widens. That way the amount of light falling on the retina varies less.",
        "In the retina the light is turned into nerve impulses. The optic nerve, with about a million nerve fibres, carries them on. Only in the visual centre of the brain does this become what we see.",
      ],
      predict: ["It is about to get bright suddenly. What does the pupil do?", "It narrows", "It widens", "It stays exactly the same"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
