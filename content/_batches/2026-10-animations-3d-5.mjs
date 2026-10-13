// Content batch (21.10.2026): two new 3D animations – eclipses, greenhouse effect – with their check questions. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-3d-5.mjs   → the questions
//   node content/_batches/2026-10-animations-3d-5.mjs                                   → the animations (idempotent)
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-21";
export const verification = "ai_checked";

export const questions = [
  ["qa-finsternis", "science", 2, 10, null, "Warum gibt es nicht bei jedem Neumond eine Sonnenfinsternis?", ["Weil der Mond dafür meist zu weit entfernt ist", "Weil die Erde sich zu schnell dreht", "Weil die Mondbahn geneigt ist: Der Mond zieht meist über oder unter der Linie Sonne–Erde vorbei", "Weil Neumond nur zweimal im Jahr vorkommt"], 2, "Die Mondbahn ist um rund fünf Grad gegen die Erdbahn geneigt. Nur wenn Neumond oder Vollmond gerade dort eintritt, wo sich beide Bahnebenen schneiden, stehen Sonne, Mond und Erde auf einer Linie.", "Sonnenfinsternis", "Why is there not a solar eclipse at every new moon?", ["Because the Moon is usually too far away for that", "Because the Earth spins too fast", "Because the Moon's orbit is tilted: the Moon usually passes above or below the line from the Sun to the Earth", "Because a new moon only happens twice a year"], "The Moon's orbit is tilted by about five degrees against the Earth's orbit. Only when a new or full moon happens just where the two orbital planes cross are the Sun, Moon and Earth in one line.", ["Mond", "Astronomie"]],
  ["qa-treibhaus", "earth", 2, 10, null, "Was bewirken Treibhausgase wie CO₂ in der Atmosphäre?", ["Sie halten das Sonnenlicht von der Erde fern", "Sie nehmen Wärmestrahlung der Erde auf und schicken einen Teil zurück", "Sie erzeugen selbst Wärme", "Sie kühlen die Luft in großer Höhe ab und lassen es regnen"], 1, "Sonnenlicht gelangt fast ungehindert zum Boden. Die Wärmestrahlung, die der Boden abgibt, wird von Treibhausgasen aufgenommen und in alle Richtungen wieder abgegeben – auch zurück zur Erde. Ohne diesen Effekt läge die Durchschnittstemperatur bei etwa −18 °C.", "Treibhauseffekt", "What do greenhouse gases such as CO₂ do in the atmosphere?", ["They keep sunlight away from the Earth", "They absorb heat radiation from the Earth and send part of it back", "They produce heat themselves", "They cool the air at great heights and make it rain"], "Sunlight reaches the ground almost unhindered. The heat radiation the ground gives off is absorbed by greenhouse gases and emitted again in all directions – also back to the Earth. Without this effect the average temperature would be about −18 °C.", ["Klima", "Atmosphäre"]],
];

const animations = [
  {
    id: "a-finsternis", scene: "eclipse", category: "science", timing: [0.7, 1.3], sources: [wiki("Sonnenfinsternis"), wiki("Mondfinsternis")], quiz: "qa-finsternis", predict: [2, 1],
    de: {
      title: "Wie Finsternisse entstehen", summary: "Mal verdeckt der Mond die Sonne, mal taucht er in den Schatten der Erde – aber nur, wenn alles auf einer Linie steht.",
      goal: "Du kannst Sonnen- und Mondfinsternis unterscheiden und erklären, warum sie selten sind.",
      labels: ["Sonnenlicht", "Erde", "Mond", "Mondbahn: um 5° geneigt (hier übertrieben)", "Sonnenfinsternis", "Mondschatten", "Mondfinsternis", "Erdschatten", "meist zieht der Mond am Schatten vorbei"],
      steps: [["Der Mond umrundet die Erde einmal im Monat. Seine Bahn ist aber um etwa fünf Grad geneigt: Meist zieht er über oder unter der Linie zwischen Sonne und Erde vorbei.", 8], ["Steht der Neumond genau auf dieser Linie, fällt sein Schatten auf die Erde. In einem schmalen Streifen verdeckt er die Sonne: eine Sonnenfinsternis.", 8], ["Steht der Vollmond genau hinter der Erde, taucht er in ihren Schatten: eine Mondfinsternis. Er verschwindet nicht, sondern leuchtet rötlich – die Lufthülle der Erde lenkt rotes Licht in den Schatten.", 10], ["Eine Mondfinsternis sieht die ganze Nachtseite der Erde, eine Sonnenfinsternis nur ein schmaler Streifen. Meist aber verfehlt der Mond die Linie – deshalb sind Finsternisse selten.", 9]],
      predict: ["Zwei Wochen später steht der Mond auf der anderen Seite – genau hinter der Erde. Was passiert mit ihm?", "Er leuchtet besonders hell", "Er gerät in den Schatten der Erde", "Er verdeckt die Sonne"],
    },
    en: {
      title: "How eclipses happen", summary: "Sometimes the Moon covers the Sun, sometimes it dips into the Earth's shadow – but only when everything is in one line.",
      goal: "You can tell a solar from a lunar eclipse and explain why they are rare.",
      labels: ["Sunlight", "Earth", "Moon", "Moon's orbit: tilted by 5° (exaggerated here)", "Solar eclipse", "Moon's shadow", "Lunar eclipse", "Earth's shadow", "usually the Moon misses the shadow"],
      steps: ["The Moon goes around the Earth once a month. But its orbit is tilted by about five degrees: usually it passes above or below the line between the Sun and the Earth.", "If the new moon is exactly on this line, its shadow falls on the Earth. In a narrow strip it covers the Sun: a solar eclipse.", "If the full moon is exactly behind the Earth, it dips into the Earth's shadow: a lunar eclipse. It does not vanish but glows reddish – the Earth's atmosphere bends red light into the shadow.", "A lunar eclipse is seen by the whole night side of the Earth, a solar eclipse only by a narrow strip. Mostly, though, the Moon misses the line – which is why eclipses are rare."],
      predict: ["Two weeks later the Moon is on the other side – exactly behind the Earth. What happens to it?", "It shines especially brightly", "It moves into the Earth's shadow", "It covers the Sun"],
    },
  },
  {
    id: "a-treibhauseffekt", scene: "greenhouse", category: "earth", timing: [0.7, 1.3], sources: [wiki("Treibhauseffekt"), wiki("Kohlenstoffdioxid_in_der_Erdatmosphäre")], quiz: "qa-treibhaus", predict: [3, 1],
    de: {
      title: "Wie der Treibhauseffekt funktioniert", summary: "Sonnenlicht kommt herein, Wärme will hinaus – und Treibhausgase halten einen Teil davon zurück.",
      goal: "Du kannst erklären, warum die Erde ohne Treibhausgase eisig wäre und warum zusätzliches CO₂ sie erwärmt.",
      labels: ["Sonnenlicht", "Wärmestrahlung", "Treibhausgase (CO₂, Wasserdampf, Methan)", "ohne Treibhausgase: −18 °C", "natürlicher Treibhauseffekt: etwa +15 °C", "mehr CO₂ – mehr Wärme bleibt", "Weltraum"],
      steps: [["Sonnenlicht durchquert die Luft fast ungehindert. Es trifft auf den Boden und die Meere und erwärmt sie.", 7], ["Der warme Boden gibt die Energie als unsichtbare Wärmestrahlung wieder ab. Könnte sie ungehindert ins All entweichen, läge die Durchschnittstemperatur der Erde bei etwa −18 Grad.", 9], ["Treibhausgase wie Wasserdampf, CO₂ und Methan nehmen Wärmestrahlung auf und geben sie in alle Richtungen wieder ab – auch zurück zum Boden. Dieser natürliche Treibhauseffekt macht die Erde mit rund +15 Grad erst bewohnbar.", 10], ["Beim Verbrennen von Kohle, Öl und Gas entsteht zusätzliches CO₂. Sein Anteil in der Luft ist seit Beginn der Industrialisierung um etwa die Hälfte gestiegen. Mehr Wärme bleibt in der Atmosphäre – die Erde erwärmt sich.", 10]],
      predict: ["Durch Kohle, Öl und Gas gelangt zusätzliches CO₂ in die Luft. Was passiert mit der Wärmestrahlung der Erde?", "Mehr davon entweicht ins All", "Mehr davon wird zurückgehalten", "Es ändert sich nichts"],
    },
    en: {
      title: "How the greenhouse effect works", summary: "Sunlight comes in, heat wants out – and greenhouse gases hold part of it back.",
      goal: "You can explain why the Earth would be icy without greenhouse gases and why additional CO₂ warms it.",
      labels: ["Sunlight", "Heat radiation", "Greenhouse gases (CO₂, water vapour, methane)", "without greenhouse gases: −18 °C", "natural greenhouse effect: about +15 °C", "more CO₂ – more heat stays", "Space"],
      steps: ["Sunlight passes through the air almost unhindered. It hits the ground and the seas and warms them.", "The warm ground gives the energy off again as invisible heat radiation. If it could escape into space unhindered, the Earth's average temperature would be about −18 degrees.", "Greenhouse gases such as water vapour, CO₂ and methane absorb heat radiation and emit it again in all directions – also back to the ground. This natural greenhouse effect is what makes the Earth habitable, at about +15 degrees.", "Burning coal, oil and gas produces additional CO₂. Its share in the air has risen by about half since the start of industrialisation. More heat stays in the atmosphere – the Earth warms."],
      predict: ["Coal, oil and gas put additional CO₂ into the air. What happens to the Earth's heat radiation?", "More of it escapes into space", "More of it is held back", "Nothing changes"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
