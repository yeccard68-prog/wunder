// Content batch (18.11.2026): how a barrel organ plays – isometric figure "drehorgel" (components/anim/Drehorgel.tsx,
// drawn with the anatomy kit, scripts/iso/drehorgel.mjs). Every statement is taken from the linked articles. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-11-animation-drehorgel.mjs   → the question
//   node content/_batches/2026-11-animation-drehorgel.mjs                                   → the animation
//
// Evidence for the animation texts (de.wikipedia.org):
//   Drehorgel: "Mit Hilfe einer Kurbel oder eines Schwungrades wird über eine Pleuelstange der mit Leder bezogene Schöpfbalg
//     betätigt, der den Wind erzeugt." · "Der Wind wird in einem Magazinbalg gespeichert, beruhigt und mit Federkraft auf einen
//     konstanten Druck gebracht." · "Über der Windlade, die eine Vielzahl von Ventilen enthält, steht das Pfeifenwerk." ·
//     "Jedem Ventil ist ein Ton (eine Pfeife oder mehrere Pfeifen unterschiedlicher Bauart) zugeordnet." · "Durch die
//     Drehbewegung der Kurbel wird bei mechanischer oder pneumatischer Steuerung auch der Programmträger bewegt." ·
//     "Die älteste Form des Programmträgers ist die Stiftwalze" · "Die Lauflänge des Musikstückes ist durch den Walzenumfang
//     begrenzt." · "Eine Stiftwalze (meist auswechselbar) kann bis zu zwölf Musikstücke (verbreitet sind sechs bis acht) enthalten."
//   Stiftwalze: "mit Stiften versehene Walzen verwendet, um die abzuspielenden Töne im zeitlichen Ablauf festzulegen"
//   Orgelpfeife: "Die Länge der Pfeife bestimmt bei den Labialpfeifen direkt die Tonhöhe."
//   Orgel: "Ein um eine Oktave tieferes Register ist ein 16′-Register mit doppelt so langen Pfeifen, 4′ bezeichnet ein um eine
//     Oktave höheres Register und hat nur halb so lange Pfeifen wie ein 8′-Register."
// The tune on the barrel is the opening of the "Ode an die Freude" (same notes as the listening card mk98).
// Simplified in the drawing: five pipes, one key per pipe resting on the barrel; the caption of the last step says so.
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-11-18";
export const verification = "ai_checked";

export const questions = [
  ["qa-drehorgel", "music", 1, 10, null, "Wofür sind die Stifte auf der Walze einer Drehorgel da?", ["Sie legen fest, wann welcher Ton erklingt", "Sie pumpen den Wind in die Pfeifen", "Sie halten die Kurbel fest", "Sie stimmen die Pfeifen"], 0, "Die Stifte auf der Walze legen die Töne im zeitlichen Ablauf fest: Sie steuern, welches Ventil sich wann öffnet – und damit, welche Pfeife klingt.", "Stiftwalze", "What are the pins on the barrel of a barrel organ for?", ["They decide when each note sounds", "They pump the wind into the pipes", "They hold the crank in place", "They tune the pipes"], "The pins on the barrel fix the notes in time: they control which valve opens when – and so which pipe sounds.", ["Musik", "Instrument"]],
];

export const evidence = {
  "qa-drehorgel": ["de|Stiftwalze|mit Stiften versehene Walzen verwendet, um die abzuspielenden Töne im zeitlichen Ablauf festzulegen", "de|Drehorgel|Über der Windlade, die eine Vielzahl von Ventilen enthält, steht das Pfeifenwerk."],
};

const animations = [
  {
    id: "a-drehorgel", scene: "drehorgel", renderer: "svg-scene", category: "music", timing: [0.7, 1], sources: [wiki("Drehorgel"), wiki("Stiftwalze"), wiki("Orgelpfeife"), wiki("Orgel")], quiz: "qa-drehorgel", predict: [2, 0],
    de: {
      title: "Wie eine Drehorgel spielt", summary: "Eine Kurbel, ein Blasebalg und eine Walze voller Stifte – und die Orgel spielt ganz von selbst.",
      goal: "Du kannst erklären, wie Kurbel, Bälge, Stiftwalze, Ventile und Pfeifen einer Drehorgel zusammenspielen.",
      labels: ["Kurbel", "Stiftwalze", "Schöpfbalg", "Magazinbalg mit Federn", "Windlade mit Ventilen", "Pfeifen", "Ode an die Freude", "Ton an", "Ton aus"],
      steps: [
        ["Eine Drehorgel wird mit einer Kurbel angetrieben. Dreht man sie, bewegt sich auch die Walze – darauf ist das Musikstück gespeichert. Du kannst auch selbst an der Kurbel drehen.", 9],
        ["Über eine Pleuelstange pumpt die Kurbel den mit Leder bezogenen Schöpfbalg: Er erzeugt den Wind. Im Magazinbalg wird der Wind gespeichert und mit Federkraft auf einen gleichbleibenden Druck gebracht.", 10],
        ["Die Stifte auf der Walze legen fest, wann welcher Ton erklingt. Über der Windlade mit ihren Ventilen stehen die Pfeifen, jedem Ventil ist ein Ton zugeordnet. Je länger eine Pfeife, desto tiefer ihr Ton.", 10],
        ["Diese Walze spielt den Anfang der „Ode an die Freude“ – vereinfacht auf fünf Pfeifen. Wie lang ein Stück sein kann, begrenzt der Umfang der Walze; eine Walze kann bis zu zwölf Musikstücke enthalten.", 10],
      ],
      predict: ["Die Walze dreht sich, ein Stift erreicht seine Taste. Was passiert?", "Ein Ventil öffnet sich und eine Pfeife klingt", "Die Kurbel bleibt stehen", "Der Schöpfbalg wird leer"],
    },
    en: {
      title: "How a barrel organ plays", summary: "A crank, a bellows and a barrel full of pins – and the organ plays by itself.",
      goal: "You can explain how the crank, bellows, pinned barrel, valves and pipes of a barrel organ work together.",
      labels: ["Crank", "Pinned barrel", "Feeder bellows", "Reservoir with springs", "Wind chest with valves", "Pipes", "Ode to Joy", "Sound on", "Sound off"],
      steps: [
        "A barrel organ is driven by a crank. Turning it also moves the barrel – the piece of music is stored on it. You can turn the crank yourself, too.",
        "Through a connecting rod the crank works the leather-covered feeder bellows: it makes the wind. The reservoir bellows stores the wind and uses springs to keep its pressure steady.",
        "The pins on the barrel decide when each note sounds. The pipes stand on the wind chest with its valves, and each valve belongs to one note. The longer a pipe, the lower its note.",
        "This barrel plays the opening of the “Ode to Joy” – simplified to five pipes. How long a piece can be is limited by the barrel's circumference; one barrel can hold up to twelve pieces.",
      ],
      predict: ["The barrel turns and a pin reaches its key. What happens?", "A valve opens and a pipe sounds", "The crank stops", "The feeder bellows runs empty"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
