// Content batch (12.11.2026): fourth set of riddles – thirteen classic logic puzzles with up to three hints each, never
// naming the answer. Every answer was worked out again by a script that tries all possibilities (bridge 1/2/5/8 → 15,
// four discs → 15 moves, counting out ten → 5, first field over a million → 21, centre of every 3 × 3 magic square → 5,
// two guards, a biased coin); the linked articles describe the puzzles. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-11-riddles-4.mjs
export const LOCALE = "en";
export const TODAY = "2026-11-12";
export const verification = "ai_checked";

const EN = (title) => ({ name: `Wikipedia (en): ${title}`, url: `https://en.wikipedia.org/wiki/${title.replaceAll(" ", "_")}` });

export const riddles = [
  {
    id: "rt52", category: "math", difficulty: 3, minAge: 13, tags: ["Logik", "Planen"], source: EN("Bridge and torch problem"),
    question: "Vier Personen müssen nachts über eine schmale Brücke. Sie haben nur eine Taschenlampe, und ohne Lampe geht niemand. Höchstens zwei dürfen gleichzeitig gehen – so schnell wie die langsamere von beiden. Einzeln brauchen sie 1, 2, 5 und 8 Minuten. Wie lange brauchen alle vier mindestens?",
    options: ["14 Minuten", "15 Minuten", "17 Minuten", "20 Minuten"], correct: 1,
    hints: ["Die Lampe muss jedes Mal jemand zurückbringen – das kostet Zeit.", "Wenn die Schnellste alle einzeln hinüberbegleitet, dauert es 17 Minuten. Es geht schneller.", "Die beiden Langsamsten sollten zusammen gehen, damit nur die 8 Minuten zählen – und nicht 5 und 8."],
    explanation: "Erst gehen die beiden Schnellen (2 Minuten), die Schnellste bringt die Lampe zurück (1). Dann gehen die beiden Langsamen zusammen (8), und die Zweitschnellste, die drüben gewartet hat, bringt die Lampe zurück (2). Zum Schluss gehen die beiden Schnellen noch einmal (2). Zusammen 2 + 1 + 8 + 2 + 2 = 15 Minuten. Der Trick: Die beiden Langsamen gehen nur ein einziges Mal – und gemeinsam.",
    en: {
      question: "Four people have to cross a narrow bridge at night. They have only one torch, and nobody walks without it. At most two may cross at a time – at the pace of the slower one. On their own they take 1, 2, 5 and 8 minutes. What is the shortest time for all four to get across?",
      options: ["14 minutes", "15 minutes", "17 minutes", "20 minutes"],
      hints: ["Somebody has to bring the torch back every time – that costs time.", "If the fastest person escorts everyone across one by one, it takes 17 minutes. It can be done faster.", "The two slowest should cross together, so that only the 8 minutes count – not 5 and 8."],
      explanation: "First the two fast ones cross (2 minutes), and the fastest brings the torch back (1). Then the two slow ones cross together (8), and the second-fastest, who has waited on the far side, brings the torch back (2). Finally the two fast ones cross again (2). Together 2 + 1 + 8 + 2 + 2 = 15 minutes. The trick: the two slow ones cross only once – and together.",
    },
  },
  {
    id: "rt53", category: "math", difficulty: 2, minAge: 10, tags: ["Logik", "Muster"], wiki: "Türme_von_Hanoi",
    question: "Bei den „Türmen von Hanoi“ liegen Scheiben der Größe nach auf einem von drei Stäben, die größte unten. Man bewegt immer nur eine Scheibe und legt nie eine größere auf eine kleinere. Wie viele Züge braucht man mindestens, um einen Turm aus 4 Scheiben auf einen anderen Stab zu versetzen?",
    options: ["8", "12", "15", "16"], correct: 2,
    hints: ["Probier es mit weniger Scheiben: Eine Scheibe braucht 1 Zug, zwei Scheiben brauchen 3, drei brauchen 7.", "Bevor die größte Scheibe umziehen kann, muss der ganze kleinere Turm zur Seite – und danach wieder obendrauf."],
    explanation: "Um die größte Scheibe zu versetzen, räumt man erst den Turm darüber auf den dritten Stab, bewegt die größte Scheibe und setzt den kleineren Turm wieder darauf. Das sind doppelt so viele Züge wie für den kleineren Turm, plus einen: 1, 3, 7, 15. Für 4 Scheiben also 15 Züge – allgemein 2 hoch Anzahl der Scheiben, minus 1. Erfunden hat das Spiel 1883 der französische Mathematiker Édouard Lucas.",
    en: {
      question: "In the 'Tower of Hanoi', discs lie on one of three rods in order of size, the largest at the bottom. You move one disc at a time and never put a larger disc on a smaller one. What is the smallest number of moves needed to shift a tower of 4 discs to another rod?",
      options: ["8", "12", "15", "16"],
      hints: ["Try it with fewer discs: one disc takes 1 move, two discs take 3, three take 7.", "Before the largest disc can move, the whole smaller tower has to go out of the way – and back on top afterwards."],
      explanation: "To shift the largest disc, you first clear the tower above it onto the third rod, move the largest disc, and put the smaller tower back on top. That is twice as many moves as for the smaller tower, plus one: 1, 3, 7, 15. So 4 discs take 15 moves – in general 2 to the power of the number of discs, minus 1. The game was invented in 1883 by the French mathematician Édouard Lucas.",
    },
  },
  {
    id: "rt54", category: "math", difficulty: 2, minAge: 13, tags: ["Logik", "Unendlichkeit"], wiki: "Hilberts_Hotel",
    question: "Ein Hotel hat unendlich viele Zimmer mit den Nummern 1, 2, 3 und so weiter – und alle sind belegt. Ein neuer Gast kommt. Wie bekommt er ein eigenes Zimmer, ohne dass jemand das Hotel verlassen muss?",
    options: ["Er bekommt das letzte Zimmer", "Gar nicht – belegt ist belegt", "Jeder Gast zieht ein Zimmer weiter", "Zwei Gäste müssen sich ein Zimmer teilen"], correct: 2,
    hints: ["Ein „letztes Zimmer“ gibt es in diesem Hotel nicht.", "Was passiert, wenn alle Gäste gleichzeitig umziehen?"],
    explanation: "Der Gast aus Zimmer 1 zieht in Zimmer 2, der aus Zimmer 2 in Zimmer 3 und so weiter – jeder ein Zimmer weiter. Weil es zu jeder Nummer eine nächste gibt, findet jeder Platz, und Zimmer 1 wird frei. Das Gedankenexperiment stammt vom Mathematiker David Hilbert und zeigt, dass sich das Unendliche anders verhält als jede noch so große Zahl.",
    en: {
      question: "A hotel has infinitely many rooms numbered 1, 2, 3 and so on – and all are taken. A new guest arrives. How does he get a room of his own without anyone having to leave the hotel?",
      options: ["He gets the last room", "Not at all – full is full", "Every guest moves one room along", "Two guests have to share a room"],
      hints: ["There is no 'last room' in this hotel.", "What happens if all guests move at the same time?"],
      explanation: "The guest in room 1 moves to room 2, the one in room 2 to room 3 and so on – everyone one room along. Because every number has a next one, everybody finds a place, and room 1 becomes free. The thought experiment comes from the mathematician David Hilbert and shows that the infinite behaves differently from any number, however large.",
    },
  },
  {
    id: "rt55", category: "math", difficulty: 3, minAge: 13, tags: ["Logik", "Paradox"], wiki: "Barbier-Paradoxon",
    question: "In einem Dorf rasiert der Barbier genau die Männer, die sich nicht selbst rasieren. Rasiert der Barbier sich selbst?",
    options: ["Ja", "Nein", "Das hängt davon ab, ob er im Dorf wohnt", "Beides führt zu einem Widerspruch – so einen Barbier kann es nicht geben"], correct: 3,
    hints: ["Nimm an, er rasiert sich selbst. Zu welcher Gruppe gehört er dann?", "Nimm jetzt das Gegenteil an. Was verlangt die Regel dann von ihm?"],
    explanation: "Rasiert er sich selbst, gehört er zu denen, die sich selbst rasieren – und die rasiert er laut Regel gerade nicht. Rasiert er sich nicht selbst, gehört er zu denen, die er rasieren muss. Beide Annahmen widersprechen sich selbst: Eine solche Regel kann niemand erfüllen. Bertrand Russell erzählte das Rätsel 1918, um einen Widerspruch in der damaligen Mengenlehre anschaulich zu machen.",
    en: {
      question: "In a village the barber shaves exactly those men who do not shave themselves. Does the barber shave himself?",
      options: ["Yes", "No", "That depends on whether he lives in the village", "Both lead to a contradiction – there can be no such barber"],
      hints: ["Suppose he shaves himself. Which group does he then belong to?", "Now suppose the opposite. What does the rule then demand of him?"],
      explanation: "If he shaves himself, he is one of those who shave themselves – and by the rule he does not shave those. If he does not shave himself, he is one of those he must shave. Both assumptions contradict themselves: nobody can meet such a rule. Bertrand Russell told the riddle in 1918 to illustrate a contradiction in the set theory of his time.",
    },
  },
  {
    id: "rt56", category: "math", difficulty: 2, minAge: 13, tags: ["Logik", "Zählen"], wiki: "Schubfachprinzip",
    question: "Kein Mensch hat eine Million Haare oder mehr auf dem Kopf. In einer Stadt leben mehr als eine Million Menschen. Was folgt daraus sicher?",
    options: ["Mindestens zwei Menschen dort haben genau gleich viele Haare", "Jede mögliche Haarzahl kommt genau einmal vor", "Mindestens ein Mensch dort hat gar keine Haare", "Nichts – das wäre reiner Zufall"], correct: 0,
    hints: ["Stell dir für jede mögliche Haarzahl eine Schublade vor: 0 Haare, 1 Haar, 2 Haare …", "Es gibt mehr Menschen als Schubladen."],
    explanation: "Von 0 bis 999.999 Haaren gibt es höchstens eine Million verschiedene Anzahlen. Verteilt man mehr als eine Million Menschen auf diese „Schubladen“, müssen in mindestens einer zwei Menschen landen – sie haben exakt gleich viele Haare. Diese einfache, aber mächtige Überlegung heißt Schubfachprinzip: Sie beweist, dass es so ein Paar gibt, ohne ein einziges Haar zu zählen.",
    en: {
      question: "Nobody has a million hairs or more on their head. More than a million people live in a city. What follows for certain?",
      options: ["At least two people there have exactly the same number of hairs", "Every possible number of hairs occurs exactly once", "At least one person there has no hair at all", "Nothing – that would be pure chance"],
      hints: ["Imagine a drawer for every possible number of hairs: 0 hairs, 1 hair, 2 hairs …", "There are more people than drawers."],
      explanation: "From 0 to 999,999 hairs there are at most a million different numbers. If you sort more than a million people into these 'drawers', at least one drawer must hold two people – they have exactly the same number of hairs. This simple but powerful idea is called the pigeonhole principle: it proves that such a pair exists without counting a single hair.",
    },
  },
  {
    id: "rt57", category: "math", difficulty: 3, minAge: 13, tags: ["Logik", "Beweis"], source: EN("Mutilated chessboard problem"),
    question: "Von einem Schachbrett werden zwei diagonal gegenüberliegende Eckfelder entfernt – 62 Felder bleiben. Lassen sie sich mit 31 Dominosteinen lückenlos bedecken, wenn jeder Stein genau zwei benachbarte Felder bedeckt?",
    options: ["Ja, auf genau eine Weise", "Ja, auf viele verschiedene Weisen", "Nein, das ist unmöglich", "Nur, wenn man in einer Ecke beginnt"], correct: 2,
    hints: ["Welche Farbe haben die beiden entfernten Eckfelder?", "Jeder Dominostein bedeckt immer ein helles und ein dunkles Feld."],
    explanation: "Diagonal gegenüberliegende Ecken haben dieselbe Farbe. Nach dem Entfernen bleiben also 32 Felder der einen und nur 30 der anderen Farbe. Jeder Dominostein bedeckt aber immer ein helles und ein dunkles Feld – 31 Steine bräuchten 31 helle und 31 dunkle. Es kann nicht aufgehen, egal wie man legt. Das Rätsel stellte der Philosoph Max Black 1946 vor.",
    en: {
      question: "Two diagonally opposite corner squares are removed from a chessboard – 62 squares remain. Can they be covered completely with 31 dominoes, each covering exactly two neighbouring squares?",
      options: ["Yes, in exactly one way", "Yes, in many different ways", "No, it is impossible", "Only if you start in a corner"],
      hints: ["What colour are the two corner squares that were removed?", "Every domino always covers one light and one dark square."],
      explanation: "Diagonally opposite corners have the same colour. So after removing them, 32 squares of one colour and only 30 of the other remain. But every domino always covers one light and one dark square – 31 dominoes would need 31 light and 31 dark ones. It cannot work out, however you place them. The puzzle was posed by the philosopher Max Black in 1946.",
    },
  },
  {
    id: "rt58", category: "math", difficulty: 3, minAge: 13, tags: ["Logik", "Muster"], wiki: "Josephus-Problem",
    question: "Zehn Kinder stehen im Kreis, nummeriert von 1 bis 10. Reihum scheidet jedes zweite aus: zuerst die 2, dann die 4, die 6 und so weiter – immer weiter im Kreis, bis nur noch ein Kind übrig ist. Welche Nummer bleibt?",
    options: ["1", "5", "7", "9"], correct: 1,
    hints: ["Nach der ersten Runde stehen nur noch die ungeraden Nummern im Kreis.", "Als Letzte der ersten Runde geht die 10. Danach wird weitergezählt: Die 1 bleibt, die 3 geht."],
    explanation: "Erste Runde: 2, 4, 6, 8 und 10 scheiden aus. Es bleiben 1, 3, 5, 7, 9, und es geht hinter der 10 weiter: Die 1 bleibt, die 3 geht, die 5 bleibt, die 7 geht, die 9 bleibt, die 1 geht, die 5 bleibt, die 9 geht. Übrig ist die 5. Die Aufgabe ist als Josephus-Problem bekannt; für jede Anzahl gibt es eine Formel, die den sicheren Platz vorhersagt.",
    en: {
      question: "Ten children stand in a circle, numbered 1 to 10. Going round, every second child drops out: first number 2, then 4, then 6 and so on – round and round the circle until only one child is left. Which number remains?",
      options: ["1", "5", "7", "9"],
      hints: ["After the first round only the odd numbers are left in the circle.", "The last to go in the first round is number 10. Then the counting carries on: 1 stays, 3 goes."],
      explanation: "First round: 2, 4, 6, 8 and 10 drop out. That leaves 1, 3, 5, 7, 9, and the counting carries on after 10: 1 stays, 3 goes, 5 stays, 7 goes, 9 stays, 1 goes, 5 stays, 9 goes. Number 5 is left. The task is known as the Josephus problem; for any number of people there is a formula that predicts the safe place.",
    },
  },
  {
    id: "rt59", category: "math", difficulty: 2, minAge: 10, tags: ["Logik", "Wachstum"], wiki: "Sissa_ibn_Dahir",
    question: "Der Legende nach wünschte sich der Erfinder des Schachspiels als Lohn Weizenkörner: 1 Korn auf das erste Feld, 2 auf das zweite, 4 auf das dritte – auf jedes Feld doppelt so viele wie auf das davor. Auf welchem Feld liegen zum ersten Mal mehr als eine Million Körner?",
    options: ["Auf dem 11. Feld", "Auf dem 21. Feld", "Auf dem 41. Feld", "Erst auf dem 64. Feld"], correct: 1,
    hints: ["Zehnmal verdoppeln macht aus 1 Korn genau 1.024 Körner – etwa das Tausendfache.", "Auf dem 11. Feld liegen also gut tausend Körner. Und nach zehn weiteren Verdopplungen?"],
    explanation: "Zehn Verdopplungen ergeben das 1.024-Fache. Auf dem 11. Feld liegen 1.024 Körner, auf dem 21. Feld schon 1.024 × 1.024 = 1.048.576 – zum ersten Mal über eine Million. So geht es weiter: Auf allen 64 Feldern zusammen wären es mehr als 18 Trillionen Körner – so viel Weizen ließ sich der Legende nach im ganzen Reich nicht auftreiben. Sie zeigt, wie stark man Verdopplungen unterschätzt.",
    en: {
      question: "Legend has it that the inventor of chess asked for grains of wheat as his reward: 1 grain on the first square, 2 on the second, 4 on the third – on each square twice as many as on the one before. On which square are there more than a million grains for the first time?",
      options: ["On the 11th square", "On the 21st square", "On the 41st square", "Not until the 64th square"],
      hints: ["Doubling ten times turns 1 grain into exactly 1,024 grains – about a thousand times as many.", "So there are a good thousand grains on the 11th square. And after ten more doublings?"],
      explanation: "Ten doublings give 1,024 times as much. There are 1,024 grains on the 11th square and already 1,024 × 1,024 = 1,048,576 on the 21st – over a million for the first time. And so it goes on: all 64 squares together would hold more than 18 quintillion grains – according to the legend, that much wheat could not be found in the whole kingdom. It shows how badly we underestimate doubling.",
    },
  },
  {
    id: "rt60", category: "math", difficulty: 3, minAge: 13, tags: ["Logik", "Wahrscheinlichkeit"], wiki: "Junge-oder-Mädchen-Problem",
    question: "Nimm alle Familien mit genau zwei Kindern, in denen mindestens ein Kind ein Junge ist. In welchem Anteil dieser Familien sind beide Kinder Jungen? (Jungen und Mädchen seien gleich häufig.)",
    options: ["In der Hälfte", "In einem Viertel", "In zwei Dritteln", "In einem Drittel"], correct: 3,
    hints: ["Schreib alle Möglichkeiten nach dem Alter der Kinder auf: Junge–Junge, Junge–Mädchen, Mädchen–Junge, Mädchen–Mädchen.", "Welche dieser vier fällt weg – und wie viele bleiben übrig?"],
    explanation: "Nach dem Alter geordnet gibt es vier gleich häufige Fälle: Junge–Junge, Junge–Mädchen, Mädchen–Junge und Mädchen–Mädchen. „Mindestens ein Junge“ schließt nur den letzten aus. Von den drei übrigen hat einer zwei Jungen: ein Drittel. Viele tippen auf die Hälfte – das wäre richtig, wenn man wüsste, dass ein bestimmtes Kind, etwa das ältere, ein Junge ist.",
    en: {
      question: "Take all families with exactly two children in which at least one child is a boy. In what share of these families are both children boys? (Assume boys and girls are equally common.)",
      options: ["In half of them", "In a quarter", "In two thirds", "In a third"],
      hints: ["Write down all the possibilities by the children's age: boy–boy, boy–girl, girl–boy, girl–girl.", "Which of these four drops out – and how many are left?"],
      explanation: "Ordered by age there are four equally common cases: boy–boy, boy–girl, girl–boy and girl–girl. 'At least one boy' rules out only the last. Of the three that remain, one has two boys: a third. Many people guess a half – that would be right if you knew that one particular child, say the elder, is a boy.",
    },
  },
  {
    id: "rt61", category: "math", difficulty: 2, minAge: 13, tags: ["Logik", "Paradox"], wiki: "Achilles_und_die_Schildkröte",
    question: "Achilles läuft zehnmal so schnell wie eine Schildkröte, die 100 Meter Vorsprung hat. Der Philosoph Zenon behauptete: Er holt sie nie ein – denn immer wenn er dort ankommt, wo sie eben war, ist sie schon ein Stück weiter. Was stimmt?",
    options: ["Er holt sie nach gut 111 Metern ein", "Er holt sie tatsächlich nie ein", "Er holt sie nach genau 100 Metern ein", "Er holt sie nach genau 200 Metern ein"], correct: 0,
    hints: ["Die Stücke, die Zenon aufzählt, werden immer kleiner: 100 Meter, 10 Meter, 1 Meter, 10 Zentimeter …", "Unendlich viele immer kleinere Stücke können zusammen eine endliche Strecke ergeben."],
    explanation: "Während Achilles 100 Meter läuft, schafft die Schildkröte 10; während er diese 10 läuft, schafft sie 1 – und so weiter. Die Stücke 100 + 10 + 1 + 0,1 + … ergeben zusammen aber nur 111,11… Meter. Dort ist Achilles gleichauf, danach vorn. Zenons Fehler: Er hielt eine Summe aus unendlich vielen Teilen für unendlich groß. Ein Schnellerer holt einen Langsameren immer ein, wenn er genug Zeit hat.",
    en: {
      question: "Achilles runs ten times as fast as a tortoise that has a 100-metre head start. The philosopher Zeno claimed: he never catches it – for whenever he reaches the place where it just was, it has already moved on a little. What is true?",
      options: ["He catches it after a good 111 metres", "He really never catches it", "He catches it after exactly 100 metres", "He catches it after exactly 200 metres"],
      hints: ["The stretches Zeno lists get smaller and smaller: 100 metres, 10 metres, 1 metre, 10 centimetres …", "Infinitely many ever smaller stretches can add up to a finite distance."],
      explanation: "While Achilles runs 100 metres, the tortoise manages 10; while he runs those 10, it manages 1 – and so on. But the stretches 100 + 10 + 1 + 0.1 + … add up to only 111.11… metres. There Achilles draws level, after that he is ahead. Zeno's mistake: he took a sum of infinitely many parts to be infinitely large. A faster runner always catches a slower one, given enough time.",
    },
  },
  {
    id: "rt62", category: "math", difficulty: 2, minAge: 10, tags: ["Logik", "Zahlen"], wiki: "Magisches_Quadrat",
    question: "In einem magischen Quadrat aus 3 × 3 Feldern stehen die Zahlen 1 bis 9 so, dass jede Zeile, jede Spalte und beide Diagonalen dieselbe Summe ergeben. Welche Zahl muss in der Mitte stehen?",
    options: ["1", "9", "5", "Das kann man sich aussuchen"], correct: 2,
    hints: ["Alle neun Zahlen ergeben zusammen 45. Wie groß ist dann die Summe einer Zeile?", "Durch das Mittelfeld laufen vier Linien: eine Zeile, eine Spalte und beide Diagonalen."],
    explanation: "Die Zahlen 1 bis 9 ergeben 45, jede der drei Zeilen also 15. Durch die Mitte laufen vier Linien mit je 15, zusammen 60. Darin kommt jedes Feld einmal vor – nur die Mitte viermal. Also ist 60 = 45 + dreimal die Mitte, und in der Mitte steht die 5. Sie ist zugleich der Durchschnitt aller neun Zahlen.",
    en: {
      question: "In a magic square of 3 × 3 squares the numbers 1 to 9 are placed so that every row, every column and both diagonals add up to the same sum. Which number must be in the middle?",
      options: ["1", "9", "5", "You can choose"],
      hints: ["All nine numbers add up to 45. So what is the sum of one row?", "Four lines run through the middle square: a row, a column and both diagonals."],
      explanation: "The numbers 1 to 9 add up to 45, so each of the three rows gives 15. Four lines of 15 each run through the middle, 60 together. Every square appears in them once – only the middle four times. So 60 = 45 + three times the middle, and the middle is 5. It is also the average of all nine numbers.",
    },
  },
  {
    id: "rt63", category: "math", difficulty: 3, minAge: 13, tags: ["Logik", "Wahrscheinlichkeit"], source: EN("Fair coin"),
    question: "Du hast nur eine gezinkte Münze: Sie zeigt öfter Kopf als Zahl – wie viel öfter, weißt du nicht. Wie kannst du damit trotzdem fair zwischen zwei Personen losen?",
    options: ["Einmal werfen und das Ergebnis umdrehen", "Dreimal werfen, die Mehrheit entscheidet", "Zweimal werfen: „Kopf, dann Zahl“ gewinnt die eine, „Zahl, dann Kopf“ die andere – sonst noch einmal", "Gar nicht – mit einer gezinkten Münze geht das nicht"], correct: 2,
    hints: ["Ein einzelner Wurf ist unfair. Aber wie wahrscheinlich ist „erst Kopf, dann Zahl“ – und wie wahrscheinlich „erst Zahl, dann Kopf“?", "In beiden Folgen kommt genau einmal Kopf und genau einmal Zahl vor."],
    explanation: "Zeigt die Münze mit der Wahrscheinlichkeit p Kopf, dann kommt „Kopf, Zahl“ mit p × (1 − p) und „Zahl, Kopf“ mit (1 − p) × p – beides ist gleich, egal wie stark die Münze gezinkt ist. Bei zwei gleichen Würfen fängt man einfach von vorn an. Das Verfahren stammt vom Mathematiker John von Neumann.",
    en: {
      question: "You only have a biased coin: it shows heads more often than tails – how much more often, you do not know. How can you still use it to draw lots fairly between two people?",
      options: ["Toss once and reverse the result", "Toss three times, the majority decides", "Toss twice: 'heads, then tails' wins for one, 'tails, then heads' for the other – otherwise start again", "Not at all – it cannot be done with a biased coin"],
      hints: ["A single toss is unfair. But how likely is 'heads first, then tails' – and how likely 'tails first, then heads'?", "In both sequences heads comes up exactly once and tails exactly once."],
      explanation: "If the coin shows heads with probability p, then 'heads, tails' comes up with p × (1 − p) and 'tails, heads' with (1 − p) × p – the two are equal, however strongly the coin is biased. After two tosses that match, you simply start again. The method comes from the mathematician John von Neumann.",
    },
  },
  {
    id: "rt64", category: "math", difficulty: 3, minAge: 13, tags: ["Logik", "Wahrheit und Lüge"], source: EN("Knights and Knaves"),
    question: "Zwei Türen, vor jeder ein Wächter: Nur eine Tür führt in die Freiheit. Ein Wächter sagt immer die Wahrheit, der andere lügt immer – wer welcher ist, weißt du nicht. Du darfst einem von beiden eine einzige Frage stellen. Welche hilft dir sicher?",
    options: ["„Führt deine Tür in die Freiheit?“", "„Welche Tür würde mir der andere Wächter als die richtige zeigen?“", "„Lügst du?“", "„Lügt der andere Wächter?“"], correct: 1,
    hints: ["Auf „Lügst du?“ antworten beide gleich – der Ehrliche wie der Lügner.", "Suche eine Frage, bei der beide auf dieselbe Tür zeigen, egal wen du erwischst.", "In der Antwort auf die richtige Frage steckt immer genau eine Lüge."],
    explanation: "Fragst du nach der Tür, die der andere zeigen würde, steckt in der Antwort immer genau eine Lüge: Der Ehrliche gibt wahrheitsgemäß die falsche Auskunft des Lügners wieder, der Lügner verdreht die richtige Auskunft des Ehrlichen. Beide zeigen also auf die falsche Tür – du nimmst die andere. Die übrigen Fragen helfen nicht: Auf „Lügst du?“ sagen beide „Nein“, auf „Lügt der andere?“ beide „Ja“, und bei der ersten Frage weißt du nicht, ob du der Antwort trauen kannst.",
    en: {
      question: "Two doors, a guard in front of each: only one door leads to freedom. One guard always tells the truth, the other always lies – you do not know which is which. You may ask one of them a single question. Which one is sure to help?",
      options: ["'Does your door lead to freedom?'", "'Which door would the other guard show me as the right one?'", "'Are you lying?'", "'Is the other guard lying?'"],
      hints: ["Both give the same answer to 'Are you lying?' – the honest one and the liar.", "Look for a question that makes both point to the same door, whoever you happen to ask.", "The answer to the right question always contains exactly one lie."],
      explanation: "If you ask for the door the other one would show, the answer always contains exactly one lie: the honest guard truthfully reports the liar's false answer, the liar twists the honest guard's true answer. So both point to the wrong door – you take the other one. The other questions do not help: both say 'No' to 'Are you lying?', both say 'Yes' to 'Is the other one lying?', and with the first question you do not know whether you can trust the answer.",
    },
  },
];
