// Content batch (15.10.2026): second set of riddles – now also for history, earth, culture, sport and technology.
// Up to three hints each, never naming the answer. AI-checked. The source is the article behind the idea;
// the solution follows from the question itself.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-riddles-2.mjs
export const LOCALE = "en";
export const TODAY = "2026-10-15";
export const verification = "ai_checked";

export const riddles = [
  {
    id: "rt26", category: "history", difficulty: 2, minAge: 13, tags: ["Zeitrechnung"], wiki: "Dionysius_Exiguus",
    question: "Ein Händler bietet eine antike Münze an. Eingeprägt ist die Jahreszahl „55 v. Chr.“. Woran erkennst du sofort, dass sie gefälscht ist?",
    options: ["Damals konnte niemand nach „vor Christus“ zählen", "55 v. Chr. gab es noch keine Münzen", "Antike Münzen hatten keine Zahlen", "Die Römer prägten nur Gold"], correct: 0,
    hints: ["Wer konnte im Jahr 55 v. Chr. schon wissen, wie man die Jahre später einmal zählen würde?", "Die Zählung nach Christi Geburt wurde erst Jahrhunderte später erfunden."],
    explanation: "Die Jahreszählung nach Christi Geburt führte der Mönch Dionysius Exiguus im 6. Jahrhundert ein; das Rückwärtszählen „vor Christus“ setzte sich noch später durch. Im Jahr 55 v. Chr. konnte also niemand so datieren. Münzen dagegen gab es damals schon seit Jahrhunderten.",
    en: {
      question: "A dealer offers an ancient coin stamped with the year \"55 BC\". How can you tell at once that it is fake?",
      options: ["Back then nobody could count \"before Christ\"", "There were no coins in 55 BC", "Ancient coins had no numbers", "The Romans only minted gold"],
      hints: ["Who could have known in 55 BC how years would one day be counted?", "Counting years from the birth of Christ was invented centuries later."],
      explanation: "Counting years from the birth of Christ was introduced by the monk Dionysius Exiguus in the 6th century; counting backwards \"before Christ\" caught on even later. So nobody in 55 BC could date anything that way. Coins, on the other hand, had existed for centuries by then.",
    },
  },
  {
    id: "rt27", category: "earth", difficulty: 3, minAge: 13, tags: ["Geographie"], wiki: "Breitenkreis",
    question: "Ein Flugzeug startet in Berlin, fliegt immer genau nach Osten und kommt irgendwann wieder über Berlin an. Wie lang war der Weg ungefähr?",
    options: ["Rund 40.000 km", "Rund 24.000 km", "Rund 12.000 km", "Rund 52.000 km"], correct: 1,
    hints: ["Wer immer nach Osten fliegt, folgt einem Breitenkreis – nicht dem Äquator.", "Berlin liegt auf etwa 52,5 Grad nördlicher Breite. Je näher am Pol, desto kürzer der Breitenkreis.", "Rechne den Äquator mit rund 40.000 km mal cos(52,5°) ≈ 0,61."],
    explanation: "40.075 km · cos(52,5°) ≈ 24.400 km. Nur am Äquator ist ein Weg einmal rund nach Osten so lang wie der ganze Erdumfang; zum Pol hin werden die Breitenkreise immer kürzer.",
    en: {
      question: "A plane takes off in Berlin, flies due east the whole time and eventually arrives back over Berlin. Roughly how long was the journey?",
      options: ["About 40,000 km", "About 24,000 km", "About 12,000 km", "About 52,000 km"],
      hints: ["Flying due east means following a circle of latitude – not the equator.", "Berlin lies at about 52.5 degrees north. The nearer the pole, the shorter the circle of latitude.", "Take the equator's roughly 40,000 km times cos(52.5°) ≈ 0.61."],
      explanation: "40,075 km · cos(52.5°) ≈ 24,400 km. Only at the equator is a trip once around to the east as long as the Earth's full circumference; towards the pole the circles of latitude get ever shorter.",
    },
  },
  {
    id: "rt28", category: "science", difficulty: 1, minAge: 13, tags: ["Physik"], wiki: "Dichte",
    question: "Was ist schwerer: ein Kilogramm Federn oder ein Kilogramm Eisen?",
    options: ["Das Eisen", "Die Federn", "Beide gleich schwer", "Das hängt vom Ort ab"], correct: 2,
    hints: ["Lies genau, wie viel es jeweils ist.", "Der Unterschied liegt nicht im Gewicht, sondern im Platz, den beides braucht."],
    explanation: "Beide wiegen ein Kilogramm. Der Eindruck täuscht, weil Federn eine viel kleinere Dichte haben und deshalb viel mehr Platz brauchen. (Ganz genau gemessen zeigt eine Waage an der Luft die Federn sogar etwas leichter an – sie erfahren wegen ihres großen Volumens mehr Auftrieb.)",
    en: {
      question: "Which is heavier: a kilogram of feathers or a kilogram of iron?",
      options: ["The iron", "The feathers", "Both are equally heavy", "It depends on the place"],
      hints: ["Read carefully how much there is of each.", "The difference is not in the weight but in the space each takes up."],
      explanation: "Both weigh one kilogram. The impression is misleading because feathers have a much lower density and therefore take up much more space. (Measured very precisely, a scale in air even shows the feathers slightly lighter – their large volume gives them more buoyancy.)",
    },
  },
  {
    id: "rt29", category: "language", difficulty: 2, minAge: 13, tags: ["Wortspiel"], wiki: "Wortspiel",
    question: "Welches Wort schreibt man immer falsch?",
    options: ["„falsch“", "„Rechtschreibung“", "„Fehler“", "„Rhythmus“"], correct: 0,
    hints: ["Nimm die Frage ganz wörtlich.", "Die Lösung steckt schon in der Frage."],
    explanation: "Das Wort „falsch“ wird immer so geschrieben – also immer „falsch“. Das Rätsel spielt damit, dass ein Wort zugleich etwas bedeuten und als Wort selbst gemeint sein kann. Im Englischen funktioniert es mit „wrong“.",
    en: {
      question: "Which word is always spelled wrong?",
      options: ["\"wrong\"", "\"spelling\"", "\"mistake\"", "\"rhythm\""],
      hints: ["Take the question completely literally.", "The answer is already in the question."],
      explanation: "The word \"wrong\" is always spelled w-r-o-n-g – so it is always spelled \"wrong\". The riddle plays on a word being able to mean something and to be meant as a word itself. In German it works with \"falsch\".",
    },
  },
  {
    id: "rt30", category: "technology", difficulty: 1, minAge: 13, tags: ["Computer", "Rechnen"], wiki: "Pixel",
    question: "Ein Foto ist 4.000 Bildpunkte breit und 3.000 hoch. Wie viele Megapixel hat es?",
    options: ["7", "12", "40", "1,2"], correct: 1,
    hints: ["Megapixel heißt: Millionen Bildpunkte.", "Alle Bildpunkte zusammen: Breite mal Höhe."],
    explanation: "4.000 · 3.000 = 12.000.000 Bildpunkte, also 12 Megapixel. Wer 4.000 + 3.000 rechnet, kommt auf 7 – das wäre nur der Rand.",
    en: {
      question: "A photo is 4,000 pixels wide and 3,000 high. How many megapixels does it have?",
      options: ["7", "12", "40", "1.2"],
      hints: ["Megapixel means millions of pixels.", "All the pixels together: width times height."],
      explanation: "4,000 · 3,000 = 12,000,000 pixels, so 12 megapixels. Adding 4,000 + 3,000 gives 7 – which would only be the edges.",
    },
  },
  {
    id: "rt31", category: "economy", difficulty: 3, minAge: 13, tags: ["Finanzen", "Rechnen"], wiki: "Zinseszins",
    question: "Du legst Geld zu 7 Prozent Zinsen im Jahr an und lässt die Zinsen jedes Jahr mitverzinsen. Nach etwa wie vielen Jahren hat es sich verdoppelt?",
    options: ["Nach etwa 10 Jahren", "Nach etwa 14 Jahren", "Nach etwa 7 Jahren", "Nach etwa 20 Jahren"], correct: 0,
    hints: ["Ohne Zinseszins wären es 100 : 7 ≈ 14 Jahre – mit Zinseszins geht es schneller.", "Eine Faustregel: 72 geteilt durch den Zinssatz."],
    explanation: "Nach der 72er-Regel: 72 : 7 ≈ 10 Jahre. Genau gerechnet ist 1,07¹⁰ ≈ 1,97. Weil auch die Zinsen Zinsen bringen, geht es deutlich schneller als die 14 Jahre mit einfachen Zinsen. Ausprobieren lässt sich das unter Entdecken → Interaktiv → Zinseszins.",
    en: {
      question: "You invest money at 7 percent interest a year and let the interest earn interest too. After roughly how many years has it doubled?",
      options: ["After about 10 years", "After about 14 years", "After about 7 years", "After about 20 years"],
      hints: ["Without compound interest it would take 100 : 7 ≈ 14 years – with compound interest it goes faster.", "A rule of thumb: 72 divided by the interest rate."],
      explanation: "By the rule of 72: 72 : 7 ≈ 10 years. Calculated exactly, 1.07¹⁰ ≈ 1.97. Because the interest earns interest too, it is much faster than the 14 years with simple interest. You can try it under Explore → Interactive → Compound interest.",
    },
  },
  {
    id: "rt32", category: "science", difficulty: 2, minAge: 13, tags: ["Physik"], wiki: "Galilei-Transformation",
    question: "Ein Zug fährt mit 100 km/h. Ein Fahrgast wirft im Zug einen Ball mit 20 km/h nach vorn. Wie schnell ist der Ball für jemanden, der draußen am Bahnsteig steht?",
    options: ["20 km/h", "100 km/h", "120 km/h", "80 km/h"], correct: 2,
    hints: ["Für die Fahrgäste fliegt der Ball mit 20 km/h.", "Der Zug trägt den Ball schon vor dem Wurf mit sich."],
    explanation: "Die Geschwindigkeiten addieren sich: 100 + 20 = 120 km/h. Dass Bewegung immer relativ zu etwas gemessen wird, beschrieb schon Galileo Galilei. Erst bei Geschwindigkeiten nahe der Lichtgeschwindigkeit stimmt die einfache Addition nicht mehr.",
    en: {
      question: "A train travels at 100 km/h. A passenger throws a ball forwards inside the train at 20 km/h. How fast is the ball for someone standing outside on the platform?",
      options: ["20 km/h", "100 km/h", "120 km/h", "80 km/h"],
      hints: ["For the passengers, the ball flies at 20 km/h.", "The train already carries the ball along before the throw."],
      explanation: "The speeds add up: 100 + 20 = 120 km/h. Galileo Galilei already described that motion is always measured relative to something. Only at speeds close to the speed of light does simple addition stop working.",
    },
  },
  {
    id: "rt33", category: "earth", difficulty: 2, minAge: 13, tags: ["Geographie", "Zeitrechnung"], wiki: "Zeitzone",
    question: "In Berlin ist es im Winter genau 12 Uhr mittags. Wie spät ist es in diesem Moment in New York?",
    options: ["6 Uhr morgens", "18 Uhr", "9 Uhr morgens", "3 Uhr nachts"], correct: 0,
    hints: ["Die Erde dreht sich nach Osten – im Westen geht die Sonne später auf.", "Berlin hat im Winter UTC+1, New York UTC−5."],
    explanation: "Zwischen UTC+1 und UTC−5 liegen sechs Stunden: In New York ist es 6 Uhr morgens. Weil die USA und Europa die Uhren an verschiedenen Tagen umstellen, sind es im Frühjahr und Herbst für ein paar Wochen nur fünf Stunden.",
    en: {
      question: "In Berlin it is exactly 12 noon in winter. What time is it in New York at that moment?",
      options: ["6 in the morning", "6 in the evening", "9 in the morning", "3 at night"],
      hints: ["The Earth turns eastwards – in the west the sun rises later.", "In winter Berlin is on UTC+1, New York on UTC−5."],
      explanation: "There are six hours between UTC+1 and UTC−5: in New York it is 6 in the morning. Because the USA and Europe change their clocks on different days, for a few weeks in spring and autumn the difference is only five hours.",
    },
  },
  {
    id: "rt34", category: "math", difficulty: 3, minAge: 13, tags: ["Logik", "Geometrie"], wiki: "Zifferblatt",
    question: "Wie oft an einem ganzen Tag stehen der Stunden- und der Minutenzeiger einer Uhr genau übereinander?",
    options: ["24-mal", "22-mal", "12-mal", "23-mal"], correct: 1,
    hints: ["Um 12 Uhr stehen sie übereinander – das nächste Mal aber nicht genau um 1:05.", "In 12 Stunden dreht der Minutenzeiger 12 Runden, der Stundenzeiger nur eine. Wie oft überholt der eine den anderen?"],
    explanation: "In 12 Stunden überholt der Minutenzeiger den Stundenzeiger nur 11-mal – alle 65 5⁄11 Minuten. An einem ganzen Tag sind das 22 Treffen. Die Begegnung um 11 Uhr fehlt: Sie fällt mit der um 12 Uhr zusammen.",
    en: {
      question: "How many times in a whole day do the hour hand and the minute hand of a clock lie exactly on top of each other?",
      options: ["24 times", "22 times", "12 times", "23 times"],
      hints: ["At 12 o'clock they overlap – but the next time is not exactly at 1:05.", "In 12 hours the minute hand turns 12 times, the hour hand only once. How often does one overtake the other?"],
      explanation: "In 12 hours the minute hand overtakes the hour hand only 11 times – every 65 5⁄11 minutes. In a whole day that makes 22 meetings. The meeting around 11 o'clock is missing: it coincides with the one at 12.",
    },
  },
  {
    id: "rt35", category: "culture", difficulty: 1, minAge: 13, tags: ["Mythologie"], wiki: "Ödipus",
    question: "Was geht am Morgen auf vier Beinen, am Mittag auf zwei und am Abend auf drei?",
    options: ["Der Mensch", "Eine Katze", "Ein Schatten", "Ein Pferd"], correct: 0,
    hints: ["Morgen, Mittag und Abend stehen für etwas viel Längeres als einen Tag.", "Denk an ein ganzes Leben – und an einen Gehstock."],
    explanation: "Als Kleinkind krabbelt der Mensch auf allen vieren, als Erwachsener geht er auf zwei Beinen, im Alter mit Stock. In der griechischen Sage stellte die Sphinx vor Theben dieses Rätsel – Ödipus löste es.",
    en: {
      question: "What walks on four legs in the morning, on two at noon and on three in the evening?",
      options: ["A human", "A cat", "A shadow", "A horse"],
      hints: ["Morning, noon and evening stand for something much longer than a day.", "Think of a whole life – and of a walking stick."],
      explanation: "As a toddler a human crawls on all fours, as an adult walks on two legs, and in old age with a stick. In Greek myth the Sphinx outside Thebes asked this riddle – Oedipus solved it.",
    },
  },
  {
    id: "rt36", category: "sport", difficulty: 2, minAge: 13, tags: ["Logik"], wiki: "K.-o.-System",
    question: "An einem Turnier nehmen 64 Spieler teil. Wer ein Spiel verliert, scheidet aus. Wie viele Spiele braucht es, bis der Sieger feststeht?",
    options: ["32", "63", "64", "6"], correct: 1,
    hints: ["Jedes Spiel hat genau einen Verlierer.", "Am Ende sind alle bis auf einen ausgeschieden."],
    explanation: "Jedes Spiel scheidet genau einen Spieler aus. Damit 63 von 64 ausscheiden, braucht es 63 Spiele: 32 + 16 + 8 + 4 + 2 + 1. Die 6 ist die Zahl der Runden.",
    en: {
      question: "64 players take part in a tournament. Whoever loses a match is out. How many matches are needed until the winner is decided?",
      options: ["32", "63", "64", "6"],
      hints: ["Every match has exactly one loser.", "In the end everyone but one has been knocked out."],
      explanation: "Every match knocks out exactly one player. For 63 of the 64 to be knocked out, 63 matches are needed: 32 + 16 + 8 + 4 + 2 + 1. The 6 is the number of rounds.",
    },
  },
  {
    id: "rt37", category: "math", difficulty: 3, minAge: 13, tags: ["Geometrie"], wiki: "Kreiszahl",
    question: "Ein Seil liegt straff um den Äquator. Man verlängert es um nur einen Meter und hebt es rundherum gleichmäßig an. Wie hoch steht es dann über dem Boden?",
    options: ["Weniger als einen Millimeter", "Etwa 16 Zentimeter", "Etwa einen Meter", "Etwa einen Mikrometer"], correct: 1,
    hints: ["Der Umfang eines Kreises ist 2π mal der Radius.", "Ein Meter mehr Umfang bedeutet: Der Radius wächst um 1 m geteilt durch 2π.", "Wie groß die Erde ist, spielt dabei überhaupt keine Rolle."],
    explanation: "1 m : 2π ≈ 0,16 m – egal, ob das Seil um die Erde oder um einen Fußball liegt. Die meisten schätzen viel zu wenig, weil ein Meter neben 40.000 Kilometern winzig wirkt.",
    en: {
      question: "A rope lies tight around the equator. You make it just one metre longer and lift it evenly all the way round. How high above the ground is it then?",
      options: ["Less than a millimetre", "About 16 centimetres", "About a metre", "About a micrometre"],
      hints: ["The circumference of a circle is 2π times the radius.", "One metre more circumference means the radius grows by 1 m divided by 2π.", "The size of the Earth makes no difference at all."],
      explanation: "1 m : 2π ≈ 0.16 m – whether the rope goes round the Earth or round a football. Most people guess far too little, because one metre looks tiny next to 40,000 kilometres.",
    },
  },
  {
    id: "rt38", category: "math", difficulty: 3, minAge: 13, tags: ["Logik"], wiki: "Verwandtschaftsbeziehung",
    question: "Ein Mann betrachtet ein Porträt und sagt: „Geschwister habe ich keine. Aber der Vater dieses Mannes ist der Sohn meines Vaters.“ Wen zeigt das Bild?",
    options: ["Ihn selbst", "Seinen Sohn", "Seinen Vater", "Seinen Neffen"], correct: 1,
    hints: ["Wer ist „der Sohn meines Vaters“, wenn der Sprecher keine Geschwister hat?", "Setze das ein: Der Vater des Mannes auf dem Bild ist …"],
    explanation: "Ohne Geschwister ist „der Sohn meines Vaters“ der Sprecher selbst. Der Vater des Abgebildeten ist also der Sprecher – das Bild zeigt seinen Sohn. Viele antworten „ihn selbst“, weil sie den Satz im Kopf zu schnell zusammenziehen.",
    en: {
      question: "A man looks at a portrait and says: \"I have no brothers or sisters. But this man's father is my father's son.\" Who is in the picture?",
      options: ["The man himself", "His son", "His father", "His nephew"],
      hints: ["Who is \"my father's son\" if the speaker has no siblings?", "Put that in: the father of the man in the picture is …"],
      explanation: "Without siblings, \"my father's son\" is the speaker himself. So the father of the man in the picture is the speaker – the picture shows his son. Many answer \"himself\" because they squash the sentence together too quickly in their heads.",
    },
  },
  {
    id: "rt39", category: "technology", difficulty: 1, minAge: 13, tags: ["Sicherheit", "Rechnen"], wiki: "Passwort",
    question: "Eine PIN besteht aus 4 Ziffern. Wie viele verschiedene PINs gibt es?",
    options: ["40", "1.000", "10.000", "9.999"], correct: 2,
    hints: ["Für jede Stelle gibt es 10 Ziffern, von 0 bis 9.", "Die Möglichkeiten multiplizieren sich: 10 · 10 · …"],
    explanation: "10 · 10 · 10 · 10 = 10.000 – von 0000 bis 9999. Ein Computer probiert so wenige Möglichkeiten in Sekundenbruchteilen durch; deshalb sperren Bankkarten nach wenigen Fehlversuchen, und lange Passwörter mit Buchstaben und Zeichen sind viel sicherer.",
    en: {
      question: "A PIN has 4 digits. How many different PINs are there?",
      options: ["40", "1,000", "10,000", "9,999"],
      hints: ["For each position there are 10 digits, from 0 to 9.", "The possibilities multiply: 10 · 10 · …"],
      explanation: "10 · 10 · 10 · 10 = 10,000 – from 0000 to 9999. A computer tries so few possibilities in a fraction of a second; that is why bank cards lock after a few wrong attempts, and long passwords with letters and symbols are much safer.",
    },
  },
];
