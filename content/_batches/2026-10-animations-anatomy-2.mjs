// Content batch (24.10.2026): breathing – how the diaphragm moves air into the lungs (3D scene "lungs", real model
// from Z-Anatomy). Every statement is taken from the linked articles, word-for-word evidence below. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-anatomy-2.mjs   → the question
//   node content/_batches/2026-10-animations-anatomy-2.mjs                                   → the animation (idempotent)
//
// Evidence (de.wikipedia.org):
//   Zwerchfell: "eine Muskel-Sehnen-Platte, welche bei Säugetieren quer zur Körperachse unterhalb des Brustkorbs verläuft und die
//     Brust- und die Bauchhöhle voneinander trennt" · "Es hat eine kuppelförmige Gestalt und ist der wichtigste Atemmuskel" ·
//     "Das zum Brustraum gewölbte Zwerchfell kontrahiert sich beim Einatmen" · "Bei dieser Kontraktion flacht es sich ab" ·
//     "Durch diesen Vorgang wird der Brustraum vergrößert" · "wird mit der Vergrößerung der Brusthöhle auch die Lunge erweitert" ·
//     "Nun strömt bei geöffneter Stimmritze Luft in die Lungen, da der äußere Luftdruck größer ist als der Druck in der Lunge" ·
//     "Beim Ausatmen (Exspiration) entspannt sich das Zwerchfell. Durch die elastischen Fasern in der Lunge sowie die
//     Oberflächenkräfte in den Lungenbläschen (Retraktionskräfte) zieht sich die Lunge zusammen und das Zwerchfell wieder in die
//     Kuppelform zurück. Die Ausatmung vollzieht sich während der Atmung in Ruhe also ohne aktive Mitwirkung von Muskeln."
//   Lunge: "die Säugetierlunge besitzt keine Muskulatur" · "(ähnlich wie bei einer Feder, die zunächst gespannt und dann
//     losgelassen wird), die der Lunge die „verbrauchte“ Luft austreibt"
//   Lungenventilation: "Die Luftröhre verzweigt sich in die beiden Äste der Bronchien" · "Am Ende befinden sich die Lungenbläschen
//     in der Lunge, durch deren dünne Membran Sauerstoff in die Blutgefäße übertritt und auf umgekehrtem Weg Kohlenstoffdioxid aus
//     dem Blut über die Alveolarluft in die Luft abgegeben wird."
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-24";
export const verification = "ai_checked";

export const questions = [
  ["qa-atmung", "science", 1, 10, null, "Was macht das Zwerchfell, wenn du einatmest?", ["Es zieht sich zusammen und flacht sich ab", "Es entspannt sich und wölbt sich nach oben", "Es bleibt ganz ruhig liegen", "Es drückt die Lunge nach oben"], 0, "Das Zwerchfell zieht sich beim Einatmen zusammen und flacht sich dabei ab. So wird der Brustraum größer, die Lunge dehnt sich mit, und Luft strömt hinein.", "Zwerchfell", "What does the diaphragm do when you breathe in?", ["It contracts and flattens", "It relaxes and arches upwards", "It stays completely still", "It pushes the lungs upwards"], "The diaphragm contracts when you breathe in and flattens as it does. The chest cavity gets bigger, the lungs expand with it, and air flows in.", ["Anatomie", "Körper"]],
];

const animations = [
  {
    id: "a-atmung", scene: "lungs", category: "science", timing: [0.7, 1], sources: [wiki("Zwerchfell"), wiki("Lunge"), wiki("Lungenventilation")], quiz: "qa-atmung", predict: [2, 1],
    de: {
      title: "Wie wir atmen", summary: "Die Lunge hat keine eigenen Muskeln – ein Muskel darunter macht die Arbeit: das Zwerchfell.",
      goal: "Du kannst erklären, wie das Zwerchfell Luft in die Lunge holt und warum das Ausatmen in Ruhe von allein geht.",
      labels: ["Lunge", "Zwerchfell", "Luftröhre", "Bronchien", "Rippen", "Zwerchfell zieht sich zusammen – flacht ab", "Luft strömt hinein", "Zwerchfell entspannt sich", "Lungenbläschen", "Sauerstoff ins Blut", "Kohlenstoffdioxid in die Luft", "Luft strömt hinaus"],
      steps: [
        ["Unterhalb des Brustkorbs liegt das Zwerchfell: eine kuppelförmige Muskel-Sehnen-Platte, die Brust- und Bauchhöhle voneinander trennt. Es ist der wichtigste Atemmuskel – die Lunge selbst besitzt keine Muskeln.", 9],
        ["Beim Einatmen zieht sich das Zwerchfell zusammen und flacht sich ab. Der Brustraum wird größer, und die Lunge dehnt sich mit. Weil der Luftdruck außen nun größer ist als in der Lunge, strömt Luft hinein.", 9],
        ["Beim Ausatmen entspannt sich das Zwerchfell. Die gedehnte Lunge zieht sich durch ihre elastischen Fasern wieder zusammen – wie eine losgelassene Feder – und treibt die verbrauchte Luft hinaus. In Ruhe arbeitet dabei kein Muskel aktiv mit.", 10],
        ["Die Luft strömt durch die Luftröhre, die sich in die Bronchien verzweigt, bis in die Lungenbläschen. Durch deren dünne Wand tritt Sauerstoff ins Blut über, und Kohlenstoffdioxid wird aus dem Blut an die Luft abgegeben.", 11],
      ],
      predict: ["Gleich atmest du aus. Muss dafür in Ruhe ein Muskel arbeiten?", "Ja – das Zwerchfell drückt die Luft hinaus", "Nein – die gedehnte Lunge zieht sich von selbst zusammen", "Ja – die Lunge pumpt mit eigenen Muskeln"],
    },
    en: {
      title: "How we breathe", summary: "The lungs have no muscles of their own – a muscle below them does the work: the diaphragm.",
      goal: "You can explain how the diaphragm draws air into the lungs and why breathing out at rest happens by itself.",
      labels: ["Lungs", "Diaphragm", "Windpipe", "Bronchi", "Ribs", "Diaphragm contracts – flattens", "Air flows in", "Diaphragm relaxes", "Air sacs (alveoli)", "Oxygen into the blood", "Carbon dioxide into the air", "Air flows out"],
      steps: [
        "Below the rib cage lies the diaphragm: a dome-shaped plate of muscle and tendon that separates the chest from the abdomen. It is the most important breathing muscle – the lungs themselves have no muscles.",
        "When you breathe in, the diaphragm contracts and flattens. The chest cavity gets bigger and the lungs expand with it. Because the air pressure outside is now higher than inside the lungs, air flows in.",
        "When you breathe out, the diaphragm relaxes. The stretched lungs pull together again through their elastic fibres – like a spring being let go – and push the used air out. At rest no muscle actively takes part.",
        "The air flows through the windpipe, which branches into the bronchi, all the way into the air sacs. Through their thin walls oxygen passes into the blood, and carbon dioxide is released from the blood into the air.",
      ],
      predict: ["You are about to breathe out. Does a muscle have to work for that at rest?", "Yes – the diaphragm pushes the air out", "No – the stretched lungs pull together by themselves", "Yes – the lungs pump with their own muscles"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
