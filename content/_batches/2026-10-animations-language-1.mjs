// Content batch (25.10.2026): how we form sounds (3D scene "mouth", real model from Z-Anatomy). Every statement is taken
// from the linked articles, word-for-word evidence below. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-language-1.mjs   → the question
//   node content/_batches/2026-10-animations-language-1.mjs                                   → the animation (idempotent)
//
// Evidence (de.wikipedia.org):
//   Stimmlippe: "paarige schwingungsfähige Strukturen im Kehlkopf" · "Die Stimmlippen werden beidseits bei der Phonation
//     (Stimmgebung) durch Anblasen aus dem Brustkorb in Schwingungen versetzt (Bernoulli-Effekt) und bilden so den Primärschall
//     der Stimme"
//   Vokal: "bei dessen Artikulation der Phonationsstrom weitgehend ungehindert durch den Mund ausströmen kann" · "In der
//     Waagerechten werden sie in vorne (e-, i-Laute) oder hinten (o-, u-Laute) im Mundraum entstehend unterteilt" · "von offen
//     (a-Laut) nach geschlossen (i-, u-Laut) angeordnet"
//   Konsonant: "Konsonanten sind hierbei Laute, bei denen der ausgeatmete Luftstrom an einer der Artikulationsstellen wie Gaumen,
//     Lippen, Zähne gehemmt wird" · "Bei den Verschlusslauten wird der Luftstrom kurzzeitig ganz unterbrochen, und bei der
//     plötzlichen Freigabe der Blockade entsteht eine hörbare Turbulenz" · "beim /k/ wie in Karte der Zungenrücken (lat. dorsum)
//     den Verschluss mit dem Velum" · "Der flexibelste und wichtigste Artikulator ist die Zunge, so dass die Mehrzahl der
//     Artikulator-Merkmale auf die verschiedenen Teile der Zunge zurückgehen"
//   Artikulationsort: "Ein Alveolar wird am Zahndamm, den Alveolen, gebildet. Beispiele: [t], [d], [s], [z]" · "Ein Velar wird am
//     Gaumensegel (lat. velum palatinum) gebildet."
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-25";
export const verification = "ai_checked";

export const questions = [
  ["qa-laute", "language", 1, 10, null, "Was bringt beim Sprechen die Stimmlippen im Kehlkopf zum Schwingen?", ["Die Luft aus dem Brustkorb", "Die Zunge", "Die Zähne", "Das Gaumensegel"], 0, "Die Stimmlippen werden von der Luft aus dem Brustkorb angeblasen und geraten in Schwingungen. So entsteht der Grundschall der Stimme, den Zunge und Mund dann zu Lauten formen.", "Stimmlippe", "What makes the vocal folds in the larynx vibrate when we speak?", ["The air from the chest", "The tongue", "The teeth", "The soft palate"], "The air from the chest blows against the vocal folds and sets them vibrating. That makes the basic sound of the voice, which the tongue and mouth then shape into speech sounds.", ["Sprache", "Körper"]],
];

const animations = [
  {
    id: "a-laute", scene: "mouth", category: "language", timing: [0.7, 1], sources: [wiki("Stimmlippe"), wiki("Vokal"), wiki("Konsonant"), wiki("Artikulationsort")], quiz: "qa-laute", predict: [3, 0],
    de: {
      title: "Wie wir Laute formen", summary: "Im Kehlkopf entsteht ein Ton – Zunge und Mund machen daraus Vokale und Konsonanten.",
      goal: "Du kannst erklären, wie die Stimme entsteht und wie die Zunge Vokale und Konsonanten wie t und k formt.",
      labels: ["Stimmlippen", "Kehlkopf", "Zunge", "Gaumensegel", "Zähne", "Luft strömt frei: Vokal", "i: Zunge vorne", "u: Zunge hinten", "a: Mund weit offen", "t: am Zahndamm", "k: Zungenrücken am Gaumensegel", "Schall"],
      steps: [
        ["Die Stimme entsteht im Kehlkopf. Die Stimmlippen werden von der Luft aus dem Brustkorb angeblasen, geraten in Schwingungen und bilden so den Grundschall der Stimme.", 9],
        ["Bei Vokalen strömt die Luft weitgehend ungehindert durch den Mund – die Zunge formt nur den Raum. Das i entsteht vorne im Mundraum, das u hinten; beim a ist der Mund weit offen.", 11],
        ["Bei Konsonanten wird der Luftstrom gehemmt – etwa am Gaumen, an den Zähnen oder an den Lippen. Das t wird am Zahndamm hinter den oberen Zähnen gebildet: Der Luftstrom wird kurz unterbrochen und dann plötzlich freigegeben.", 10],
        ["Beim k wie in „Karte“ bildet der Zungenrücken den Verschluss mit dem Gaumensegel. Die Zunge ist das beweglichste und wichtigste Werkzeug beim Sprechen: Die meisten Merkmale der Laute gehen auf ihre verschiedenen Teile zurück.", 10],
      ],
      predict: ["Gleich kommt das k wie in „Karte“. Wo verschließt die Zunge den Weg der Luft?", "Hinten am Gaumensegel", "Vorne an den Lippen", "An den Schneidezähnen"],
    },
    en: {
      title: "How we form sounds", summary: "A tone starts in the larynx – the tongue and mouth turn it into vowels and consonants.",
      goal: "You can explain how the voice is made and how the tongue forms vowels and consonants such as t and k.",
      labels: ["Vocal folds", "Larynx", "Tongue", "Soft palate", "Teeth", "Air flows freely: vowel", "i: tongue at the front", "u: tongue at the back", "a: mouth wide open", "t: at the tooth ridge", "k: back of the tongue at the soft palate", "Sound"],
      steps: [
        "The voice starts in the larynx. Air from the chest blows against the vocal folds, sets them vibrating and so makes the basic sound of the voice.",
        "For vowels the air flows out through the mouth largely unhindered – the tongue only shapes the space. The i is made at the front of the mouth, the u at the back; for the a the mouth is wide open.",
        "For consonants the airflow is held up – for example at the palate, the teeth or the lips. The t is made at the ridge behind the upper teeth: the airflow is briefly stopped and then suddenly released.",
        "For the k as in “Karte” the back of the tongue closes against the soft palate. The tongue is the most flexible and important tool for speaking: most features of speech sounds come from its different parts.",
      ],
      predict: ["Next comes the k as in “Karte”. Where does the tongue close the way for the air?", "At the back, at the soft palate", "At the front, at the lips", "At the front teeth"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
