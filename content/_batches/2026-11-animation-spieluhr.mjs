// Content batch (20.11.2026): how a music box plays – isometric figure "spieluhr" (components/anim/Spieluhr.tsx,
// drawn with the anatomy kit, scripts/iso/spieluhr.mjs). Every statement is taken from the linked articles. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-11-animation-spieluhr.mjs   → the question
//   node content/_batches/2026-11-animation-spieluhr.mjs                                   → the animation
//
// Evidence for the animation texts (de.wikipedia.org):
//   Spieldose: "Als Antrieb dient zum Beispiel ein Handkurbeltrieb, meist wurden und werden jedoch Federwerke verwendet." ·
//     "Um das Federwerk einer Musikdose aufzuziehen, dienten anfänglich Schlüssel mit einem Innenvierkant" ·
//     "Sie beginnen zu laufen, sobald die Feder ausreichend aufgezogen ist und bleiben stehen, sobald sie sich entspannt hat." ·
//     "Ein sich drehender Zylinder (die Tonwalze), der mit eingeschlagenen Stahlstiften besetzt ist, reißt diese Zungen an und
//     bringt sie zum Schwingen, wobei durch die Anordnung der Stifte eine bestimmte Melodie entsteht." ·
//     "Der Spielkamm oder Tonkamm ist ein Federstahlkamm mit abgestuften Zinkenlängen, den Tonzungen." ·
//     "Jede Tonzunge wird durch spanabnehmende Dimensionierung auf einen bestimmten Ton abgestimmt." ·
//     "Mit zunehmend tieferem Ton vergrößerte sich die Länge der Tonzungen." · "Eine Abhilfe war das Anlöten von Bleigewichten
//     unter die Tonzungen, womit sich deren Länge bedeutend verkürzen ließ und dennoch die gewünschten Bassnoten erzeugt werden
//     konnten." · "Der Tonkamm besitzt in der Regel mehrere Zungen der gleichen Note nebeneinander, um zu verhindern, dass bei
//     schnell aufeinanderfolgenden gleichen Noten die Zunge der gewünschten Note erneut angerissen werden muss." · "Die
//     Berührung eines nachfolgenden Stahlstiftes mit der kurz zuvor angerissenen, noch vibrierenden Zunge würde einen
//     unerwünschten Klang erzeugen." · "Damit sich die aufgezogene Feder nur langsam entspannt, wird meist ein Windfang
//     verwendet." · "Die erwünschte Hemmung geschieht hier über den Luftwiderstand." · "Über ein Getriebe wird der Windfang mit
//     hoher Drehzahl (in der Regel 2.000 Umdrehungen pro Melodie à 50 Sekunden" · "Der Windfang heutiger Spieldosen hat fast
//     immer lediglich starre Windflügel, daher nimmt die Spielgeschwindigkeit mit dem Entspannen der Antriebsfeder
//     kontinuierlich ab."
//   Stiftwalze: "wenn z. B. federnde Zungen von Spieluhren durch Stifte angehoben und schlagartig zum Schwingen freigelassen werden."
// The tune on the cylinder is Brahms' "Wiegenlied" (Brahms died 1897), the same notes as the listening card mk105, one octave up.
// Simplified in the drawing: ten tines, the spring barrel on the cylinder's axle, the fly drawn turning far slower than in a
// real box; the caption of the last step says so. The tine sound is synthesised (lib/synth.ts renderTine), no recording.
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-11-20";
export const verification = "ai_checked";

export const questions = [
  ["qa-spieldose", "music", 2, 10, null, "Warum hat der Tonkamm einer Spieluhr oft mehrere Zungen für denselben Ton?", ["Damit kein Stift eine Zunge trifft, die noch schwingt", "Damit der Ton lauter klingt", "Damit sich die Walze leichter dreht", "Damit die Feder länger hält"], 0, "Kommt derselbe Ton schnell zweimal hintereinander, würde der nächste Stahlstift die noch schwingende Zunge berühren – das klingt unschön. Deshalb stehen oft mehrere Zungen derselben Note nebeneinander.", "Spieldose", "Why does the comb of a music box often have several tines for the same note?", ["So that no pin hits a tine that is still vibrating", "To make the note louder", "So that the cylinder turns more easily", "So that the spring lasts longer"], "When the same note comes twice in quick succession, the next steel pin would touch the tine while it is still vibrating – which sounds unpleasant. That is why several tines of the same note often sit side by side.", ["Musik", "Instrument"]],
];

export const evidence = {
  "qa-spieldose": ["de|Spieldose|Der Tonkamm besitzt in der Regel mehrere Zungen der gleichen Note nebeneinander, um zu verhindern, dass bei schnell aufeinanderfolgenden gleichen Noten die Zunge der gewünschten Note erneut angerissen werden muss.", "de|Spieldose|Die Berührung eines nachfolgenden Stahlstiftes mit der kurz zuvor angerissenen, noch vibrierenden Zunge würde einen unerwünschten Klang erzeugen."],
};

const animations = [
  {
    id: "a-spieluhr", scene: "spieluhr", renderer: "svg-scene", category: "music", timing: [0.7, 1], sources: [wiki("Spieldose"), wiki("Stiftwalze")], quiz: "qa-spieldose", predict: [3, 0],
    de: {
      title: "Wie eine Spieluhr spielt", summary: "Eine Feder, eine Walze voller Stifte und ein Kamm aus Stahl – und die Spieluhr spielt ein Lied.",
      goal: "Du kannst erklären, wie Feder, Stiftwalze, Tonkamm und Windfang einer Spieluhr zusammenspielen.",
      labels: ["Schlüssel", "Feder", "Stiftwalze", "Tonkamm", "Bleigewicht", "Zwei Zungen, ein Ton", "Windfang", "Brahms: Wiegenlied", "Ton an", "Ton aus"],
      steps: [
        ["Eine Spieluhr wird meist von einer Feder angetrieben, die man mit einem Schlüssel aufzieht. Einfache Spieluhren laufen los, sobald die Feder genug gespannt ist, und bleiben stehen, wenn sie sich entspannt hat. Du kannst den Schlüssel auch selbst drehen.", 10],
        ["Die Feder dreht die Walze. Ihre Stahlstifte heben die Zungen des Tonkamms an und lassen sie plötzlich los – so schwingen sie und klingen. Wie die Stifte angeordnet sind, ergibt die Melodie.", 10],
        ["Der Tonkamm ist ein Kamm aus Federstahl mit unterschiedlich langen Zungen. Jede ist auf einen Ton abgestimmt: Je tiefer der Ton, desto länger die Zunge. Damit die Basszungen nicht zu lang werden, sind Bleigewichte unter sie gelötet.", 10],
        ["Oft stehen mehrere Zungen für denselben Ton nebeneinander. Kommt ein Ton schnell zweimal, reißt der zweite Stift die Nachbarzunge an. Träfe er die Zunge, die noch schwingt, gäbe es einen unschönen Klang.", 10],
        ["Damit sich die Feder nur langsam entspannt, bremst ein Windfang das Werk mit dem Luftwiderstand. Gezeichnet dreht er sich gemächlich – in echt meist etwa 2.000-mal pro Melodie. Weil die Feder nachlässt, wird das Spiel mit der Zeit langsamer. Hier: Brahms' Wiegenlied, vereinfacht auf zehn Zungen.", 12],
      ],
      predict: ["Derselbe Ton kommt zweimal schnell hintereinander. Was macht die Spieluhr?", "Der zweite Stift reißt eine Nachbarzunge mit demselben Ton an", "Die Walze hält kurz an", "Dieselbe Zunge wird sofort noch einmal angerissen"],
    },
    en: {
      title: "How a music box plays", summary: "A spring, a cylinder full of pins and a steel comb – and the music box plays a tune.",
      goal: "You can explain how the spring, pinned cylinder, comb and fly governor of a music box work together.",
      labels: ["Key", "Spring", "Pinned cylinder", "Comb", "Lead weight", "Two tines, one note", "Fly governor", "Brahms: Lullaby", "Sound on", "Sound off"],
      steps: [
        "A music box is usually driven by a spring that you wind with a key. Simple music boxes start as soon as the spring is wound far enough and stop when it has run down. You can turn the key yourself, too.",
        "The spring turns the cylinder. Its steel pins lift the tines of the comb and suddenly let them go – so they vibrate and sound. How the pins are placed makes the tune.",
        "The comb is made of spring steel with tines of different lengths. Each one is tuned to a note: the lower the note, the longer the tine. To keep the bass tines from getting too long, lead weights are soldered under them.",
        "Often several tines for the same note sit side by side. When a note comes twice in quick succession, the second pin plucks the neighbouring tine. If it hit the tine that is still vibrating, it would make an unpleasant sound.",
        "So that the spring only runs down slowly, a fly governor brakes the works with air resistance. In the drawing it turns gently – in a real box usually about 2,000 times per tune. As the spring weakens, the playing slows down over time. Here: Brahms' Lullaby, simplified to ten tines.",
      ],
      predict: ["The same note comes twice in quick succession. What does the music box do?", "The second pin plucks a neighbouring tine with the same note", "The cylinder stops for a moment", "The same tine is plucked again right away"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
