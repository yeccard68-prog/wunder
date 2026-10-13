// Pacing per animation and one prediction question per animation (18.10.2026).
//   node content/_batches/2026-10-animations-learning.mjs      (idempotent; rewrites content/animations.json)
//
// timing: [pace, motion]
//   pace   – factor on the authored step durations (1 = as first written). Until now every animation
//            ran at 0.7. Animations with short captions now run a little faster (0.66–0.68); those with long captions stay
//            at 0.7, because their steps are already shorter than the captions take to read.
//   motion – factor on the running time that drives the movement itself (piston, orbit, flowing dots).
// predict: [step, [question, …options] de, [question, …options] en, index of the correct option]
//   Before step `step` (0-based) begins, the animation pauses and asks what will happen next.
//   The step that follows shows the answer – so the question only uses what was shown before.
import fs from "node:fs";

const design = {
  "a-herz": { timing: [0.66, 1.4], predict: [2, ["Gleich ziehen sich die Kammern zusammen. Was verhindert, dass das Blut zurück in die Vorhöfe fließt?", "Die Vorhöfe drücken dagegen", "Die Klappen schließen sich", "Das Blut ist dafür zu zäh"], ["The ventricles are about to contract. What stops the blood from flowing back into the atria?", "The atria push against it", "The valves close", "The blood is too thick for that"], 1] },
  "a-viertakt": { timing: [0.66, 1.5], predict: [2, ["Das Gemisch ist verdichtet. Was passiert, wenn jetzt die Zündkerze zündet?", "Der Kolben wird nach unten gedrückt", "Der Kolben wird nach oben gezogen", "Das Einlassventil öffnet sich"], ["The mixture is compressed. What happens when the spark plug fires now?", "The piston is pushed down", "The piston is pulled up", "The intake valve opens"], 0] },
  "a-gewitter": { timing: [0.68, 1.35], predict: [2, ["In der Wolke stoßen Eiskristalle und schwerer Graupel zusammen und laden sich auf. Wo sammelt sich die negative Ladung?", "Oben in der Wolke", "Gleichmäßig verteilt", "Unten in der Wolke"], ["Inside the cloud, ice crystals and heavier graupel collide and become charged. Where does the negative charge gather?", "At the top of the cloud", "Evenly spread", "At the bottom of the cloud"], 2] },
  "a-batterie": { timing: [0.67, 1.35], predict: [2, ["Am Minuspol stauen sich Elektronen. Gleich verbindet ein Draht die Pole. Wohin wandern die Elektronen?", "Vom Pluspol zum Minuspol", "Vom Minuspol zum Pluspol", "Sie bleiben, wo sie sind"], ["Electrons pile up at the negative terminal. A wire is about to connect the terminals. Where do the electrons go?", "From the positive to the negative terminal", "From the negative to the positive terminal", "They stay where they are"], 1] },
  "a-platten": { timing: [0.7, 1.3], predict: [2, ["Jetzt stoßen zwei Platten zusammen. Was passiert meist mit der schwereren?", "Sie taucht unter die andere ab", "Sie schiebt sich über die andere", "Beide bleiben einfach stehen"], ["Now two plates collide. What usually happens to the heavier one?", "It dives beneath the other", "It rides over the other", "Both simply stop"], 0] },
  "a-elektromotor": { timing: [0.7, 1.4], predict: [2, ["Die Spule hat eine halbe Drehung geschafft, der Strom fließt unverändert. Was würden die Kräfte jetzt tun?", "Die Spule immer schneller drehen", "Gar nichts mehr", "Die Spule wieder zurückziehen"], ["The coil has made half a turn and the current flows unchanged. What would the forces do now?", "Spin the coil faster and faster", "Nothing at all", "Pull the coil back again"], 2] },
  "a-neuronales-netz": { timing: [0.68, 1.35], predict: [3, ["Das Netz hat falsch geraten. Was wird beim Training verändert, damit es besser wird?", "Die Zahl der Bildpunkte", "Die Gewichte der Verbindungen", "Die Reihenfolge der Schichten"], ["The network guessed wrong. What is changed during training so that it improves?", "The number of pixels", "The weights of the connections", "The order of the layers"], 1] },
  "a-sternentstehung": { timing: [0.67, 1.3], predict: [1, ["Ein Teil der Gaswolke wird dichter als der Rest. Was zieht ihn weiter zusammen?", "Seine eigene Schwerkraft", "Das Licht benachbarter Sterne", "Die Kälte des Weltraums"], ["Part of the gas cloud becomes denser than the rest. What pulls it together further?", "Its own gravity", "The light of neighbouring stars", "The cold of space"], 0] },
  "a-dna": { timing: [0.7, 1.25], predict: [3, ["Die Doppelhelix ist geöffnet. An einem Einzelstrang steht die Base A. Welche Base wird gegenüber angelagert?", "G", "C", "T"], ["The double helix has opened. On one single strand there is the base A. Which base is added opposite it?", "G", "C", "T"], 2] },
  "a-planetenbahn": { timing: [0.7, 1.4], predict: [1, ["Ohne Kraft flöge der Planet geradeaus davon. Was passiert, wenn die Sonne ihn anzieht?", "Seine Bahn krümmt sich um die Sonne", "Er stürzt geradewegs in die Sonne", "Er bleibt stehen"], ["Without a force the planet would fly off in a straight line. What happens when the Sun pulls on it?", "Its path bends around the Sun", "It falls straight into the Sun", "It stops"], 0] },
  "a-zahnraeder": { timing: [0.68, 1.5], predict: [1, ["Das kleine Rad hat 12 Zähne, das große 24. Wie weit dreht sich das große, wenn das kleine eine Umdrehung macht?", "Zwei Umdrehungen", "Eine halbe Umdrehung", "Eine ganze Umdrehung"], ["The small gear has 12 teeth, the large one 24. How far does the large one turn when the small one makes one turn?", "Two turns", "Half a turn", "One full turn"], 1] },
  "a-linse": { timing: [0.7, 1.25], predict: [3, ["Gleich rückt der Gegenstand näher an die Linse. Was geschieht mit dem Bild?", "Es rückt näher und wird kleiner", "Es bleibt, wo es ist", "Es wandert weiter weg und wird größer"], ["The object is about to move closer to the lens. What happens to the image?", "It moves closer and gets smaller", "It stays where it is", "It moves further away and gets larger"], 2] },
};

const file = "content/animations.json";
const animations = JSON.parse(fs.readFileSync(file, "utf8"));
for (const a of animations) {
  const d = design[a.id];
  if (!d) throw new Error(`${a.id}: no learning design`);
  const [step, de, en, correct] = d.predict;
  if (step < 1 || step >= a.steps.length) throw new Error(`${a.id}: predict.step must be between 1 and ${a.steps.length - 1}`);
  if (de.length !== en.length || de.length < 3 || !de[correct + 1]) throw new Error(`${a.id}: predict needs a question, at least two options and a valid correct index`);
  a.timing = { pace: d.timing[0], motion: d.timing[1] };
  a.predict = { step, question: de[0], options: de.slice(1), correct };
  a.translations.en.predict = { question: en[0], options: en.slice(1) };
}
for (const id of Object.keys(design)) if (!animations.some((a) => a.id === id)) throw new Error(`unknown animation ${id}`);
fs.writeFileSync(file, JSON.stringify(animations, null, 2) + "\n");
console.log(`${animations.length} animations: pacing and prediction set.`);
