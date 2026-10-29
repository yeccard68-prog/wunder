// Four interactive visualisations (29.10.2026) of two new types: "chance" (shared birthdays, the three doors, coin
// tosses – by hand and a thousand times at a tap) and "sampling" (how a language model picks the next word, with a
// temperature slider). All are models: the formulas are in lib/visuals.ts and tested in tests/visuals.test.ts
// (birthday chances, two in three for switching, the usual longest run in 100 tosses, the temperature).
//   node content/_batches/2026-10-visuals-4.mjs      (idempotent; rewrites content/visuals.json)
import fs from "node:fs";

const W = (title, name = title.replaceAll("_", " ")) => ({ name: "Wikipedia: " + name, url: "https://de.wikipedia.org/wiki/" + title });
const WEN = (title) => ({ name: "Wikipedia (englisch): " + title.replaceAll("_", " "), url: "https://en.wikipedia.org/wiki/" + title });

const visuals = [
  {
    id: "v-geburtstag",
    type: "chance",
    category_id: "math",
    min_age: 10,
    difficulty: 2,
    data_kind: "model",
    config: { experiment: "birthday", people: { min: 2, max: 60, step: 1, value: 23 }, runs: 1000 },
    title: "Geburtstagsparadoxon: Wann teilen sich zwei einen Geburtstag?",
    goal: "Du kannst erklären, warum schon kleine Gruppen sehr wahrscheinlich zwei Menschen mit demselben Geburtstag haben – und das mit einer Simulation überprüfen.",
    intro: "Wie groß muss eine Gruppe sein, damit zwei Menschen am selben Tag Geburtstag haben? Stell die Gruppengröße ein, lose eine Gruppe aus oder lass gleich tausend Gruppen auslosen.",
    note: "Rechenmodell: 365 gleich wahrscheinliche Geburtstage; der 29. Februar und Häufungen in bestimmten Monaten bleiben unberücksichtigt. Die Simulation lost jedes Mal neu – ihr Ergebnis schwankt etwas um den berechneten Wert.",
    labels: {
      people: "Menschen in der Gruppe", axisX: "Menschen in der Gruppe", axisY: "Chance auf doppelten Geburtstag", exact: "berechnet", simulated: "ausgezählt in {runs} Gruppen", notYet: "noch nicht ausgezählt",
      one: "Eine Gruppe auslosen", many: "{runs} Gruppen auslosen", strip: "Die Geburtstage der Gruppe im Jahr", shared: "Doppelt: {days}", none: "Kein Geburtstag doppelt – diesmal.",
    },
    explain: "Es geht nicht um deinen Geburtstag, sondern um irgendein Paar. Bei 23 Menschen gibt es schon 253 mögliche Paare, und jedes davon könnte übereinstimmen. Deshalb steigt die Chance so schnell: Ab 23 Menschen ist ein doppelter Geburtstag wahrscheinlicher als keiner.",
    predict: { question: "In einer Gruppe von 30 Menschen: Wie wahrscheinlich ist es, dass mindestens zwei am selben Tag Geburtstag haben?", options: ["Etwa 10 %", "Etwa 30 %", "Etwa 70 %"], feedback: "Rund 70,6 % – weit mehr, als die meisten schätzen. Stell 30 Menschen ein und lass tausend Gruppen auslosen." },
    predict_correct: 2,
    apply: "Finde die kleinste Gruppe, in der ein doppelter Geburtstag zu mindestens 90 % vorkommt – und prüfe mit tausend ausgelosten Gruppen, ob das ungefähr stimmt.",
    sources: [W("Geburtstagsparadoxon")],
    links: [{ kind: "question", id: "mf2" }],
    verification_status: "ai_checked",
    status: "published",
    translations: {
      en: {
        title: "The birthday paradox: when do two people share a birthday?",
        goal: "You can explain why even small groups very likely contain two people with the same birthday – and check it with a simulation.",
        intro: "How big must a group be for two people to have their birthday on the same day? Set the size of the group, draw one group or let a thousand groups be drawn at once.",
        note: "Model: 365 equally likely birthdays; 29 February and birthdays bunching in certain months are left out. The simulation draws anew every time – its result varies a little around the calculated value.",
        labels: {
          people: "People in the group", axisX: "People in the group", axisY: "Chance of a shared birthday", exact: "calculated", simulated: "counted in {runs} groups", notYet: "not counted yet",
          one: "Draw one group", many: "Draw {runs} groups", strip: "The group's birthdays across the year", shared: "Shared: {days}", none: "No shared birthday – this time.",
        },
        explain: "It is not about your birthday but about any pair. With 23 people there are already 253 possible pairs, and each of them could match. That is why the chance rises so fast: from 23 people on, a shared birthday is more likely than none.",
        predict: { question: "In a group of 30 people: how likely is it that at least two have their birthday on the same day?", options: ["About 10%", "About 30%", "About 70%"], feedback: "About 70.6% – far more than most people guess. Set 30 people and let a thousand groups be drawn." },
        apply: "Find the smallest group in which a shared birthday happens at least 90% of the time – and check with a thousand drawn groups whether that is about right.",
      },
    },
  },
  {
    id: "v-ziegen",
    type: "chance",
    category_id: "math",
    min_age: 13,
    difficulty: 2,
    data_kind: "model",
    config: { experiment: "doors", runs: 1000 },
    title: "Ziegenproblem: Bleiben oder wechseln?",
    goal: "Du kannst begründen, warum Wechseln beim Ziegenproblem in zwei von drei Fällen gewinnt, und es selbst ausprobieren.",
    intro: "Hinter einer von drei Türen steht ein Auto, hinter den anderen je eine Ziege. Du wählst eine Tür, der Moderator öffnet eine andere mit einer Ziege. Bleibst du – oder wechselst du? Spiel ein paar Runden und lass dann tausend Spiele je Strategie laufen.",
    note: "Modell nach den üblichen Regeln: Der Moderator weiß, wo das Auto steht, öffnet immer eine andere Tür mit einer Ziege und bietet immer den Wechsel an. Gilt eine dieser Regeln nicht, ändert sich die Rechnung.",
    labels: {
      pick: "Wähle eine Tür.", opened: "Hinter Tür {door} steht eine Ziege. Bleibst du oder wechselst du?", stay: "Bleiben", swap: "Wechseln", won: "Gewonnen – das Auto!", lost: "Leider eine Ziege.", again: "Neue Runde",
      many: "Je {runs}-mal bleiben und wechseln", rateStay: "Immer bleiben", rateSwap: "Immer wechseln", tally: "{won} von {played} gewonnen", door: "Tür {n}", car: "Auto", goat: "Ziege",
    },
    explain: "Deine erste Wahl trifft das Auto nur in einem von drei Fällen – und das bleibt so, egal welche Tür der Moderator öffnet. In den anderen zwei Fällen steht das Auto hinter der Tür, die übrig bleibt, denn der Moderator darf es nicht zeigen. Wer wechselt, gewinnt also genau dann, wenn die erste Wahl falsch war: in zwei von drei Fällen.",
    predict: { question: "Du hast Tür 1 gewählt, der Moderator öffnet Tür 3 mit einer Ziege. Was ist klüger?", options: ["Bei Tür 1 bleiben", "Zu Tür 2 wechseln", "Egal – jetzt steht es 50 zu 50"], feedback: "Wechseln gewinnt in zwei von drei Spielen. Viele halten es für 50 zu 50 – probier es aus und zähl mit." },
    predict_correct: 1,
    apply: "Spiel zehn Runden von Hand und wechsle immer. Lass danach je tausend Spiele laufen: Welche Gewinnquote erreicht „immer wechseln“, welche „immer bleiben“?",
    sources: [W("Ziegenproblem")],
    links: [{ kind: "question", id: "rt7" }],
    verification_status: "ai_checked",
    status: "published",
    translations: {
      en: {
        title: "The Monty Hall problem: stay or switch?",
        goal: "You can explain why switching wins two times out of three in the Monty Hall problem, and try it yourself.",
        intro: "Behind one of three doors there is a car, behind each of the others a goat. You pick a door, the host opens another one with a goat. Do you stay – or switch? Play a few rounds, then let a thousand games run for each strategy.",
        note: "Model with the usual rules: the host knows where the car is, always opens another door with a goat and always offers the switch. If one of these rules does not hold, the calculation changes.",
        labels: {
          pick: "Pick a door.", opened: "Behind door {door} there is a goat. Do you stay or switch?", stay: "Stay", swap: "Switch", won: "You win – the car!", lost: "Sorry, a goat.", again: "New round",
          many: "Stay and switch {runs} times each", rateStay: "Always stay", rateSwap: "Always switch", tally: "{won} of {played} won", door: "Door {n}", car: "Car", goat: "Goat",
        },
        explain: "Your first pick finds the car only one time in three – and that stays so, whichever door the host opens. In the other two cases the car is behind the door that is left, because the host must not reveal it. So switching wins exactly when the first pick was wrong: two times out of three.",
        predict: { question: "You picked door 1, the host opens door 3 with a goat. What is wiser?", options: ["Stay with door 1", "Switch to door 2", "It does not matter – it is 50:50 now"], feedback: "Switching wins two games out of three. Many people think it is 50:50 – try it and keep count." },
        apply: "Play ten rounds by hand and always switch. Then let a thousand games run for each: what share of wins does \"always switch\" reach, and \"always stay\"?",
      },
    },
  },
  {
    id: "v-muenzwurf",
    type: "chance",
    category_id: "math",
    min_age: 10,
    difficulty: 1,
    data_kind: "model",
    config: { experiment: "coins", runs: 1000 },
    title: "Münzwurf: Der Zufall hat kein Gedächtnis",
    goal: "Du kannst beschreiben, wie sich der Anteil von Kopf bei vielen Würfen um die Hälfte einpendelt – und warum lange Serien trotzdem normal sind.",
    intro: "Wirf eine faire Münze – erst zehnmal, dann hundert- und tausendmal. Die Linie zeigt nach jedem Wurf, welcher Anteil bisher Kopf war.",
    note: "Simulation einer fairen Münze: Jeder Wurf ist unabhängig, Kopf und Zahl sind gleich wahrscheinlich. Jeder Durchgang fällt anders aus.",
    labels: { axisX: "Würfe", axisY: "Anteil Kopf", half: "Hälfte", share: "Kopf: {heads} von {n} Würfen", streak: "längste Serie gleicher Seiten", add: "+{n} Würfe", reset: "Neu starten" },
    explain: "Nach wenigen Würfen springt die Linie stark, nach vielen pendelt sie sich um 50 % ein – das ist das Gesetz der großen Zahlen. Die Münze gleicht dabei nichts aus: Jeder Wurf ist wieder 50 zu 50. Abweichungen werden nur im Verhältnis zur großen Zahl der Würfe klein. Deshalb sind auch lange Serien kein Zeichen, dass jetzt die andere Seite „dran“ ist.",
    predict: { question: "Du wirfst 100-mal. Wie lang ist meistens die längste Serie, in der dieselbe Seite hintereinander fällt?", options: ["2 bis 3 Würfe", "5 bis 8 Würfe", "Über 20 Würfe"], feedback: "Meistens 5 bis 8 – länger, als die meisten denken. Wirf hundertmal und schau auf die längste Serie." },
    predict_correct: 1,
    apply: "Wirf 100-mal und notiere die längste Serie. Starte neu und wiederhole das ein paar Mal: Wie oft liegt sie zwischen 5 und 8?",
    sources: [W("Gesetz_der_großen_Zahlen"), W("Spielerfehlschluss")],
    links: [{ kind: "question", id: "dk8" }, { kind: "question", id: "mm1" }],
    verification_status: "ai_checked",
    status: "published",
    translations: {
      en: {
        title: "Tossing a coin: chance has no memory",
        goal: "You can describe how the share of heads settles around one half over many tosses – and why long runs are still normal.",
        intro: "Toss a fair coin – first ten times, then a hundred and a thousand times. After every toss the line shows what share has been heads so far.",
        note: "Simulation of a fair coin: every toss is independent, heads and tails are equally likely. Every run turns out differently.",
        labels: { axisX: "Tosses", axisY: "Share of heads", half: "Half", share: "Heads: {heads} of {n} tosses", streak: "longest run of one side", add: "+{n} tosses", reset: "Start again" },
        explain: "After a few tosses the line jumps a lot, after many it settles around 50% – that is the law of large numbers. The coin does not make up for anything: every toss is 50:50 again. Deviations only become small in relation to the large number of tosses. That is also why long runs are no sign that the other side is now \"due\".",
        predict: { question: "You toss 100 times. How long is the longest run of the same side in a row, usually?", options: ["2 to 3 tosses", "5 to 8 tosses", "Over 20 tosses"], feedback: "Usually 5 to 8 – longer than most people think. Toss a hundred times and look at the longest run." },
        apply: "Toss 100 times and note the longest run. Start again and repeat a few times: how often is it between 5 and 8?",
      },
    },
  },
  {
    id: "v-naechstes-wort",
    type: "sampling",
    category_id: "technology",
    min_age: 13,
    difficulty: 2,
    data_kind: "model",
    config: {
      words: [{ key: "kino", p: 0.46 }, { key: "theater", p: 0.18 }, { key: "museum", p: 0.14 }, { key: "schwimmbad", p: 0.12 }, { key: "stadion", p: 0.06 }, { key: "konzerthaus", p: 0.04 }],
      temperature: { min: 0.2, max: 2, step: 0.1, value: 1 },
    },
    title: "Wie eine KI das nächste Wort wählt",
    goal: "Du kannst erklären, dass ein Sprachmodell das nächste Wort nach Wahrscheinlichkeiten auslost, und was der Regler „Temperatur“ daran ändert.",
    intro: "Ein Sprachmodell schreibt Wort für Wort. Für jede Stelle berechnet es, wie wahrscheinlich jedes mögliche nächste Wort ist – und lost dann eines aus. Zieh selbst Wörter und dreh an der Temperatur.",
    note: "Beispielzahlen, kein echtes Modell: Ein echtes Sprachmodell wählt nicht aus sechs Wörtern, sondern aus seinem ganzen Vorrat an Wortteilen (Tokens), und berechnet die Wahrscheinlichkeiten für jede Stelle neu. Die Temperatur wirkt wie hier: jede Wahrscheinlichkeit hoch 1/T, danach wieder auf 100 % gebracht.",
    labels: {
      prompt: "Am Wochenende gehen wir ins", kino: "Kino", theater: "Theater", museum: "Museum", schwimmbad: "Schwimmbad", stadion: "Stadion", konzerthaus: "Konzerthaus",
      temperature: "Temperatur", low: "vorhersehbar", high: "überraschend", draw: "Nächstes Wort ziehen", drawMany: "20 Wörter ziehen", reset: "Zurücksetzen",
      counted: "{n} Wörter gezogen – die Zahl hinter dem Balken sagt, wie oft.", hint: "Zieh ein Wort: Es wird nach den Wahrscheinlichkeiten ausgelost.",
    },
    explain: "Das Modell würfelt mit gezinkten Würfeln: Häufige Fortsetzungen haben große Chancen, seltene kleine. Bei niedriger Temperatur werden die Unterschiede verstärkt – fast immer gewinnt das wahrscheinlichste Wort, der Text wird vorhersehbar. Bei hoher Temperatur werden sie eingeebnet – seltene Wörter kommen öfter zum Zug, der Text wird abwechslungsreicher, aber auch eher unpassend.",
    predict: { question: "Bei sehr niedriger Temperatur (0,2): Welches Wort zieht das Modell?", options: ["Fast immer das wahrscheinlichste", "Jedes Wort ungefähr gleich oft", "Meistens das unwahrscheinlichste"], feedback: "Fast immer „Kino“ – das wahrscheinlichste Wort. Schieb den Regler nach rechts, und die seltenen Wörter holen auf." },
    predict_correct: 0,
    apply: "Stell die Temperatur auf 0,2 und zieh 20 Wörter, dann auf 2,0 und noch einmal. Wie oft kam „Konzerthaus“ jeweils dran?",
    sources: [W("Large_Language_Model"), WEN("Softmax_function")],
    links: [{ kind: "question", id: "ki13" }, { kind: "question", id: "ki1" }],
    verification_status: "ai_checked",
    status: "published",
    translations: {
      en: {
        title: "How an AI picks the next word",
        goal: "You can explain that a language model draws the next word according to probabilities, and what the \"temperature\" slider changes about it.",
        intro: "A language model writes word by word. For every position it calculates how likely each possible next word is – and then draws one. Draw words yourself and turn the temperature.",
        note: "Example numbers, not a real model: a real language model does not choose from six words but from its whole stock of word pieces (tokens), and it calculates the probabilities anew for every position. The temperature works as here: every probability to the power of 1/T, then brought back to 100%.",
        labels: {
          prompt: "At the weekend we're going to the", kino: "cinema", theater: "theatre", museum: "museum", schwimmbad: "swimming pool", stadion: "stadium", konzerthaus: "concert hall",
          temperature: "Temperature", low: "predictable", high: "surprising", draw: "Draw the next word", drawMany: "Draw 20 words", reset: "Reset",
          counted: "{n} words drawn – the number behind each bar says how often.", hint: "Draw a word: it is picked at random according to the probabilities.",
        },
        explain: "The model rolls loaded dice: common continuations have big chances, rare ones small. At a low temperature the differences are sharpened – the most likely word almost always wins, and the text becomes predictable. At a high temperature they are evened out – rare words come up more often, and the text becomes more varied, but also more likely to be off.",
        predict: { question: "At a very low temperature (0.2): which word does the model draw?", options: ["Almost always the most likely one", "Every word about equally often", "Mostly the least likely one"], feedback: "Almost always \"cinema\" – the most likely word. Move the slider to the right and the rare words catch up." },
        apply: "Set the temperature to 0.2 and draw 20 words, then to 2.0 and once more. How often did \"concert hall\" come up each time?",
      },
    },
  },
];

const file = "content/visuals.json";
const list = JSON.parse(fs.readFileSync(file, "utf8"));
for (const v of visuals) {
  const i = list.findIndex((x) => x.id === v.id);
  if (i >= 0) list[i] = v;
  else list.push(v);
}
fs.writeFileSync(file, JSON.stringify(list, null, 2) + "\n");
console.log(`${visuals.length} visualisations merged; ${list.length} in total.`);
