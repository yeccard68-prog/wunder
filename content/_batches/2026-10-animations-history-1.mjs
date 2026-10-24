// Content batch (24.10.2026): how Gutenberg's printing worked (3D scene "printing"). Every statement is taken from the
// linked articles, word-for-word evidence below. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-history-1.mjs   → the question
//   node content/_batches/2026-10-animations-history-1.mjs                                   → the animation (idempotent)
//
// Evidence (de.wikipedia.org):
//   Druckpresse: "Die Druckpresse und die beweglichen Lettern aus Metall sind die Bestandteile des Buchdrucks in der Form, wie
//     er um 1440 von Johannes Gutenberg in Mainz entwickelt wurde." · "mit der Texte und Bilder oder andere grafische Elemente
//     von einer eingefärbten Druckform auf Papier oder einen anderen Bedruckstoff übertragen werden" · "Die Spindelpresse
//     ermöglicht es, direkten Druck auf eine ebene Fläche auszuüben." · "dass der Tiegel auf das Papier einen Pressdruck ausübte,
//     der gleichmäßig und federnd zugleich war"
//   Handgießinstrument: "Gutenberg erfand eine zweiteilige und passgenaue Gießform aus Metall (Eisen oder Messing), die die
//     Matrize aufnahm und durch einen Kanal die Zufuhr der flüssigen Metalllegierung ermöglichte." · "die Matrize, für die
//     seitenverkehrte Letter" · "Überdies ließen sich die Matrizen auswechseln; so benötigten die verschiedenen Lettern keine
//     jeweils eigenen Gießformen und ließen sich dennoch wiederholt mit gleichen Größen und in beliebiger Anzahl herstellen."
//   Winkelhaken: "mit dem Setzen so lange fortgefahren, bis der Winkelhaken mit Zeilen gefüllt ist" · "bis die zur Bildung einer
//     Spalte oder Seite (Kolumne) oder auch eines Pakets nötige Zeilenzahl erreicht ist"
//   Buchdruck: "Das Setzen der vorgefertigten Lettern war viel einfacher und schneller als die Herstellung von Druckplatten für
//     den Blockdruck." · "Der von Gutenberg erfundene Buchdruck mit beweglichen Lettern und Druckpresse machte das Buch zu einem
//     Massenartikel, da Bücher für eine breitere Allgemeinheit erschwinglich wurden."
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-24";
export const verification = "ai_checked";

export const questions = [
  ["qa-buchdruck", "history", 1, 10, null, "Was gehörte zu Gutenbergs Buchdruck neben der Druckpresse?", ["Bewegliche Lettern aus Metall", "Lettern aus Kunststoff", "Ein Kopiergerät mit Licht", "Handgeschriebene Vorlagen aus Pergament"], 0, "Gutenberg entwickelte den Buchdruck um 1440 in Mainz aus zwei Bestandteilen: einer Druckpresse und beweglichen Lettern aus Metall, die er in einem Handgießinstrument goss.", "Druckpresse", "Besides the printing press, what was part of Gutenberg's printing?", ["Movable metal type", "Plastic type", "A copier that works with light", "Handwritten templates on parchment"], "Gutenberg developed printing around 1440 in Mainz from two parts: a printing press and movable metal type, which he cast in a hand mould.", ["Geschichte", "Erfindung"]],
];

const animations = [
  {
    id: "a-buchdruck", scene: "printing", category: "history", timing: [0.7, 1], sources: [wiki("Druckpresse"), wiki("Handgießinstrument"), wiki("Winkelhaken"), wiki("Buchdruck")], quiz: "qa-buchdruck", predict: [3, 0],
    de: {
      title: "Wie Gutenbergs Buchdruck funktionierte", summary: "Gegossene Lettern, ein Winkelhaken und eine Spindelpresse – und das Buch wird erschwinglich.",
      goal: "Du kannst die drei Schritte des Buchdrucks – Gießen, Setzen, Drucken – beschreiben und erklären, warum er so wichtig war.",
      labels: ["Druckpresse", "Handgießinstrument", "Flüssiges Metall", "Seitenverkehrte Letter", "Winkelhaken", "Zeile um Zeile zur Seite", "Druckerballen: Farbe auf die Lettern", "Spindel", "Tiegel drückt das Papier", "Gedruckte Seite"],
      steps: [
        ["Um 1440 entwickelte Johannes Gutenberg in Mainz den Buchdruck. Er bestand aus zwei Teilen: beweglichen Lettern aus Metall und einer Druckpresse.", 8],
        ["Die Lettern wurden gegossen. Gutenbergs Handgießinstrument nahm eine Matrize auf, durch einen Kanal kam flüssiges Metall hinein. Weil sich die Matrizen auswechseln ließen, entstand jede Letter in beliebiger Anzahl und gleich groß – seitenverkehrt.", 10],
        ["Der Setzer reihte die Lettern im Winkelhaken zu Zeilen, bis eine ganze Seite beisammen war. Fertige Lettern zu setzen war viel einfacher und schneller, als für jede Seite eine Druckplatte herzustellen.", 10],
        ["Die eingefärbte Druckform kam in die Presse. Über eine Spindel drückte der Tiegel das Papier gleichmäßig auf die Lettern – die Seite war gedruckt. So wurde das Buch zum Massenartikel, den sich viel mehr Menschen leisten konnten.", 11],
      ],
      predict: ["Die Seite ist gesetzt und mit Farbe bestrichen. Was macht jetzt die Presse?", "Sie drückt das Papier gleichmäßig auf die Lettern", "Sie schneidet die Buchstaben ins Papier", "Sie brennt die Farbe mit Hitze ein"],
    },
    en: {
      title: "How Gutenberg's printing worked", summary: "Cast type, a composing stick and a screw press – and books become affordable.",
      goal: "You can describe the three steps of printing – casting, setting, printing – and explain why it mattered so much.",
      labels: ["Printing press", "Hand mould", "Liquid metal", "Mirror-image letter", "Composing stick", "Line by line into a page", "Ink ball: ink onto the type", "Screw", "The platen presses the paper", "Printed page"],
      steps: [
        "Around 1440 Johannes Gutenberg developed printing in Mainz. It had two parts: movable type made of metal and a printing press.",
        "The letters were cast. Gutenberg's hand mould held a matrix, and liquid metal flowed in through a channel. Because the matrices could be exchanged, every letter could be made in any number and the same size – as a mirror image.",
        "The compositor lined up the letters in the composing stick into lines until a whole page was together. Setting ready-made letters was much simpler and faster than making a printing block for every page.",
        "The inked forme went into the press. Through a screw the platen pressed the paper evenly onto the type – the page was printed. This turned the book into a mass product that far more people could afford.",
      ],
      predict: ["The page is set and covered with ink. What does the press do now?", "It presses the paper evenly onto the type", "It cuts the letters into the paper", "It burns the ink in with heat"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
