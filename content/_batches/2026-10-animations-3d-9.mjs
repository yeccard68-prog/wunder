// Content batch (15.10.2026): a new 3D animation – photosynthesis – with its check question. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-3d-9.mjs   → the question
//   node content/_batches/2026-10-animations-3d-9.mjs                                   → the animation (idempotent)
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-15";
export const verification = "ai_checked";

export const questions = [
  ["qa-photosynthese", "earth", 2, 13, null, "Warum sehen die meisten Blätter grün aus?", ["Weil Chlorophyll vor allem rotes und blaues Licht schluckt und grünes zurückwirft", "Weil Blätter grünes Licht besonders gut verwerten", "Weil das Wasser in den Blättern grün ist", "Weil sie Sauerstoff enthalten"], 0, "Der Blattfarbstoff Chlorophyll nutzt vor allem rotes und blaues Licht. Grünes Licht wird größtenteils zurückgeworfen oder durchgelassen – und genau das sehen wir.", "Chlorophylle", "Why do most leaves look green?", ["Because chlorophyll mainly absorbs red and blue light and reflects green", "Because leaves use green light particularly well", "Because the water in the leaves is green", "Because they contain oxygen"], "The leaf pigment chlorophyll mainly uses red and blue light. Green light is largely reflected or let through – and that is exactly what we see.", ["Pflanzen", "Biologie"]],
];

const animations = [
  {
    id: "a-photosynthese", scene: "photosynthesis", category: "earth", timing: [0.7, 1.3], sources: [wiki("Photosynthese"), wiki("Chlorophylle"), wiki("Stoma_(Botanik)")], quiz: "qa-photosynthese", predict: [2, 0],
    de: {
      title: "Wie ein Blatt aus Licht Zucker macht", summary: "Licht, Wasser und Luft – mehr braucht ein Blatt nicht, um Nahrung herzustellen und Sauerstoff abzugeben.",
      goal: "Du kannst die Zutaten und Produkte der Photosynthese nennen und erklären, warum Blätter grün aussehen.",
      labels: ["Sonnenlicht", "Wasser aus den Wurzeln", "Kohlendioxid aus der Luft", "Spaltöffnungen auf der Unterseite", "Chlorophyll schluckt Rot und Blau", "Grün wird zurückgeworfen", "Zucker (Glukose)", "Sauerstoff", "6 CO₂ + 6 H₂O → Zucker + 6 O₂", "Zucker wandert in die Pflanze"],
      steps: [["Ein Blatt braucht drei Zutaten: Sonnenlicht, Wasser, das die Wurzeln aus dem Boden holen, und Kohlendioxid aus der Luft. Das Gas gelangt durch winzige Spaltöffnungen, die meist auf der Blattunterseite liegen.", 9], ["In den Blattzellen sitzen Chloroplasten mit dem Farbstoff Chlorophyll. Er schluckt vor allem rotes und blaues Licht und nutzt dessen Energie. Grünes Licht wird größtenteils zurückgeworfen – deshalb sehen Blätter grün aus.", 9], ["Mit der Energie des Lichts baut das Blatt aus Wasser und Kohlendioxid Zucker. Dabei wird Sauerstoff frei und durch die Spaltöffnungen abgegeben. Er stammt übrigens aus dem Wasser, nicht aus dem Kohlendioxid.", 9], ["Der Zucker wird über die Leitbahnen in die ganze Pflanze gebracht. Sie nutzt ihn als Energie und baut daraus zum Beispiel Stärke und Zellulose. Nachts ruht die Photosynthese; die Pflanze atmet dann nur – und verbraucht dabei ein wenig Sauerstoff.", 10]],
      predict: ["Gleich baut das Blatt aus Wasser und Kohlendioxid Zucker. Was gibt es dabei an die Luft ab?", "Sauerstoff", "Kohlendioxid", "Stickstoff"],
    },
    en: {
      title: "How a leaf makes sugar from light", summary: "Light, water and air – that is all a leaf needs to make food and give off oxygen.",
      goal: "You can name the ingredients and products of photosynthesis and explain why leaves look green.",
      labels: ["Sunlight", "water from the roots", "carbon dioxide from the air", "pores on the underside", "chlorophyll absorbs red and blue", "green is reflected", "sugar (glucose)", "oxygen", "6 CO₂ + 6 H₂O → sugar + 6 O₂", "sugar travels into the plant"],
      steps: ["A leaf needs three ingredients: sunlight, water that the roots draw from the soil, and carbon dioxide from the air. The gas gets in through tiny pores, which are mostly on the underside of the leaf.", "The leaf cells contain chloroplasts with the pigment chlorophyll. It mainly absorbs red and blue light and uses its energy. Green light is largely reflected – which is why leaves look green.", "With the energy of the light, the leaf builds sugar from water and carbon dioxide. Oxygen is released and given off through the pores. Incidentally, it comes from the water, not from the carbon dioxide.", "The sugar is carried through the veins to the whole plant. The plant uses it for energy and builds things like starch and cellulose from it. At night photosynthesis rests; the plant then only breathes – and uses up a little oxygen."],
      predict: ["In a moment the leaf builds sugar from water and carbon dioxide. What does it give off into the air?", "Oxygen", "Carbon dioxide", "Nitrogen"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
