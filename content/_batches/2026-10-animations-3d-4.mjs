// Content batch (19.10.2026): three new 3D animations – seasons, phases of the Moon, lever – with
// their check questions. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-3d-4.mjs   → the questions
//   node content/_batches/2026-10-animations-3d-4.mjs                                   → the animations (idempotent)
import fs from "node:fs";
import { pathToFileURL } from "node:url";

export const LOCALE = "en";
export const TODAY = "2026-10-19";
export const verification = "ai_checked";

export const questions = [
  ["qa-jahreszeiten", "earth", 2, 10, null, "Warum ist es bei uns im Sommer wärmer als im Winter?", ["Weil die Erde der Sonne dann näher ist", "Weil die Erdachse geneigt ist: Die Sonne steht höher und scheint länger", "Weil die Sonne im Sommer stärker brennt", "Weil sich die Erde im Sommer langsamer dreht"], 1, "Die Erdachse ist um 23,4 Grad geneigt. Im Nordsommer ist die Nordhalbkugel der Sonne zugewandt – das Licht trifft steiler auf und die Tage sind länger. Der Sonne am nächsten ist die Erde Anfang Januar.", "Jahreszeit", "Why is it warmer in summer than in winter where we live?", ["Because the Earth is closer to the Sun then", "Because the Earth's axis is tilted: the Sun is higher and shines longer", "Because the Sun burns more strongly in summer", "Because the Earth spins more slowly in summer"], "The Earth's axis is tilted by 23.4 degrees. In the northern summer the northern hemisphere faces the Sun – the light arrives more steeply and the days are longer. The Earth is closest to the Sun in early January.", ["Jahreszeiten", "Erde"]],
  ["qa-mondphasen", "science", 2, 10, null, "Warum sehen wir den Mond bei Neumond nicht?", ["Die Erde wirft ihren Schatten auf ihn", "Er steht zwischen Erde und Sonne – wir blicken auf seine unbeleuchtete Seite", "Er steht hinter der Sonne", "Er leuchtet nur in der zweiten Monatshälfte"], 1, "Bei Neumond steht der Mond von uns aus in Richtung Sonne. Die Sonne beleuchtet seine Rückseite, uns zeigt er die dunkle Hälfte. Der Erdschatten trifft den Mond nur bei einer Mondfinsternis.", "Mondphase", "Why can we not see the Moon at new moon?", ["The Earth casts its shadow on it", "It is between the Earth and the Sun – we look at its unlit side", "It is behind the Sun", "It only shines in the second half of the month"], "At new moon the Moon is in the direction of the Sun as seen from us. The Sun lights its far side; it shows us the dark half. The Earth's shadow only falls on the Moon during a lunar eclipse.", ["Mond", "Astronomie"]],
  ["qa-hebel", "science", 2, 10, null, "Der Kraftarm eines Hebels ist dreimal so lang wie der Lastarm. Wie viel Kraft braucht man, um die Last zu heben?", ["Dreimal so viel wie die Last wiegt", "Genauso viel", "Ein Drittel", "Ein Neuntel"], 2, "Hebelgesetz: Kraft mal Kraftarm gleich Last mal Lastarm. Ein dreimal so langer Kraftarm heißt ein Drittel der Kraft – dafür muss die Hand den dreifachen Weg zurücklegen.", "Hebel_(Physik)", "The force arm of a lever is three times as long as the load arm. How much force is needed to lift the load?", ["Three times the weight of the load", "The same", "One third", "One ninth"], "Law of the lever: force times force arm equals load times load arm. A force arm three times as long means a third of the force – in return the hand has to travel three times the distance.", ["Mechanik", "Hebel"]],
];

const W = (title) => ({ name: "Wikipedia: " + title.replaceAll("_", " "), url: "https://de.wikipedia.org/wiki/" + title });
// [id, scene, category, [pace, motion], sources, quiz, de, en, predict]; de/en = { title, summary, goal, labels, steps: [text, seconds][] }
const animations = [
  {
    id: "a-jahreszeiten", scene: "seasons", category: "earth", timing: [0.7, 1.3], sources: [W("Jahreszeit"), W("Ekliptik")], quiz: "qa-jahreszeiten",
    de: {
      title: "Warum es Jahreszeiten gibt", summary: "Nicht die Entfernung zur Sonne macht den Sommer – sondern die schiefe Erdachse.",
      goal: "Du kannst erklären, warum es im Sommer wärmer ist als im Winter und warum auf der Südhalbkugel dann Winter herrscht.",
      labels: ["Sonne", "Erdachse, 23,4° geneigt", "Äquator", "Juni: Sommer im Norden", "Dezember: Winter im Norden", "März", "September"],
      steps: [["Die Erde dreht sich um eine Achse, die schief steht: Sie ist um 23,4 Grad geneigt. Während die Erde um die Sonne wandert, zeigt die Achse immer in dieselbe Richtung.", 7], ["Im Juni ist die Nordhalbkugel zur Sonne geneigt. Das Sonnenlicht trifft dort steiler auf, und die Tage sind lang: Im Norden ist Sommer, im Süden Winter.", 8], ["Ein halbes Jahr später steht die Erde auf der anderen Seite der Sonne. Die Achse zeigt noch genauso – jetzt ist der Norden von der Sonne weggeneigt: Winter im Norden, Sommer im Süden.", 9], ["Mit der Entfernung hat das nichts zu tun: Der Sonne am nächsten ist die Erde Anfang Januar – mitten im Nordwinter. Im März und September werden beide Halbkugeln gleich beschienen.", 9]],
      predict: ["Ein halbes Jahr später steht die Erde auf der anderen Seite der Sonne. Wohin zeigt ihre Achse dann?", "Sie hat sich zur Sonne mitgedreht", "In dieselbe Richtung wie zuvor", "Sie steht jetzt senkrecht"],
    },
    en: {
      title: "Why there are seasons", summary: "It is not the distance to the Sun that makes summer – it is the tilted axis of the Earth.",
      goal: "You can explain why summer is warmer than winter and why it is winter in the southern hemisphere at that time.",
      labels: ["Sun", "Earth's axis, tilted 23.4°", "Equator", "June: summer in the north", "December: winter in the north", "March", "September"],
      steps: ["The Earth spins around an axis that is not upright: it is tilted by 23.4 degrees. While the Earth travels around the Sun, the axis always points in the same direction.", "In June the northern hemisphere is tilted towards the Sun. Sunlight arrives more steeply there and the days are long: it is summer in the north and winter in the south.", "Half a year later the Earth is on the other side of the Sun. The axis still points the same way – now the north is tilted away from the Sun: winter in the north, summer in the south.", "Distance has nothing to do with it: the Earth is closest to the Sun in early January – in the middle of the northern winter. In March and September both hemispheres are lit equally."],
      predict: ["Half a year later the Earth is on the other side of the Sun. Where does its axis point then?", "It has turned along towards the Sun", "In the same direction as before", "It is upright now"],
    },
    predict: [2, 1],
  },
  {
    id: "a-mondphasen", scene: "moon", category: "science", timing: [0.7, 1.3], sources: [W("Mondphase"), W("Mond")], quiz: "qa-mondphasen",
    de: {
      title: "Wie die Mondphasen entstehen", summary: "Der Mond ist immer zur Hälfte beleuchtet – wir sehen nur unterschiedlich viel davon.",
      goal: "Du kannst erklären, warum der Mond als Sichel, Halbmond oder Vollmond erscheint und was bei Neumond passiert.",
      labels: ["Sonnenlicht", "Erde", "Mond", "Neumond", "zunehmender Halbmond", "Vollmond", "abnehmender Halbmond", "Blick von der Erde"],
      steps: [["Der Mond umrundet die Erde. Die Sonne beleuchtet immer genau eine Hälfte von ihm – die Hälfte, die ihr zugewandt ist. Die Abstände sind hier stark verkürzt.", 7], ["Wir wechseln den Standort und schauen von der Erde aus. Steht der Mond zwischen Erde und Sonne, blicken wir auf seine unbeleuchtete Seite: Neumond.", 8], ["Der Mond wandert weiter. Erst sehen wir eine schmale Sichel, nach einer Woche die halbe Scheibe, nach zwei Wochen die ganze beleuchtete Hälfte: Vollmond.", 10], ["Danach nimmt er wieder ab, bis zum nächsten Neumond. Von Neumond zu Neumond vergehen rund 29,5 Tage – daher kommt unser Monat.", 9]],
      predict: ["Der Mond wandert jetzt weiter um die Erde. Was sehen wir in den nächsten Tagen?", "Eine schmale Sichel, die breiter wird", "Sofort den Vollmond", "Gar nichts mehr, bis er einmal herum ist"],
    },
    en: {
      title: "How the phases of the Moon arise", summary: "Half of the Moon is always lit – we just see different amounts of it.",
      goal: "You can explain why the Moon appears as a crescent, a half or a full disc, and what happens at new moon.",
      labels: ["Sunlight", "Earth", "Moon", "New moon", "First quarter (waxing)", "Full moon", "Last quarter (waning)", "View from the Earth"],
      steps: ["The Moon orbits the Earth. The Sun always lights exactly one half of it – the half facing the Sun. Distances are greatly shortened here.", "We change our position and look from the Earth. When the Moon is between the Earth and the Sun, we look at its unlit side: new moon.", "The Moon moves on. First we see a thin crescent, after a week half the disc, after two weeks the whole lit half: full moon.", "Then it wanes again until the next new moon. From new moon to new moon takes about 29.5 days – that is where our month comes from."],
      predict: ["The Moon now moves on around the Earth. What do we see over the next days?", "A thin crescent that grows wider", "The full moon at once", "Nothing at all until it has gone round once"],
    },
    predict: [2, 0],
  },
  {
    id: "a-hebel", scene: "lever", category: "science", timing: [0.68, 1.4], sources: [W("Hebel_(Physik)")], quiz: "qa-hebel",
    de: {
      title: "Wie ein Hebel Kraft spart", summary: "Langer Arm, kleine Kraft: Mit einem Hebel hebt man Lasten, die man sonst nicht schafft.",
      goal: "Du kannst das Hebelgesetz anwenden und erklären, warum man mit weniger Kraft dafür einen längeren Weg braucht.",
      labels: ["Drehpunkt", "Last", "Kraft", "Lastarm", "Kraftarm", "4 × so lang – ¼ der Kraft", "4 × so weiter Weg"],
      steps: [["Ein Hebel ist eine Stange, die sich um einen festen Punkt dreht: den Drehpunkt. Auf der einen Seite liegt die Last, auf der anderen drückt die Kraft.", 7], ["Liegt der Drehpunkt genau in der Mitte, sind beide Arme gleich lang. Dann braucht man so viel Kraft, wie die Last wiegt – hier hält ein gleich schweres Gewicht die Waage.", 8], ["Rückt der Drehpunkt näher an die Last, wird der Kraftarm länger. Ist er viermal so lang wie der Lastarm, reicht ein Viertel der Kraft. Das ist das Hebelgesetz: Kraft mal Kraftarm gleich Last mal Lastarm.", 9], ["Geschenkt wird einem nichts: Die Hand muss viermal so weit nach unten wie die Last nach oben kommt. So funktionieren Brechstange, Schubkarre und Flaschenöffner.", 8]],
      predict: ["Der Drehpunkt rückt jetzt näher an die Last. Was passiert mit der Kraft, die man zum Heben braucht?", "Sie wird größer", "Sie bleibt gleich", "Sie wird kleiner"],
    },
    en: {
      title: "How a lever saves force", summary: "Long arm, small force: with a lever you can lift loads you could not manage otherwise.",
      goal: "You can apply the law of the lever and explain why less force means a longer distance.",
      labels: ["Pivot", "Load", "Force", "Load arm", "Force arm", "4 × as long – ¼ of the force", "4 × the distance"],
      steps: ["A lever is a bar that turns around a fixed point: the pivot. The load rests on one side, the force pushes on the other.", "If the pivot is exactly in the middle, both arms are equally long. Then you need as much force as the load weighs – here an equally heavy weight keeps the balance.", "If the pivot moves closer to the load, the force arm gets longer. If it is four times as long as the load arm, a quarter of the force is enough. This is the law of the lever: force times force arm equals load times load arm.", "Nothing comes for free: the hand has to move four times as far down as the load comes up. This is how crowbars, wheelbarrows and bottle openers work."],
      predict: ["The pivot now moves closer to the load. What happens to the force needed to lift it?", "It gets larger", "It stays the same", "It gets smaller"],
    },
    predict: [2, 2],
  },
];

// run directly → merge the animations into content/animations.json
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = "content/animations.json";
  const list = JSON.parse(fs.readFileSync(file, "utf8"));
  animations.forEach((a, n) => {
    const [step, correct] = a.predict;
    const row = {
      language: "de", renderer: "three", fallback_scene: null, min_age: 10, difficulty: 2, verification_status: verification, status: "published",
      created_at: new Date(Date.parse(TODAY + "T12:00:00Z") - n * 3_600_000).toISOString().replace(".000Z", "Z"),
      id: a.id, category_id: a.category, scene: a.scene, title: a.de.title, summary: a.de.summary, goal: a.de.goal, labels: a.de.labels,
      steps: a.de.steps.map(([text, seconds]) => ({ text, seconds })), sources: a.sources, quiz_question_id: a.quiz,
      translations: { en: { title: a.en.title, summary: a.en.summary, goal: a.en.goal, labels: a.en.labels, steps: a.en.steps, predict: { question: a.en.predict[0], options: a.en.predict.slice(1) } } },
      timing: { pace: a.timing[0], motion: a.timing[1] },
      predict: { step, question: a.de.predict[0], options: a.de.predict.slice(1), correct },
    };
    if (row.labels.length !== row.translations.en.labels.length || row.steps.length !== row.translations.en.steps.length) throw new Error(`${a.id}: languages differ`);
    const i = list.findIndex((x) => x.id === a.id);
    if (i >= 0) list[i] = { ...row, created_at: list[i].created_at };
    else list.push(row);
  });
  fs.writeFileSync(file, JSON.stringify(list, null, 2) + "\n");
  console.log(`${animations.length} animations merged; ${list.length} in total.`);
}
