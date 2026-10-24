// Content batch (24.10.2026): how the brain is built (3D scene "brain", real model from Z-Anatomy). Every statement is
// taken from the linked articles, word-for-word evidence below. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-anatomy-5.mjs   → the question
//   node content/_batches/2026-10-animations-anatomy-5.mjs                                   → the animation (idempotent)
//
// Evidence (de.wikipedia.org):
//   Frontallappen: "jeweils die vorderen Lappen (Lobi) der beiden Hälften des Großhirns" · "Der Frontallappen bildet einen
//     von vier Teilen des Neokortex, die jeweils unterschiedliche Aufgaben übernehmen" · "Beim Menschen macht er mehr als 30 %
//     der Großhirnrinde aus" · "er steuert und kontrolliert also Bewegungen"
//   Parietallappen: "Der untere Bereich ist für das räumliche Denken und „quasi-räumliche“ Prozesse wie Rechnen und Lesen zuständig"
//   Temporallappen: "macht dessen laterobasalen (seitlich und unten gelegenen) Anteil aus" · "Der Temporallappen enthält den primären auditorischen Cortex, das Wernicke-Sprachzentrum und wichtige
//     Strukturen für das Gedächtnis"
//   Occipitallappen: "ist der hinterste Anteil des Großhirns" · "verarbeitet er die visuellen Impulse, weshalb er das
//     Sehzentrum des Gehirns ist"
//   Kleinhirn: "liegt beim Menschen unterhalb der Okzipitallappen des Großhirns" · "Es ist zuständig für Koordination, Feinabstimmung, unbewusste Planung und das Erlernen von Bewegungsabläufen" ·
//     "doch enthält es mit knapp 70 Milliarden Nervenzellen etwa vier Fünftel, also den Großteil aller zentralnervösen Neuronen"
//   Hirnstamm: "Der Hirnstamm steuert viele für den Körper überlebenswichtige Funktionen, wie die Atmung, Herzfrequenz oder den
//     Blutdruck"
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-24";
export const verification = "ai_checked";

export const questions = [
  ["qa-gehirn", "science", 2, 10, null, "Welcher Teil des Großhirns ist das Sehzentrum?", ["Der Hinterhauptslappen", "Der Stirnlappen", "Der Schläfenlappen", "Der Scheitellappen"], 0, "Der Hinterhauptslappen ist der hinterste Teil des Großhirns. Er verarbeitet die Impulse aus den Augen und ist deshalb das Sehzentrum des Gehirns.", "Okzipitallappen", "Which part of the cerebrum is the visual centre?", ["The occipital lobe", "The frontal lobe", "The temporal lobe", "The parietal lobe"], "The occipital lobe is the rearmost part of the cerebrum. It processes the impulses from the eyes, which is why it is the brain's visual centre.", ["Anatomie", "Körper"]],
];

const animations = [
  {
    id: "a-gehirn", scene: "brain", category: "science", difficulty: 2, timing: [0.7, 1], sources: [wiki("Frontallappen"), wiki("Parietallappen"), wiki("Temporallappen"), wiki("Okzipitallappen"), wiki("Kleinhirn"), wiki("Hirnstamm")], quiz: "qa-gehirn", predict: [3, 0],
    de: {
      title: "Wie das Gehirn aufgebaut ist", summary: "Vier Lappen, ein Kleinhirn, ein Hirnstamm – jeder Teil mit eigenen Aufgaben.",
      goal: "Du kannst die Lappen des Großhirns, das Kleinhirn und den Hirnstamm zeigen und je eine ihrer Aufgaben nennen.",
      labels: ["Stirnlappen", "Scheitellappen", "Schläfenlappen", "Hinterhauptslappen", "Kleinhirn", "Hirnstamm", "Steuert Bewegungen", "Räumliches Denken, Rechnen, Lesen", "Hören, Sprache, Gedächtnis", "Sehzentrum", "Feinabstimmung der Bewegungen", "Atmung, Herzschlag, Blutdruck"],
      steps: [
        ["Das Großhirn hat zwei Hälften. Jede besteht aus vier Lappen, die unterschiedliche Aufgaben übernehmen: Stirnlappen, Scheitellappen, Schläfenlappen und Hinterhauptslappen.", 9],
        ["Ganz vorn liegt der Stirnlappen. Er macht beim Menschen mehr als 30 % der Großhirnrinde aus und steuert Bewegungen. Dahinter liegt der Scheitellappen: Sein unterer Teil ist für das räumliche Denken zuständig – und für Rechnen und Lesen.", 10],
        ["Seitlich unten liegt der Schläfenlappen mit dem Hörzentrum, dem Wernicke-Sprachzentrum und wichtigen Strukturen für das Gedächtnis. Ganz hinten liegt der Hinterhauptslappen: Er verarbeitet die Impulse aus den Augen – das Sehzentrum.", 10],
        ["Unter dem Großhirn sitzt das Kleinhirn. Es ist zuständig für die Koordination, die Feinabstimmung und das Erlernen von Bewegungen – und enthält mit knapp 70 Milliarden etwa vier Fünftel aller Nervenzellen von Gehirn und Rückenmark. Der Hirnstamm steuert überlebenswichtige Dinge wie Atmung, Herzschlag und Blutdruck.", 11],
      ],
      predict: ["Unter dem Großhirn sitzt das Kleinhirn. Wobei hilft es vor allem?", "Bewegungen fein abzustimmen", "Gerüche zu erkennen", "Das Blut zu reinigen"],
    },
    en: {
      title: "How the brain is built", summary: "Four lobes, a cerebellum, a brainstem – each part with its own tasks.",
      goal: "You can point to the lobes of the cerebrum, the cerebellum and the brainstem and name one of their tasks each.",
      labels: ["Frontal lobe", "Parietal lobe", "Temporal lobe", "Occipital lobe", "Cerebellum", "Brainstem", "Controls movements", "Spatial thinking, arithmetic, reading", "Hearing, language, memory", "Visual centre", "Fine-tunes movements", "Breathing, heartbeat, blood pressure"],
      steps: [
        "The cerebrum has two halves. Each consists of four lobes that take on different tasks: the frontal, parietal, temporal and occipital lobes.",
        "At the very front lies the frontal lobe. In humans it makes up more than 30 % of the cerebral cortex and controls movements. Behind it lies the parietal lobe: its lower part is responsible for spatial thinking – and for arithmetic and reading.",
        "At the side and lower down lies the temporal lobe with the hearing centre, Wernicke's language area and important structures for memory. At the very back lies the occipital lobe: it processes the impulses from the eyes – the visual centre.",
        "Below the cerebrum sits the cerebellum. It is responsible for coordinating, fine-tuning and learning movements – and with almost 70 billion it contains about four fifths of all nerve cells of the brain and spinal cord. The brainstem controls vital things such as breathing, heartbeat and blood pressure.",
      ],
      predict: ["Below the cerebrum sits the cerebellum. What does it mainly help with?", "Fine-tuning movements", "Recognising smells", "Cleaning the blood"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
