// Content batch (25.10.2026): how a violin sounds (3D scene "violin") and how the assembly line changed production (3D
// scene "assembly"). Every statement is taken from the linked articles, word-for-word evidence below. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-culture-business-1.mjs   → the questions
//   node content/_batches/2026-10-animations-culture-business-1.mjs                                   → the animations
//
// Evidence (de.wikipedia.org):
//   Violine: "Der Korpus der Violine besteht aus Decke, Boden und Zargenkranz. Zusammen bilden sie einen etwa 35 bis 36 cm langen
//     Hohlkörper, der als Resonanzkörper dient." · "die vier konischen Wirbel, mit denen die Saiten des Instruments gestimmt
//     werden" · "Die Decke ist der mit zwei F-Löchern versehene, gewölbte, aus Fichtenholz gefertigte obere Teil"
//   Bogen (Streichinstrument): "die mit Pferdehaaren bespannte Hartholzstange, mit der die Saiten und in der Folge auch der Korpus
//     des Instruments in Schwingung versetzt und damit zum Klingen gebracht werden" · "Vor dem Spielen wird das Rosshaar mit
//     Kolophonium eingerieben, um den Reibungswiderstand zwischen Saiten und Bogenbespannung zu erhöhen." · "Beim Hin- und
//     Herstreichen der Rosshaare des Bogens auf den Saiten wird durch den Stick-Slip-Effekt eine Schwingung und damit der Ton erzeugt."
//   Stick-Slip-Effekt: "(von engl. stick ‚haften‘ und slip ‚gleiten‘)" · "Bekannte Beispiele sind die Tonerzeugung bei Streichinstrumenten"
//   Steg (Saiteninstrument): "der die Energie der Schwingungen der gespannten Saiten auf den Korpus überträgt"
//   Stimmstock: "überträgt hauptsächlich die Schwingungen von der Decke auf den Boden"
//   Fließbandfertigung: "wird die Herstellung eines Produktes in aufeinanderfolgende Arbeitsprozesse unterteilt, die wiederum in
//     einzelne Arbeitsschritte aufgeteilt sein können" · "Materialtransport zwischen den einzelnen Produktionsstellen mit Hilfe von
//     verketteten Fördersystemen (zum Beispiel Förderbändern)" · "Die einzelnen Arbeitsschritte werden dabei meist auf wenige
//     Handgriffe reduziert." · "In der klassischen Form ist ein Arbeitsschritt eine permanente Wiederholung einer genau
//     determinierten Handgrifffolge." · "Die einzelnen Arbeitsschritte und Arbeitsstationen müssen so festgelegt werden, dass ihre
//     Durchführung genau eine festgelegte Zeitdauer benötigt, die Taktzeit." · "im Jahr 1913 ein permanentes Fließband aufbaute und
//     so die erste „moving assembly line“ installierte. Dadurch steigerte Ford die Produktion auf das Achtfache, so dass er zugleich
//     den Preis seines T-Modells […] enorm verringern und die Löhne erhöhen konnte."
//   Ford Modell T: "alle Bauteile mit gleichbleibend hoher Qualität und kleinen Toleranzen gefertigt werden müssen, um eine
//     störungsfreie Montage am Fließband realisieren zu können" · "Zwischen 1908 und 1927 wurden in den Vereinigten Staaten 15
//     Millionen Stück gebaut"
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-25";
export const verification = "ai_checked";

export const questions = [
  ["qa-geige", "culture", 1, 10, null, "Womit werden die Haare eines Geigenbogens vor dem Spielen eingerieben?", ["Mit Kolophonium", "Mit Öl", "Mit Wasser", "Mit Seife"], 0, "Das Rosshaar des Bogens wird mit Kolophonium, einem Harz, eingerieben. Das erhöht die Reibung zwischen Haaren und Saite.", "Bogen_(Streichinstrument)", "What are the hairs of a violin bow rubbed with before playing?", ["With rosin", "With oil", "With water", "With soap"], "The horsehair of the bow is rubbed with rosin, a resin. It increases the friction between the hairs and the string.", ["Musik", "Instrument"]],
  ["qa-fliessband", "business", 1, 10, null, "Wie heißt die festgelegte Zeit, die jede Station am Fließband für ihren Arbeitsschritt hat?", ["Taktzeit", "Halbwertszeit", "Ruhezeit", "Laufzeit"], 0, "Am Fließband sind Arbeitsschritte und Stationen so festgelegt, dass jede genau dieselbe Zeit braucht: die Taktzeit. Nur so kann das Band gleichmäßig weiterlaufen.", "Fließbandfertigung", "What is the fixed time that every station on an assembly line has for its step called?", ["Cycle time", "Half-life", "Rest time", "Running time"], "On an assembly line the steps and stations are arranged so that each needs exactly the same time: the cycle time. Only then can the line keep moving evenly.", ["Wirtschaft", "Geschichte"]],
];

const animations = [
  {
    id: "a-geige", scene: "violin", category: "culture", timing: [0.7, 1], sources: [wiki("Violine"), wiki("Bogen_(Streichinstrument)"), wiki("Stick-Slip-Effekt"), wiki("Steg_(Saiteninstrument)"), wiki("Stimmstock")], quiz: "qa-geige", predict: [3, 0],
    de: {
      title: "Wie eine Geige klingt", summary: "Ein Bogen, der haftet und gleitet, eine schwingende Saite – und ein hohler Holzkörper.",
      goal: "Du kannst erklären, wie Bogen, Saite, Steg und Korpus zusammen einen Geigenton erzeugen.",
      labels: ["Saiten", "Korpus", "F-Löcher", "Bogen mit Pferdehaar", "Kolophonium", "Haften – Gleiten – Haften", "Steg", "Stimmstock", "Der Korpus schwingt mit"],
      steps: [
        ["Eine Geige hat vier Saiten. Darunter liegt der Korpus aus Decke, Boden und Zargen – ein etwa 35 bis 36 cm langer Hohlkörper. Die gewölbte Decke aus Fichtenholz hat zwei F-Löcher.", 9],
        ["Gespielt wird mit dem Bogen, einer mit Pferdehaaren bespannten Holzstange. Vor dem Spielen werden die Haare mit Kolophonium eingerieben – das erhöht die Reibung zwischen Haaren und Saite.", 9],
        ["Streicht der Bogen über die Saite, haftet sie an den Haaren und gleitet wieder ab, immer wieder: Haften und Gleiten, der Stick-Slip-Effekt. So gerät die Saite in Schwingung, und es entsteht ein Ton.", 10],
        ["Der Steg überträgt die Schwingungen der Saite auf den Korpus, der Stimmstock darunter von der Decke auf den Boden. So schwingt am Ende das ganze Instrument – der hohle Korpus dient als Resonanzkörper.", 10],
      ],
      predict: ["Die Saite schwingt. Was bringt jetzt den Korpus der Geige zum Klingen?", "Der Steg überträgt die Schwingung auf den Korpus", "Die Luft aus dem Bogen", "Die Wirbel oben am Hals"],
    },
    en: {
      title: "How a violin sounds", summary: "A bow that sticks and slips, a vibrating string – and a hollow wooden body.",
      goal: "You can explain how the bow, the string, the bridge and the body make a violin's sound together.",
      labels: ["Strings", "Body", "F-holes", "Bow with horsehair", "Rosin", "Stick – slip – stick", "Bridge", "Sound post", "The body vibrates too"],
      steps: [
        "A violin has four strings. Below them is the body made of top, back and ribs – a hollow box about 35 to 36 cm long. The arched spruce top has two f-holes.",
        "It is played with the bow, a wooden stick strung with horsehair. Before playing, the hairs are rubbed with rosin – this increases the friction between the hairs and the string.",
        "When the bow moves across the string, the string sticks to the hairs and slips off again, over and over: stick and slip, the stick-slip effect. That sets the string vibrating, and a tone is made.",
        "The bridge passes the string's vibrations on to the body, the sound post below it from the top to the back. So in the end the whole instrument vibrates – the hollow body acts as a resonator.",
      ],
      predict: ["The string is vibrating. What now makes the body of the violin sound?", "The bridge passes the vibration on to the body", "The air from the bow", "The pegs at the top of the neck"],
    },
  },
  {
    id: "a-fliessband", scene: "assembly", category: "business", timing: [0.7, 1], sources: [wiki("Fließbandfertigung"), wiki("Ford_Modell_T")], quiz: "qa-fliessband", predict: [3, 0],
    de: {
      title: "Wie das Fließband die Produktion verändert hat", summary: "Wenige Handgriffe, ein fester Takt, genau passende Teile – und Autos werden achtmal so schnell gebaut.",
      goal: "Du kannst erklären, wie ein Fließband funktioniert, was die Taktzeit ist und warum Fords Modell T billiger wurde.",
      labels: ["Station 1: Räder", "Station 2: Motor", "Station 3: Karosserie", "Förderband", "Taktzeit", "Gleiche Teile, genau passend", "Produktion ×8", "Preis sinkt", "Löhne steigen"],
      steps: [
        ["Bei der Fließfertigung wird die Herstellung eines Produkts in aufeinanderfolgende Arbeitsschritte unterteilt – hier am Beispiel eines Autos: Räder, Motor, Karosserie.", 9],
        ["Am Fließband wandert das Produkt auf einem Förderband von Station zu Station. Jeder Arbeitsschritt wird auf wenige Handgriffe reduziert, die sich ständig wiederholen.", 9],
        ["Jede Station braucht genau dieselbe festgelegte Zeit, die Taktzeit. Damit nichts hakt, müssen alle Teile in gleich hoher Qualität und genau passend gefertigt sein.", 9],
        ["1913 baute Ford ein permanentes Fließband auf, die erste „moving assembly line“. Die Produktion stieg auf das Achtfache – so konnte Ford den Preis seines Modell T stark senken und zugleich die Löhne erhöhen. Bis 1927 entstanden 15 Millionen Stück.", 11],
      ],
      predict: ["1913 führt Ford das bewegte Fließband ein. Was passiert mit der Zahl der gebauten Autos?", "Sie steigt auf das Achtfache", "Sie halbiert sich", "Sie bleibt genau gleich"],
    },
    en: {
      title: "How the assembly line changed production", summary: "A few hand movements, a fixed rhythm, exactly fitting parts – and cars are built eight times as fast.",
      goal: "You can explain how an assembly line works, what cycle time is and why Ford's Model T became cheaper.",
      labels: ["Station 1: wheels", "Station 2: engine", "Station 3: body", "Conveyor belt", "Cycle time", "Identical parts, exactly fitting", "Output ×8", "Price falls", "Wages rise"],
      steps: [
        "In flow production, making a product is divided into steps that follow one another – shown here with a car: wheels, engine, body.",
        "On the assembly line the product moves on a conveyor belt from station to station. Each step is reduced to a few hand movements that are repeated over and over.",
        "Every station needs exactly the same fixed time, the cycle time. So that nothing gets stuck, all parts must be made to the same high quality and fit exactly.",
        "In 1913 Ford set up a permanent assembly line, the first “moving assembly line”. Output rose eightfold – so Ford could cut the price of his Model T sharply and raise wages at the same time. By 1927, 15 million had been built.",
      ],
      predict: ["In 1913 Ford introduces the moving assembly line. What happens to the number of cars built?", "It rises eightfold", "It halves", "It stays exactly the same"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
