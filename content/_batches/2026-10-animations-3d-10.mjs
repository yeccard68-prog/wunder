// Content batch (18.10.2026): the heart, rebuilt in 3D – a cut-open heart with its four chambers, the valves
// and the blood going round lungs and body. The old drawing stays as the fallback without 3D. AI-checked.
//   node content/_batches/2026-10-animations-3d-10.mjs   → the animation (idempotent)
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const TODAY = "2026-10-18";
export const verification = "ai_checked";

const animations = [
  {
    id: "a-herz", scene: "heart", fallback: "heart", category: "science", timing: [0.7, 1.0], sources: [wiki("Herz"), wiki("Herzklappe"), wiki("Blutkreislauf")], quiz: "qa-herz", predict: [2, 1],
    de: {
      title: "Wie das Herz Blut pumpt", summary: "Zwei Pumpen in einem Organ: eine für die Lunge, eine für den Körper.",
      goal: "Du kannst den Weg des Blutes durch die vier Herzräume beschreiben und erklären, wozu die Herzklappen da sind.",
      labels: ["Lunge", "Körper", "Rechter Vorhof", "Rechte Kammer", "Linker Vorhof", "Linke Kammer", "Klappen offen", "Klappen geschlossen", "nimmt Sauerstoff auf", "gibt Sauerstoff ab"],
      steps: [
        ["Das Herz besteht aus zwei Pumpen mit je einem Vorhof und einer Kammer. Die rechte Hälfte – im Bild links, weil wir von vorn auf den Körper schauen – bekommt sauerstoffarmes Blut (blau) aus dem Körper, die linke sauerstoffreiches (rot) aus der Lunge.", 9],
        ["Zuerst ziehen sich die Vorhöfe zusammen. Die Klappen zu den Kammern sind offen, und das Blut strömt nach unten in die Kammern.", 7],
        ["Jetzt ziehen sich die kräftigeren Kammern zusammen. Die Klappen zu den Vorhöfen schließen sich, nichts fließt zurück. Dafür öffnen sich die Klappen an den Ausgängen: Die rechte Kammer pumpt in die Lungenarterie, die linke in die Hauptschlagader (Aorta).", 9],
        ["In der Lunge nimmt das Blut Sauerstoff auf und fließt rot zur linken Herzhälfte zurück. Im Körper gibt es den Sauerstoff ab und kehrt blau zur rechten Hälfte zurück. Das wiederholt sich mit jedem Herzschlag – in Ruhe rund 100.000 Mal am Tag.", 10],
      ],
      predict: ["Gleich ziehen sich die Kammern zusammen. Was verhindert, dass das Blut zurück in die Vorhöfe fließt?", "Die Vorhöfe drücken dagegen", "Die Klappen schließen sich", "Das Blut ist dafür zu zäh"],
    },
    en: {
      title: "How the heart pumps blood", summary: "Two pumps in one organ: one for the lungs, one for the body.",
      goal: "You can describe the path of blood through the four chambers of the heart and explain what the valves are for.",
      labels: ["Lungs", "Body", "Right atrium", "Right ventricle", "Left atrium", "Left ventricle", "valves open", "valves closed", "takes up oxygen", "gives off oxygen"],
      steps: [
        "The heart is made of two pumps, each with an atrium and a ventricle. The right half – on the left of the picture, because we are looking at the body from the front – receives oxygen-poor blood (blue) from the body, the left half oxygen-rich blood (red) from the lungs.",
        "First the atria contract. The valves to the ventricles are open, and the blood flows down into the ventricles.",
        "Now the stronger ventricles contract. The valves to the atria close, so nothing flows back. Instead the valves at the exits open: the right ventricle pumps into the pulmonary artery, the left one into the main artery (aorta).",
        "In the lungs the blood takes up oxygen and flows back red to the left half of the heart. In the body it gives off the oxygen and returns blue to the right half. This repeats with every heartbeat – at rest about 100,000 times a day.",
      ],
      predict: ["The ventricles are about to contract. What stops the blood from flowing back into the atria?", "The atria push against it", "The valves close", "The blood is too thick for that"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
