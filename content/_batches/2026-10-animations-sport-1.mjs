// Content batch (25.10.2026): why a ball with spin flies a curve (3D scene "magnus"). Every statement is taken from the
// linked articles, word-for-word evidence below. The pressure explanation is given as Magnus's own explanation – the article
// notes that Bernoulli describes a relation, not the cause. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-sport-1.mjs   → the question
//   node content/_batches/2026-10-animations-sport-1.mjs                                   → the animation (idempotent)
//
// Evidence (de.wikipedia.org):
//   Magnus-Effekt: "beschreibt die Querkraftwirkung (Kraft), die ein rotierender runder Körper (Zylinder oder Kugel) in einer
//     Strömung erfährt" · "Magnus erklärte den Effekt als erster anhand der Bernoulli-Gleichung" · "In der Summe ist die
//     Strömungsgeschwindigkeit auf der Seite des Zylinders, die sich mit der Anströmung dreht, größer als auf der anderen Seite
//     und nach Bernoulli der Druck kleiner, sodass der Zylinder eine Kraft im rechten Winkel zur Anströmrichtung erfährt." ·
//     "Beschrieben wurde der Effekt schon 100 Jahre vor Magnus von Benjamin Robins" · "Magnus erbrachte 1852 den Nachweis des
//     Phänomens rein experimentell" · "Fußballspieler schießen den Ball mit Effet, damit er in einem Bogen ins Tor fliegt."
//   Bananenflanke: "„wischt“ der ausführende Fuß mit seiner Innenseite am Ball vorbei und sorgt für eine seitliche Rotation des
//     Balles" · "Die gekrümmte Flugbahn, die der Ball bei der Bananenflanke beschreibt, entsteht durch die Rotation des Balls.
//     Dabei reißt er Luft mit sich, und zwar in die Richtung, in die er sich dreht (Magnus-Effekt)."
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-25";
export const verification = "ai_checked";

export const questions = [
  ["qa-effet", "sport", 1, 10, null, "Wie heißt der Effekt, der einen rotierenden Ball in der Luft zur Seite lenkt?", ["Magnus-Effekt", "Doppler-Effekt", "Treibhauseffekt", "Domino-Effekt"], 0, "Der Magnus-Effekt beschreibt die Kraft, die ein rotierender runder Körper in einer Strömung quer zur Strömung erfährt. Deshalb fliegt ein Fußball mit Effet im Bogen.", "Magnus-Effekt", "What is the effect called that pushes a spinning ball sideways in the air?", ["Magnus effect", "Doppler effect", "Greenhouse effect", "Domino effect"], "The Magnus effect describes the force a spinning round body experiences across a flow. That is why a football kicked with spin flies in a curve.", ["Fußball", "Physik"]],
];

const animations = [
  {
    id: "a-effet", scene: "magnus", category: "sport", timing: [0.7, 1], sources: [wiki("Magnus-Effekt"), wiki("Bananenflanke")], quiz: "qa-effet", predict: [3, 0],
    de: {
      title: "Warum ein angeschnittener Ball eine Kurve fliegt", summary: "Ein Ball, der sich dreht, reißt Luft mit – und wird zur Seite gedrückt.",
      goal: "Du kannst erklären, warum ein Ball mit Effet im Bogen fliegt, und wie sich die Kurve mit der Drehrichtung ändert.",
      labels: ["Tor", "Ball mit Effet", "Luft wird mitgerissen", "Schnellere Luft", "Langsamere Luft", "Kleinerer Druck", "Kraft quer zur Flugrichtung", "Die Bahn krümmt sich", "Andersherum gedreht: andere Kurve"],
      steps: [
        ["Fußballer schießen den Ball mit Effet, damit er im Bogen ins Tor fliegt. Bei der Bananenflanke wischt der Fuß mit der Innenseite am Ball vorbei und bringt ihn seitlich zum Drehen.", 9],
        ["Der rotierende Ball reißt Luft mit sich – in die Richtung, in die er sich dreht. Auf der Seite, die sich mit der anströmenden Luft dreht, strömt die Luft schneller vorbei als auf der anderen.", 10],
        ["Heinrich Gustav Magnus erklärte es so: Wo die Luft schneller strömt, ist der Druck kleiner. Der Ball erfährt deshalb eine Kraft im rechten Winkel zur Flugrichtung – den Magnus-Effekt –, und seine Bahn krümmt sich.", 10],
        ["Dreht sich der Ball andersherum, krümmt sich die Bahn zur anderen Seite. Beschrieben hatte den Effekt schon Benjamin Robins, 100 Jahre vor Magnus; Magnus wies ihn 1852 im Experiment nach.", 10],
      ],
      predict: ["Jetzt dreht sich der Ball andersherum. Was passiert mit seiner Flugbahn?", "Sie krümmt sich zur anderen Seite", "Sie wird ganz gerade", "Der Ball fällt sofort zu Boden"],
    },
    en: {
      title: "Why a ball with spin flies a curve", summary: "A spinning ball drags air along – and gets pushed sideways.",
      goal: "You can explain why a ball with spin flies in a curve and how the curve changes with the direction of spin.",
      labels: ["Goal", "Ball with spin", "Air is dragged along", "Faster air", "Slower air", "Lower pressure", "Force across the flight", "The path bends", "Spun the other way: other curve"],
      steps: [
        "Footballers kick the ball with spin so that it flies into the goal in a curve. For a banana kick the inside of the foot wipes past the ball and sets it spinning sideways.",
        "The spinning ball drags air along with it – in the direction it is turning. On the side that turns with the oncoming air, the air flows past faster than on the other side.",
        "Heinrich Gustav Magnus explained it like this: where the air flows faster, the pressure is lower. So the ball feels a force at right angles to its flight – the Magnus effect – and its path bends.",
        "If the ball spins the other way, the path bends to the other side. Benjamin Robins had already described the effect 100 years before Magnus; Magnus proved it by experiment in 1852.",
      ],
      predict: ["Now the ball spins the other way. What happens to its path?", "It bends to the other side", "It becomes completely straight", "The ball drops to the ground at once"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
