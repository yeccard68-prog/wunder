// Book insights, first collection (October 2026): 20 influential non-fiction books.
//   node scripts/content/build-books.mjs   → writes content/books.json (the app reads that file)
// Every text here is an original explanation written for this app – no passages from the books,
// no covers. "thesis" and the ideas describe what the AUTHOR argues; "limits" is criticism and context.
// Written and checked by the AI assistant → "ai_checked"; a human reviewer sets "verified".
//
// book(id, category, topic, title, germanTitle, author, year, minAge, wikiDe, related, de, en)
//   de / en = { thesis, ideas: [[title, text, example, visual?], …], limits, reflect }
//   visual  = { type: "loop", nodes: [...] , note }
//           | { type: "compare", left: [title, ...points], right: [title, ...points] }
//           | { type: "scenario", prompt, options: [[label, feedback], …], insight }
//           | { type: "growth", unit, perMonth, rate, label, hint }
export const VERIFICATION = "ai_checked";

const book = (id, category, topic, title, titleDe, author, year, minAge, wiki, related, de, en) => ({ id, category, topic, title, titleDe, author, year, minAge, wiki, related, de, en });

export const books = [
  book("kahneman", "thinking", "science", "Thinking, Fast and Slow", "Schnelles Denken, langsames Denken", "Daniel Kahneman", 2011, 13, "Schnelles_Denken,_langsames_Denken", ["cialdini", "rosling", "housel"],
    {
      thesis: "Kahneman beschreibt zwei Arten zu denken: eine schnelle, mühelose und eine langsame, anstrengende. Die schnelle trifft die meisten Entscheidungen – und macht dabei vorhersagbare Fehler.",
      ideas: [
        ["Zwei Systeme", "„System 1“ arbeitet automatisch und sofort: Gesichter erkennen, 2 + 2 rechnen, einem lauten Geräusch ausweichen. „System 2“ ist das bewusste Nachdenken, das wir für 17 × 24 brauchen. System 2 hält sich für den Chef, übernimmt aber meist einfach, was System 1 vorschlägt.", "Ein Schläger und ein Ball kosten zusammen 1,10 €. Der Schläger kostet 1 € mehr als der Ball. Die schnelle Antwort „10 Cent“ ist falsch – richtig sind 5 Cent.", { type: "compare", left: ["System 1", "schnell und mühelos", "läuft automatisch", "liebt einfache Geschichten", "anfällig für Denkfehler"], right: ["System 2", "langsam und anstrengend", "muss eingeschaltet werden", "kann rechnen und prüfen", "wird schnell müde"] }],
        ["Der Anker", "Eine Zahl, die wir kurz vorher gesehen haben, zieht unsere Schätzung zu sich hin – selbst wenn sie mit der Frage nichts zu tun hat. Kahneman nennt das den Ankereffekt.", "Wer in einer Verhandlung die erste Zahl nennt, setzt den Anker. Auch „statt 199 € nur 99 €“ funktioniert so.", { type: "scenario", prompt: "Ein Pullover ist mit „vorher 120 €, jetzt 60 €“ ausgezeichnet. Ein gleicher Pullover nebenan kostet einfach 55 €. Welcher fühlt sich spontan wie das bessere Angebot an?", options: [["Der reduzierte für 60 €", "So geht es den meisten: Die 120 € wirken als Anker, 60 € fühlen sich wie ein Gewinn an – obwohl der andere Pullover billiger ist."], ["Der für 55 €", "Rechnerisch richtig. Trotzdem greifen viele zum reduzierten: Die durchgestrichene Zahl verschiebt, was uns „günstig“ erscheint."]], insight: "Frag dich bei jedem Angebot: Was wäre mir das wert, wenn ich die erste Zahl nie gesehen hätte?" }],
        ["Verluste wiegen schwerer", "Ein Verlust schmerzt nach Kahneman und Tversky etwa doppelt so stark, wie ein gleich großer Gewinn freut. Deshalb meiden Menschen faire Wetten und halten an Dingen fest, die sie einmal besitzen.", "Viele lehnen einen Münzwurf ab, bei dem sie 100 € verlieren oder 150 € gewinnen können – obwohl er sich im Schnitt lohnt.", null],
      ],
      limits: "Einige im Buch zitierte Studien, vor allem zum sogenannten Priming, ließen sich später nicht bestätigen; Kahneman hat das selbst eingeräumt. Die Einteilung in zwei Systeme ist ein Bild zum Verstehen, keine Beschreibung zweier Hirnregionen.",
      reflect: "Bei welcher Entscheidung der letzten Woche hast du dich auf dein Bauchgefühl verlassen – und hätte sich ein zweiter Blick gelohnt?",
    },
    {
      thesis: "Kahneman describes two ways of thinking: one fast and effortless, one slow and demanding. The fast one makes most decisions – and makes predictable mistakes in the process.",
      ideas: [
        ["Two systems", "“System 1” works automatically and instantly: recognising faces, adding 2 + 2, dodging a loud noise. “System 2” is the deliberate thinking we need for 17 × 24. System 2 believes it is in charge but mostly just accepts what System 1 suggests.", "A bat and a ball cost 1.10 together. The bat costs 1.00 more than the ball. The quick answer “10 cents” is wrong – the right answer is 5 cents.", { type: "compare", left: ["System 1", "fast and effortless", "runs automatically", "loves simple stories", "prone to biases"], right: ["System 2", "slow and demanding", "has to be switched on", "can calculate and check", "tires quickly"] }],
        ["The anchor", "A number we have just seen pulls our estimate towards it – even when it has nothing to do with the question. Kahneman calls this the anchoring effect.", "Whoever names the first number in a negotiation sets the anchor. “Was 199, now only 99” works the same way.", { type: "scenario", prompt: "A jumper is labelled “was 120, now 60”. An identical jumper next to it simply costs 55. Which one spontaneously feels like the better deal?", options: [["The reduced one for 60", "That is how most people feel: the 120 acts as an anchor and 60 feels like a gain – although the other jumper is cheaper."], ["The one for 55", "Correct by the numbers. Still, many people reach for the reduced one: the crossed-out figure shifts what seems “cheap” to us."]], insight: "With every offer, ask yourself: what would this be worth to me if I had never seen the first number?" }],
        ["Losses loom larger", "According to Kahneman and Tversky, a loss hurts about twice as much as an equal gain pleases. That is why people avoid fair bets and hold on to things once they own them.", "Many people turn down a coin toss in which they could lose 100 or win 150 – although it pays off on average.", null],
      ],
      limits: "Some studies cited in the book, especially on so-called priming, could not be confirmed later; Kahneman acknowledged this himself. The division into two systems is an image to aid understanding, not a description of two brain regions.",
      reflect: "In which decision last week did you rely on your gut feeling – and would a second look have been worthwhile?",
    }),

  book("clear", "habits", "science", "Atomic Habits", "Die 1%-Methode", "James Clear", 2018, 13, "Gewohnheit", ["duhigg", "newport", "dweck"],
    {
      thesis: "Clear argumentiert, dass große Veränderungen selten aus großen Vorsätzen entstehen, sondern aus sehr kleinen Gewohnheiten, die man lange durchhält – und dass man dafür an der Umgebung ansetzen sollte, nicht an der Willenskraft.",
      ideas: [
        ["Vier Schritte einer Gewohnheit", "Jede Gewohnheit läuft nach Clear in vier Schritten ab: Ein Auslöser weckt ein Verlangen, darauf folgt eine Reaktion, und eine Belohnung sorgt dafür, dass wir es wieder tun. Wer eine Gewohnheit ändern will, kann an jedem Schritt ansetzen.", "Handy vibriert (Auslöser) → wissen wollen, wer schreibt (Verlangen) → nachsehen (Reaktion) → Neugier gestillt (Belohnung).", { type: "loop", nodes: ["Auslöser", "Verlangen", "Reaktion", "Belohnung"], note: "Gute Gewohnheit: offensichtlich, attraktiv, einfach und befriedigend machen." }],
        ["Systeme statt Ziele", "Ziele geben die Richtung vor, aber Gewinner und Verlierer haben oft dasselbe Ziel. Den Unterschied macht nach Clear das System – also das, was man jeden Tag tatsächlich tut.", "Statt „Ich will ein Buch schreiben“: „Ich schreibe jeden Morgen eine Seite.“", null],
        ["Wer will ich sein?", "Gewohnheiten halten besser, wenn sie zum eigenen Selbstbild passen. Clear empfiehlt, nicht beim Ergebnis anzufangen, sondern bei der Identität: Jede kleine Handlung ist eine Stimme dafür, welche Art Mensch man ist.", "„Ich versuche aufzuhören“ klingt anders als „Ich bin Nichtraucher“.", null],
      ],
      limits: "Die Rechnung „jeden Tag 1 % besser ergibt nach einem Jahr das 37-Fache“ ist ein Bild, keine Messung – Fähigkeiten wachsen nicht wie Zinsen. Vieles im Buch stützt sich auf Einzelbeispiele; wie lange es dauert, bis eine Gewohnheit sitzt, schwankt in Studien stark.",
      reflect: "Welche winzige Handlung – unter zwei Minuten – wäre eine Stimme für die Person, die du sein möchtest?",
    },
    {
      thesis: "Clear argues that big changes rarely come from big resolutions but from very small habits kept up for a long time – and that the place to start is your environment, not your willpower.",
      ideas: [
        ["Four steps of a habit", "According to Clear, every habit runs in four steps: a cue triggers a craving, a response follows, and a reward makes sure we do it again. Anyone who wants to change a habit can start at any of these steps.", "Phone vibrates (cue) → wanting to know who wrote (craving) → checking (response) → curiosity satisfied (reward).", { type: "loop", nodes: ["Cue", "Craving", "Response", "Reward"], note: "For a good habit: make it obvious, attractive, easy and satisfying." }],
        ["Systems instead of goals", "Goals set the direction, but winners and losers often have the same goal. According to Clear, the difference is the system – what you actually do every day.", "Instead of “I want to write a book”: “I write one page every morning.”", null],
        ["Who do I want to be?", "Habits last better when they fit your self-image. Clear recommends starting not with the outcome but with identity: every small action is a vote for the kind of person you are.", "“I'm trying to quit” sounds different from “I'm a non-smoker”.", null],
      ],
      limits: "The calculation “1% better every day makes you 37 times better after a year” is an image, not a measurement – skills do not grow like interest. Much of the book rests on individual examples; how long it takes for a habit to stick varies widely in studies.",
      reflect: "Which tiny action – under two minutes – would be a vote for the person you want to be?",
    }),

  book("duhigg", "habits", "science", "The Power of Habit", "Die Macht der Gewohnheit", "Charles Duhigg", 2012, 13, "Gewohnheit", ["clear", "cialdini"],
    {
      thesis: "Duhigg erklärt Gewohnheiten als Schleife aus Auslöser, Routine und Belohnung. Wer die Schleife erkennt, kann die Routine austauschen – bei sich selbst, in Unternehmen und in ganzen Gesellschaften.",
      ideas: [
        ["Die Gewohnheitsschleife", "Ein Auslöser startet eine Routine, die mit einer Belohnung endet. Wiederholt sich das oft genug, erwartet das Gehirn die Belohnung schon beim Auslöser – und die Handlung läuft fast von selbst ab.", "Nachmittags um drei (Auslöser) zur Kaffeeküche gehen (Routine) und mit Kollegen plaudern (Belohnung).", { type: "loop", nodes: ["Auslöser", "Routine", "Belohnung"], note: "Goldene Regel: Auslöser und Belohnung behalten, nur die Routine austauschen." }],
        ["Die goldene Regel", "Alte Gewohnheiten lassen sich nach Duhigg kaum löschen, aber umbauen: Man behält Auslöser und Belohnung und ersetzt nur die Routine dazwischen. Dafür muss man zuerst herausfinden, welche Belohnung man eigentlich sucht.", "Geht es beim Keks um den Zucker – oder um die Pause und das Gespräch? Dann hilft vielleicht ein kurzer Gang zu den Kollegen.", null],
        ["Schlüsselgewohnheiten", "Manche Gewohnheiten ziehen andere nach sich. Duhigg nennt sie Schlüsselgewohnheiten: Wer eine davon verändert, stößt oft eine Kette weiterer Veränderungen an.", "Menschen, die anfangen, regelmäßig Sport zu treiben, essen laut Duhigg oft auch bewusster und schlafen besser.", null],
      ],
      limits: "Die Schleife vereinfacht stark, was die Forschung über Gewohnheiten weiß. Viele Beispiele sind gut erzählte Einzelfälle; ob eine „Schlüsselgewohnheit“ wirklich die Ursache der übrigen Veränderungen war, lässt sich daraus nicht sicher ableiten.",
      reflect: "Welche deiner Routinen würdest du gern austauschen – und welche Belohnung steckt eigentlich dahinter?",
    },
    {
      thesis: "Duhigg explains habits as a loop of cue, routine and reward. Whoever recognises the loop can swap the routine – in themselves, in companies and in whole societies.",
      ideas: [
        ["The habit loop", "A cue starts a routine that ends with a reward. If this repeats often enough, the brain expects the reward as soon as the cue appears – and the action runs almost by itself.", "Three in the afternoon (cue), walking to the coffee kitchen (routine) and chatting with colleagues (reward).", { type: "loop", nodes: ["Cue", "Routine", "Reward"], note: "Golden rule: keep the cue and the reward, swap only the routine." }],
        ["The golden rule", "According to Duhigg, old habits can hardly be erased but they can be rebuilt: you keep the cue and the reward and replace only the routine in between. To do that, you first have to find out which reward you are actually after.", "Is the biscuit about the sugar – or about the break and the chat? Then a short walk to your colleagues might do.", null],
        ["Keystone habits", "Some habits bring others with them. Duhigg calls them keystone habits: changing one of them often sets off a chain of further changes.", "People who start exercising regularly often also eat more consciously and sleep better, Duhigg says.", null],
      ],
      limits: "The loop greatly simplifies what research knows about habits. Many examples are well-told individual cases; whether a “keystone habit” really caused the other changes cannot be safely concluded from them.",
      reflect: "Which of your routines would you like to swap – and which reward is actually behind it?",
    }),

  book("harari", "history", "history", "Sapiens: A Brief History of Humankind", "Eine kurze Geschichte der Menschheit", "Yuval Noah Harari", 2011, 13, "Eine_kurze_Geschichte_der_Menschheit", ["diamond", "dawkins", "rosling"],
    {
      thesis: "Harari erzählt die Geschichte des Homo sapiens als Folge von drei Umbrüchen – der kognitiven, der landwirtschaftlichen und der wissenschaftlichen Revolution. Seine Kernthese: Menschen beherrschen den Planeten, weil sie an gemeinsame Geschichten glauben können.",
      ideas: [
        ["Gemeinsame Geschichten", "Tiere arbeiten nur in kleinen Gruppen eng zusammen, in denen sich alle kennen. Menschen können nach Harari mit Millionen Fremden kooperieren, weil sie gemeinsam an Dinge glauben, die es nur in ihrer Vorstellung gibt: Götter, Nationen, Geld, Unternehmen, Menschenrechte.", "Ein Geldschein ist ein Stück Papier. Er hat Wert, weil alle darauf vertrauen, dass alle anderen ihn annehmen.", null],
        ["Die Falle der Landwirtschaft", "Harari nennt die Erfindung der Landwirtschaft provokant den „größten Betrug der Geschichte“: Sie ernährte viel mehr Menschen, aber der einzelne Bauer arbeitete härter, aß einseitiger und war anfälliger für Hunger und Seuchen als die Jäger und Sammler vor ihm.", "Mehr Nahrung führte zu mehr Kindern – und damit zu noch mehr Arbeit. Ein Zurück gab es nicht mehr.", null],
        ["Die Entdeckung des Nichtwissens", "Die wissenschaftliche Revolution begann nach Harari mit einem Eingeständnis: Wir wissen vieles nicht. Erst wer das zugibt, forscht systematisch – und Europas Herrscher finanzierten diese Forschung, weil sie Macht und Reichtum versprach.", "Auf alten Weltkarten waren unbekannte Gebiete ausgemalt. Ab dem 15. Jahrhundert ließ man sie weiß – als Einladung, sie zu erkunden.", null],
      ],
      limits: "Fachhistoriker und Anthropologen werfen dem Buch vor, sehr große Thesen auf dünner Beweislage zu bauen – etwa zum Leben der Jäger und Sammler, über das wir wenig sicher wissen. Es ist eine Deutung der Geschichte, kein Nachschlagewerk.",
      reflect: "An welche gemeinsame Geschichte glaubst du so selbstverständlich, dass sie dir gar nicht wie eine Geschichte vorkommt?",
    },
    {
      thesis: "Harari tells the history of Homo sapiens as a sequence of three upheavals – the cognitive, the agricultural and the scientific revolution. His central claim: humans rule the planet because they can believe in shared stories.",
      ideas: [
        ["Shared stories", "Animals cooperate closely only in small groups in which everyone knows everyone. According to Harari, humans can cooperate with millions of strangers because they jointly believe in things that exist only in their imagination: gods, nations, money, companies, human rights.", "A banknote is a piece of paper. It has value because everyone trusts that everyone else will accept it.", null],
        ["The trap of agriculture", "Harari provocatively calls the invention of agriculture “history's biggest fraud”: it fed far more people, but the individual farmer worked harder, ate a narrower diet and was more vulnerable to hunger and disease than the hunter-gatherers before him.", "More food led to more children – and so to even more work. There was no way back.", null],
        ["The discovery of ignorance", "According to Harari, the scientific revolution began with an admission: there is much we do not know. Only those who admit this investigate systematically – and Europe's rulers funded that research because it promised power and wealth.", "On old world maps, unknown regions were filled in. From the 15th century they were left blank – as an invitation to explore them.", null],
      ],
      limits: "Historians and anthropologists accuse the book of building very large claims on thin evidence – for instance about the lives of hunter-gatherers, about which we know little for certain. It is an interpretation of history, not a reference work.",
      reflect: "Which shared story do you believe in so naturally that it does not feel like a story to you at all?",
    }),

  book("ries", "business", "business", "The Lean Startup", "Lean Startup", "Eric Ries", 2011, 16, "Lean_Startup", ["thiel", "christensen", "rumelt"],
    {
      thesis: "Ries versteht ein Start-up als Experiment unter extremer Unsicherheit. Statt lange im Verborgenen zu entwickeln, soll es so früh wie möglich mit echten Kunden prüfen, ob seine Annahmen stimmen.",
      ideas: [
        ["Bauen, messen, lernen", "Der Kern der Methode ist eine Schleife: eine Idee in ein Produkt umsetzen, messen, wie Kunden reagieren, daraus lernen – und die nächste Runde starten. Je schneller ein Team diese Schleife durchläuft, desto weniger Zeit und Geld verschwendet es.", "Zappos-Gründer Nick Swinmurn fotografierte Schuhe im Laden und stellte sie online, bevor er ein Lager hatte. Erst als Leute bestellten, kaufte er die Schuhe.", { type: "loop", nodes: ["Bauen", "Messen", "Lernen"], note: "Ziel ist nicht das Produkt, sondern möglichst schnell geprüftes Wissen." }],
        ["Das kleinste brauchbare Produkt", "Ein „Minimum Viable Product“ ist nach Ries die einfachste Version, mit der sich eine Annahme testen lässt. Es soll nicht beeindrucken, sondern eine Frage beantworten: Will das überhaupt jemand?", "Dropbox zeigte zuerst nur ein kurzes Video der geplanten Funktion – und bekam über Nacht Zehntausende Anmeldungen für die Warteliste.", null],
        ["Kurswechsel oder durchhalten", "Zeigen die Messungen, dass eine Grundannahme falsch war, empfiehlt Ries einen „Pivot“: einen gezielten Kurswechsel, bei dem das Gelernte erhalten bleibt. Gefährlich seien „Eitelkeitskennzahlen“ – Zahlen, die gut aussehen, aber nichts über den Erfolg sagen.", "Die Zahl der Downloads steigt, aber fast niemand öffnet die App ein zweites Mal: ein Warnsignal, kein Grund zum Feiern.", null],
      ],
      limits: "Die Methode passt gut zu Software, wo ein Test wenig kostet. Bei Medikamenten, Flugzeugen oder Hardware sind halbfertige Produkte teuer oder gefährlich. Kritiker merken an, dass schnelle Kundentests große, visionäre Sprünge eher ausbremsen können.",
      reflect: "Welche Annahme hinter einem deiner Vorhaben könntest du diese Woche mit sehr wenig Aufwand testen?",
    },
    {
      thesis: "Ries sees a start-up as an experiment under extreme uncertainty. Instead of developing in secret for a long time, it should test with real customers as early as possible whether its assumptions hold.",
      ideas: [
        ["Build, measure, learn", "The core of the method is a loop: turn an idea into a product, measure how customers react, learn from it – and start the next round. The faster a team runs through this loop, the less time and money it wastes.", "Zappos founder Nick Swinmurn photographed shoes in a shop and put them online before he had a warehouse. Only when people ordered did he buy the shoes.", { type: "loop", nodes: ["Build", "Measure", "Learn"], note: "The goal is not the product but validated knowledge, as fast as possible." }],
        ["The minimum viable product", "According to Ries, a “minimum viable product” is the simplest version with which an assumption can be tested. It is not meant to impress but to answer one question: does anyone want this at all?", "Dropbox first showed only a short video of the planned feature – and got tens of thousands of sign-ups for the waiting list overnight.", null],
        ["Pivot or persevere", "If the measurements show that a basic assumption was wrong, Ries recommends a “pivot”: a deliberate change of course that keeps what has been learned. “Vanity metrics” are dangerous, he says – numbers that look good but say nothing about success.", "Downloads are rising, but almost nobody opens the app a second time: a warning sign, not a reason to celebrate.", null],
      ],
      limits: "The method fits software well, where a test costs little. With medicines, aircraft or hardware, half-finished products are expensive or dangerous. Critics note that quick customer tests can slow down big, visionary leaps.",
      reflect: "Which assumption behind one of your plans could you test this week with very little effort?",
    }),

  book("thiel", "business", "business", "Zero to One", "Zero to One", "Peter Thiel (mit Blake Masters)", 2014, 16, "Peter_Thiel", ["ries", "christensen"],
    {
      thesis: "Thiel unterscheidet zwei Arten von Fortschritt: Bestehendes kopieren („von 1 auf n“) und etwas wirklich Neues schaffen („von 0 auf 1“). Nur das zweite bringt nach seiner Ansicht die Zukunft voran – und macht Unternehmen wertvoll.",
      ideas: [
        ["Von null auf eins", "Wer etwas nachbaut, das es schon gibt, verbreitet eine bekannte Lösung weiter. Wer etwas Neues schafft, verändert, was überhaupt möglich ist. Thiels Lieblingsfrage an Bewerber: „Welche wichtige Wahrheit sehen nur sehr wenige Menschen so wie du?“", "Die tausendste Suchmaschine wäre „von 1 auf n“. Die erste gute war „von 0 auf 1“.", { type: "compare", left: ["Von 1 auf n", "Bestehendes kopieren", "mehr vom Gleichen", "viele Konkurrenten", "Gewinne schrumpfen"], right: ["Von 0 auf 1", "etwas Neues schaffen", "eine eigene Kategorie", "kaum Konkurrenz", "Raum für Gewinne"] }],
        ["Wettbewerb ist für Verlierer", "Thiels provokanteste These: In perfektem Wettbewerb verdient niemand Geld, weil sich alle gegenseitig unterbieten. Erfolgreiche Unternehmen seien deshalb Monopole – nicht durch Tricks, sondern weil sie etwas so viel besser machen, dass niemand mithalten kann.", "Thiel empfiehlt, mit einem sehr kleinen Markt zu beginnen und ihn zu beherrschen, statt in einem riesigen Markt unterzugehen.", null],
        ["Geheimnisse", "Thiel glaubt, dass es noch viele unentdeckte Wahrheiten gibt – über die Natur und über Menschen. Großartige Unternehmen entstehen für ihn dort, wo jemand ein solches „Geheimnis“ findet, das andere für unmöglich oder uninteressant halten.", "Dass Fremde einander ihre Wohnung vermieten würden, hielten viele für abwegig, bevor es Plattformen dafür gab.", null],
      ],
      limits: "Thiels Lob des Monopols ist umstritten: Ökonomen und Wettbewerbshüter sehen in marktbeherrschenden Unternehmen oft Nachteile für Kunden und Neugründungen. Das Buch argumentiert vor allem mit Gewinnern – die vielen gescheiterten Versuche, „von 0 auf 1“ zu kommen, bleiben unsichtbar.",
      reflect: "Womit bist du dir ziemlich sicher, obwohl die meisten Menschen um dich herum es anders sehen?",
    },
    {
      thesis: "Thiel distinguishes two kinds of progress: copying what exists (“from 1 to n”) and creating something truly new (“from 0 to 1”). In his view only the second moves the future forward – and makes companies valuable.",
      ideas: [
        ["From zero to one", "Whoever rebuilds something that already exists spreads a known solution further. Whoever creates something new changes what is possible at all. Thiel's favourite question for applicants: “What important truth do very few people agree with you on?”", "The thousandth search engine would be “from 1 to n”. The first good one was “from 0 to 1”.", { type: "compare", left: ["From 1 to n", "copying what exists", "more of the same", "many competitors", "profits shrink"], right: ["From 0 to 1", "creating something new", "a category of its own", "hardly any competition", "room for profit"] }],
        ["Competition is for losers", "Thiel's most provocative claim: under perfect competition nobody makes money because everyone undercuts everyone else. Successful companies are therefore monopolies, he says – not through tricks but because they do something so much better that nobody can keep up.", "Thiel recommends starting with a very small market and dominating it instead of drowning in a huge one.", null],
        ["Secrets", "Thiel believes there are still many undiscovered truths – about nature and about people. For him, great companies arise where someone finds such a “secret” that others consider impossible or uninteresting.", "That strangers would rent their homes to one another seemed absurd to many before platforms for it existed.", null],
      ],
      limits: "Thiel's praise of monopoly is controversial: economists and competition authorities often see dominant companies as a disadvantage for customers and new ventures. The book argues mainly from winners – the many failed attempts to get “from 0 to 1” remain invisible.",
      reflect: "What are you fairly sure of although most people around you see it differently?",
    }),

  book("rumelt", "business", "business", "Good Strategy Bad Strategy", "Good Strategy Bad Strategy", "Richard Rumelt", 2011, 16, "Strategie_(Wirtschaft)", ["ries", "christensen", "meadows"],
    {
      thesis: "Rumelt hält das meiste, was als Strategie bezeichnet wird, für Wunschdenken. Eine gute Strategie benennt nach ihm ehrlich das entscheidende Problem und bündelt die Kräfte, um es zu lösen.",
      ideas: [
        ["Der Kern einer Strategie", "Jede gute Strategie hat nach Rumelt drei Teile: eine Diagnose, die erklärt, worin die Herausforderung eigentlich besteht; eine Leitlinie, wie man ihr begegnet; und abgestimmte Maßnahmen, die diese Leitlinie umsetzen.", "Ein Arzt arbeitet genauso: Befund, Behandlungsansatz, konkrete Therapie.", { type: "loop", nodes: ["Diagnose", "Leitlinie", "Abgestimmte Maßnahmen"], note: "Fehlt einer der drei Teile, ist es noch keine Strategie." }],
        ["Woran man schlechte Strategie erkennt", "Rumelt nennt vier Warnzeichen: hochtrabende Worthülsen, das Ausweichen vor dem eigentlichen Problem, Ziele, die als Strategie ausgegeben werden, und eine lange Liste unverbundener Vorhaben.", "„Wir wollen Marktführer werden und um 20 % wachsen“ ist ein Ziel. Wie das gelingen soll, sagt der Satz nicht.", { type: "compare", left: ["Schlechte Strategie", "Worthülsen", "weicht dem Problem aus", "Ziele statt Plan", "alles ist Priorität"], right: ["Gute Strategie", "klare Diagnose", "benennt das Hindernis", "sagt, was man NICHT tut", "bündelt die Kräfte"] }],
        ["Strategie heißt auswählen", "Weil Mittel und Aufmerksamkeit begrenzt sind, bedeutet Strategie für Rumelt vor allem Verzicht: Man konzentriert die Kraft auf den Punkt, an dem sie am meisten bewirkt – und sagt zu vielem anderen Nein.", "Als Steve Jobs 1997 zu Apple zurückkehrte, strich er den Großteil der Produktpalette und konzentrierte das Unternehmen auf wenige Geräte.", null],
      ],
      limits: "Rumelts Beispiele sind im Rückblick ausgewählt; ob eine Strategie „gut“ war, steht oft erst fest, wenn das Ergebnis bekannt ist. Die drei Teile sind ein hilfreiches Prüfraster, garantieren aber keine richtige Diagnose.",
      reflect: "Was ist bei deinem wichtigsten Vorhaben eigentlich das zentrale Hindernis – in einem Satz?",
    },
    {
      thesis: "Rumelt considers most of what is called strategy to be wishful thinking. A good strategy, he says, honestly names the decisive problem and concentrates effort on solving it.",
      ideas: [
        ["The kernel of a strategy", "According to Rumelt, every good strategy has three parts: a diagnosis that explains what the challenge actually is; a guiding policy for dealing with it; and coherent actions that carry out that policy.", "A doctor works the same way: findings, approach to treatment, specific therapy.", { type: "loop", nodes: ["Diagnosis", "Guiding policy", "Coherent actions"], note: "If one of the three parts is missing, it is not yet a strategy." }],
        ["How to spot bad strategy", "Rumelt names four warning signs: pompous buzzwords, dodging the real problem, goals passed off as strategy, and a long list of unconnected initiatives.", "“We want to be market leader and grow by 20%” is a goal. The sentence does not say how.", { type: "compare", left: ["Bad strategy", "buzzwords", "dodges the problem", "goals instead of a plan", "everything is a priority"], right: ["Good strategy", "clear diagnosis", "names the obstacle", "says what NOT to do", "concentrates effort"] }],
        ["Strategy means choosing", "Because resources and attention are limited, strategy for Rumelt above all means giving things up: you concentrate force on the point where it achieves most – and say no to much else.", "When Steve Jobs returned to Apple in 1997, he cut most of the product range and focused the company on a few devices.", null],
      ],
      limits: "Rumelt's examples are chosen in hindsight; whether a strategy was “good” is often clear only once the outcome is known. The three parts are a useful checklist but do not guarantee a correct diagnosis.",
      reflect: "What is actually the central obstacle in your most important project – in one sentence?",
    }),

  book("christensen", "business", "business", "The Innovator's Dilemma", "The Innovator's Dilemma", "Clayton M. Christensen", 1997, 16, "Disruptive_Technologie", ["thiel", "ries", "rumelt"],
    {
      thesis: "Christensen fragt, warum gut geführte Marktführer immer wieder von Neulingen verdrängt werden. Seine Antwort: gerade weil sie alles „richtig“ machen – auf ihre besten Kunden hören und in die profitabelsten Produkte investieren.",
      ideas: [
        ["Disruption kommt von unten", "Eine disruptive Innovation ist nach Christensen anfangs schlechter als das etablierte Produkt, aber billiger, einfacher oder bequemer. Sie gewinnt Kunden, die der Marktführer gar nicht haben will, wird Jahr für Jahr besser – und reicht irgendwann auch den anspruchsvollen Kunden.", "Die ersten Digitalkameras machten deutlich schlechtere Bilder als Film. Zwanzig Jahre später war der Filmmarkt fast verschwunden.", null],
        ["Das Dilemma", "Für den Marktführer ist es vernünftig, das neue, billige Geschäft zu ignorieren: Die Margen sind klein, der Markt winzig, die besten Kunden wollen es nicht. Genau diese vernünftige Entscheidung führt nach Christensen später in den Untergang.", "Kodak entwickelte 1975 selbst eine der ersten Digitalkameras – und verfolgte sie nicht entschlossen weiter, weil das Filmgeschäft so profitabel war.", { type: "scenario", prompt: "Du leitest einen Marktführer. Ein Start-up bietet eine billige, schwächere Alternative für Kunden an, die du nie bedient hast. Deine besten Kunden interessiert sie nicht. Was tust du?", options: [["Ignorieren und das Kerngeschäft verbessern", "So entscheiden die meisten – und kurzfristig ist es richtig. Aber die Alternative wird jedes Jahr besser und wandert nach oben in deinen Markt."], ["Ein kleines, unabhängiges Team darauf ansetzen", "Das empfiehlt Christensen: eine getrennte Einheit, die mit kleinen Umsätzen zufrieden sein darf und nicht mit dem Kerngeschäft um Mittel konkurriert."]], insight: "Das Gefährliche an Disruption: Sie sieht lange nach einem Geschäft aus, das sich nicht lohnt." }],
        ["Erhaltend oder disruptiv", "Christensen trennt zwei Arten von Neuerungen. Erhaltende Innovationen machen gute Produkte für bestehende Kunden noch besser – darin sind Marktführer stark. Disruptive verändern, wer überhaupt Kunde ist und worauf es ankommt.", "Ein noch schärferes Kameraobjektiv ist erhaltend. Die Kamera im Telefon war disruptiv.", null],
      ],
      limits: "Die Historikerin Jill Lepore und andere haben kritisiert, Christensen habe seine Fallbeispiele passend ausgewählt und einige der „verdrängten“ Firmen hätten lange überlebt. Der Begriff „Disruption“ wird heute zudem für fast jede Neuerung verwendet – weit über Christensens enge Definition hinaus.",
      reflect: "Welches Angebot belächelst du gerade als „Spielzeug“ – und könnte es in zehn Jahren gut genug sein?",
    },
    {
      thesis: "Christensen asks why well-managed market leaders are repeatedly displaced by newcomers. His answer: precisely because they do everything “right” – listening to their best customers and investing in their most profitable products.",
      ideas: [
        ["Disruption comes from below", "According to Christensen, a disruptive innovation is initially worse than the established product but cheaper, simpler or more convenient. It wins customers the market leader does not even want, gets better year by year – and eventually is good enough for demanding customers too.", "The first digital cameras took clearly worse pictures than film. Twenty years later the film market had almost disappeared.", null],
        ["The dilemma", "For the market leader it is rational to ignore the new, cheap business: margins are small, the market tiny, the best customers do not want it. According to Christensen, exactly this rational decision later leads to downfall.", "Kodak itself built one of the first digital cameras in 1975 – and did not pursue it decisively because the film business was so profitable.", { type: "scenario", prompt: "You run a market leader. A start-up offers a cheap, weaker alternative to customers you have never served. Your best customers are not interested. What do you do?", options: [["Ignore it and improve the core business", "That is what most decide – and in the short term it is right. But the alternative gets better every year and moves up into your market."], ["Put a small, independent team on it", "This is what Christensen recommends: a separate unit that is allowed to be content with small revenues and does not compete with the core business for resources."]], insight: "The dangerous thing about disruption: for a long time it looks like a business not worth having." }],
        ["Sustaining or disruptive", "Christensen separates two kinds of innovation. Sustaining innovations make good products even better for existing customers – market leaders are strong at this. Disruptive ones change who is a customer at all and what matters.", "An even sharper camera lens is sustaining. The camera in the phone was disruptive.", null],
      ],
      limits: "The historian Jill Lepore and others have criticised Christensen for choosing his case studies to fit, and note that some of the “displaced” firms survived for a long time. Today the term “disruption” is also used for almost any novelty – far beyond Christensen's narrow definition.",
      reflect: "Which offering are you currently dismissing as a “toy” – and could it be good enough in ten years?",
    }),

  book("housel", "money", "economy", "The Psychology of Money", "Über die Psychologie des Geldes", "Morgan Housel", 2020, 13, "Zinseszins", ["kahneman", "clear"],
    {
      thesis: "Housel argumentiert, dass der Umgang mit Geld weniger mit Wissen als mit Verhalten zu tun hat. Geduld, Bescheidenheit und der Umgang mit Angst zählen für ihn mehr als Intelligenz oder die perfekte Strategie.",
      ideas: [
        ["Zeit schlägt Rendite", "Der Zinseszins wirkt erst über sehr lange Zeiträume richtig stark. Housels Beispiel: Warren Buffett ist ein hervorragender Anleger – aber den weitaus größten Teil seines Vermögens hat er erst nach seinem 65. Geburtstag aufgebaut, weil er seit seiner Kindheit investiert.", "Wer mit 25 anfängt zu sparen, kann mit deutlich kleineren Beträgen mehr erreichen als jemand, der mit 45 beginnt.", { type: "growth", unit: "€", perMonth: 100, rate: 6, label: "100 € im Monat, 6 % Rendite pro Jahr (Annahme)", hint: "Die Kurve wird erst spät steil – der größte Teil des Zuwachses entsteht in den letzten Jahren." }],
        ["Reich werden, reich bleiben", "Um Vermögen aufzubauen, braucht man nach Housel Mut und Optimismus. Um es zu behalten, braucht man das Gegenteil: Vorsicht und die Bereitschaft, mit Fehlern zu rechnen. Überleben sei wichtiger als die höchste Rendite.", "Ein Sicherheitspuffer bringt keine Rendite – aber er verhindert, dass man im schlechtesten Moment verkaufen muss.", null],
        ["Genug", "Wer nie definiert, wie viel genug ist, verschiebt das Ziel immer weiter. Housel beschreibt Menschen, die Reichtum und Ruf riskierten, um noch mehr von etwas zu bekommen, das sie nicht brauchten.", "Nicht jeder Gehaltssprung muss in einen größeren Lebensstil fließen.", null],
      ],
      limits: "Das Buch besteht aus Geschichten und Beobachtungen, nicht aus Belegen für eine bestimmte Anlagestrategie. Renditen der Vergangenheit sind keine Garantie, und nicht jeder hat die Möglichkeit, früh und regelmäßig zu sparen. Es ersetzt keine persönliche Finanzberatung.",
      reflect: "Wie viel wäre für dich „genug“ – und woran würdest du merken, dass du dort angekommen bist?",
    },
    {
      thesis: "Housel argues that handling money has less to do with knowledge than with behaviour. For him, patience, humility and dealing with fear count for more than intelligence or the perfect strategy.",
      ideas: [
        ["Time beats returns", "Compound interest only becomes really powerful over very long periods. Housel's example: Warren Buffett is an excellent investor – but he built by far the largest part of his fortune after his 65th birthday, because he has been investing since childhood.", "Someone who starts saving at 25 can achieve more with much smaller amounts than someone who starts at 45.", { type: "growth", unit: "€", perMonth: 100, rate: 6, label: "100 a month, 6% return per year (assumption)", hint: "The curve only gets steep late – most of the growth happens in the final years." }],
        ["Getting rich, staying rich", "To build wealth, Housel says, you need courage and optimism. To keep it you need the opposite: caution and the willingness to expect mistakes. Survival matters more than the highest return.", "A safety buffer earns no return – but it prevents you from having to sell at the worst moment.", null],
        ["Enough", "Whoever never defines how much is enough keeps moving the goalposts. Housel describes people who risked wealth and reputation to get even more of something they did not need.", "Not every pay rise has to flow into a bigger lifestyle.", null],
      ],
      limits: "The book consists of stories and observations, not of evidence for a particular investment strategy. Past returns are no guarantee, and not everyone is able to save early and regularly. It does not replace personal financial advice.",
      reflect: "How much would be “enough” for you – and how would you notice that you had got there?",
    }),

  book("cialdini", "psychology", "science", "Influence: The Psychology of Persuasion", "Die Psychologie des Überzeugens", "Robert B. Cialdini", 1984, 13, "Robert_Cialdini", ["kahneman", "carnegie", "duhigg"],
    {
      thesis: "Cialdini beschreibt sechs Prinzipien, mit denen Menschen einander zu einem Ja bewegen. Sie funktionieren, weil wir im Alltag auf Faustregeln angewiesen sind – und genau deshalb lassen sie sich ausnutzen.",
      ideas: [
        ["Gegenseitigkeit", "Wer etwas bekommt, fühlt sich verpflichtet, etwas zurückzugeben. Das gilt nach Cialdini sogar für Geschenke, um die wir nie gebeten haben – und die Gegenleistung fällt oft größer aus als das Geschenk.", "Die Gratisprobe im Supermarkt: Viele kaufen danach, auch aus einem leisen Gefühl der Verpflichtung.", null],
        ["Soziale Bewährtheit", "In unsicheren Situationen orientieren wir uns daran, was andere tun. Was viele für richtig halten, erscheint uns richtig – besonders, wenn diese anderen uns ähnlich sind.", "„Meistverkauft“, Sternebewertungen und eingespielte Lacher im Fernsehen nutzen denselben Effekt.", { type: "scenario", prompt: "Zwei Restaurants nebeneinander, beide dir unbekannt. Das eine ist fast leer, vor dem anderen stehen Leute an. Wohin zieht es dich spontan?", options: [["Zum vollen Restaurant", "Die Schlange wirkt wie ein Beweis für Qualität. Oft stimmt das – manchmal steht dort aber nur, wer den anderen Wartenden gefolgt ist."], ["Zum leeren Restaurant", "Du widerstehst dem Sog. Die meisten folgen der Menge: In unklaren Lagen ist das Verhalten anderer unsere wichtigste Abkürzung."]], insight: "Frag dich: Wissen die anderen wirklich mehr als ich – oder folgen sie auch nur den anderen?" }],
        ["Knappheit", "Was selten ist oder bald nicht mehr zu haben, erscheint uns wertvoller. Dahinter steckt nach Cialdini auch die Abneigung, eine Wahlmöglichkeit zu verlieren.", "„Nur noch 2 Zimmer zu diesem Preis“ erzeugt Druck – unabhängig davon, wie gut das Angebot wirklich ist.", null],
      ],
      limits: "Die übrigen drei Prinzipien sind Konsistenz, Sympathie und Autorität; später ergänzte Cialdini „Einheit“. Wie stark die Effekte sind, hängt sehr von der Situation ab – im Labor und im Alltag fallen sie unterschiedlich aus. Das Buch erklärt Mechanismen, keine sicheren Rezepte.",
      reflect: "Wann hast du zuletzt etwas gekauft oder zugesagt, weil eines dieser Prinzipien gewirkt hat?",
    },
    {
      thesis: "Cialdini describes six principles by which people move one another to say yes. They work because we depend on rules of thumb in everyday life – and that is exactly why they can be exploited.",
      ideas: [
        ["Reciprocity", "Whoever receives something feels obliged to give something back. According to Cialdini this holds even for gifts we never asked for – and what we give in return is often larger than the gift.", "The free sample in the supermarket: many buy afterwards, partly out of a quiet sense of obligation.", null],
        ["Social proof", "In uncertain situations we look to what others are doing. What many consider right seems right to us – especially when those others are similar to us.", "“Bestseller”, star ratings and canned laughter on television use the same effect.", { type: "scenario", prompt: "Two restaurants side by side, both unknown to you. One is almost empty, people are queuing outside the other. Which one are you spontaneously drawn to?", options: [["The full restaurant", "The queue looks like proof of quality. Often it is – but sometimes people are only standing there because they followed the others waiting."], ["The empty restaurant", "You resist the pull. Most people follow the crowd: in unclear situations other people's behaviour is our most important shortcut."]], insight: "Ask yourself: do the others really know more than I do – or are they also just following the others?" }],
        ["Scarcity", "What is rare or soon unavailable seems more valuable to us. According to Cialdini, behind this is also the dislike of losing an option.", "“Only 2 rooms left at this price” creates pressure – regardless of how good the offer really is.", null],
      ],
      limits: "The other three principles are consistency, liking and authority; Cialdini later added “unity”. How strong the effects are depends heavily on the situation – they turn out differently in the laboratory and in everyday life. The book explains mechanisms, not sure-fire recipes.",
      reflect: "When did you last buy or agree to something because one of these principles was at work?",
    }),

  book("rosling", "thinking", "culture", "Factfulness", "Factfulness", "Hans Rosling, Ola Rosling, Anna Rosling Rönnlund", 2018, 13, "Hans_Rosling", ["kahneman", "harari", "meadows"],
    {
      thesis: "Die Roslings zeigen, dass die meisten Menschen – auch sehr gebildete – den Zustand der Welt deutlich zu düster einschätzen. Schuld seien nicht fehlende Informationen, sondern Instinkte, die unseren Blick verzerren.",
      ideas: [
        ["Schlechter als Schimpansen", "Rosling stellte Tausenden Menschen einfache Fragen zur Welt mit drei Antwortmöglichkeiten. Die meisten schnitten schlechter ab als der Zufall – ihr Weltbild war nicht nur lückenhaft, sondern systematisch zu negativ.", "Viele glauben, die extreme Armut habe weltweit zugenommen. Tatsächlich hat sich ihr Anteil in den zwanzig Jahren vor Erscheinen des Buches etwa halbiert.", { type: "scenario", prompt: "Wie viele der einjährigen Kinder auf der Welt sind gegen mindestens eine Krankheit geimpft?", options: [["20 Prozent", "Das dachten viele der Befragten – es ist weit daneben. Richtig sind etwa 80 Prozent."], ["50 Prozent", "Näher dran, aber immer noch zu pessimistisch. Richtig sind etwa 80 Prozent."], ["80 Prozent", "Richtig. Nur eine Minderheit der Befragten wählte diese Antwort – weniger, als beim Raten zu erwarten wäre."]], insight: "Unser Weltbild stammt oft aus der Schulzeit und aus Schlagzeilen – nicht aus aktuellen Zahlen." }],
        ["Der Instinkt der Kluft", "Wir teilen die Welt gern in zwei Lager: reich und arm, „wir“ und „die“. Die Roslings zeigen, dass die große Mehrheit der Menschen dazwischen lebt, und schlagen stattdessen vier Einkommensstufen vor.", "Die meisten Menschen leben weder in bitterer Armut noch im Wohlstand, sondern in Ländern mittleren Einkommens.", null],
        ["Der Instinkt der Negativität", "Schlechte Nachrichten erreichen uns eher als gute: Katastrophen sind Ereignisse, allmähliche Verbesserungen nicht. Rosling empfiehlt, zwei Gedanken gleichzeitig zu halten – etwas kann schlimm sein und trotzdem besser werden.", "Ein Flugzeugabsturz ist eine Meldung. Dass an einem Tag 100.000 Flüge sicher gelandet sind, ist keine.", null],
      ],
      limits: "Kritiker werfen dem Buch vor, die Kennzahlen auszuwählen, die sich verbessert haben, und Probleme wie Klimawandel, Artensterben oder Ungleichheit innerhalb von Ländern zu kurz zu behandeln. Dass sich vieles gebessert hat, sagt zudem nichts darüber, ob es so weitergeht.",
      reflect: "Bei welchem Thema beruht deine Einschätzung eher auf Schlagzeilen als auf Zahlen, die du selbst nachgesehen hast?",
    },
    {
      thesis: "The Roslings show that most people – including very educated ones – judge the state of the world to be far gloomier than it is. The cause, they say, is not a lack of information but instincts that distort our view.",
      ideas: [
        ["Worse than chimpanzees", "Rosling asked thousands of people simple questions about the world with three possible answers. Most did worse than chance – their world view was not just patchy but systematically too negative.", "Many believe extreme poverty has increased worldwide. In fact its share roughly halved in the twenty years before the book was published.", { type: "scenario", prompt: "How many of the world's one-year-old children have been vaccinated against at least one disease?", options: [["20 percent", "Many respondents thought so – it is far off. The right answer is about 80 percent."], ["50 percent", "Closer, but still too pessimistic. The right answer is about 80 percent."], ["80 percent", "Correct. Only a minority of respondents chose this answer – fewer than would be expected from guessing."]], insight: "Our view of the world often comes from our school days and from headlines – not from current figures." }],
        ["The gap instinct", "We like to divide the world into two camps: rich and poor, “us” and “them”. The Roslings show that the great majority of people live in between, and propose four income levels instead.", "Most people live neither in bitter poverty nor in affluence but in middle-income countries.", null],
        ["The negativity instinct", "Bad news reaches us more readily than good: disasters are events, gradual improvements are not. Rosling recommends holding two thoughts at once – something can be bad and still be getting better.", "A plane crash is a news story. That 100,000 flights landed safely in a day is not.", null],
      ],
      limits: "Critics accuse the book of selecting the indicators that have improved and of giving too little space to problems such as climate change, species loss or inequality within countries. That much has improved also says nothing about whether it will continue.",
      reflect: "On which topic does your assessment rest more on headlines than on figures you have looked up yourself?",
    }),

  book("meadows", "thinking", "science", "Thinking in Systems", "Die Grenzen des Denkens", "Donella H. Meadows", 2008, 16, "Systemdenken_(Systemtheorie)", ["rumelt", "rosling", "harari"],
    {
      thesis: "Meadows zeigt, dass sich das Verhalten von Unternehmen, Ökosystemen oder Volkswirtschaften oft besser aus ihrer Struktur erklären lässt als aus den Absichten der Beteiligten. Wer Bestände, Flüsse und Rückkopplungen sieht, versteht, warum gut gemeinte Eingriffe scheitern.",
      ideas: [
        ["Bestände und Flüsse", "Ein Bestand ist das, was sich ansammelt: Wasser in einer Wanne, Geld auf einem Konto, CO₂ in der Atmosphäre. Er ändert sich nur durch Zu- und Abflüsse – und deshalb träge. Viele Probleme entstehen, weil wir auf die Flüsse schauen und den Bestand vergessen.", "Auch wenn die Emissionen sinken, steigt die CO₂-Menge in der Luft weiter – solange der Zufluss größer ist als der Abfluss.", null],
        ["Rückkopplungen", "Systeme steuern sich über Schleifen. Eine ausgleichende Rückkopplung wirkt einer Veränderung entgegen, wie ein Thermostat. Eine verstärkende treibt sie weiter an – in beide Richtungen, als Aufwärts- oder Abwärtsspirale.", "Zinsen auf ein Guthaben bringen mehr Guthaben, das wieder mehr Zinsen bringt: eine verstärkende Schleife.", { type: "loop", nodes: ["Mehr Guthaben", "Mehr Zinsen", "Noch mehr Guthaben"], note: "Verstärkende Schleife: Sie wächst, bis eine ausgleichende Schleife sie bremst." }],
        ["Hebelpunkte", "Nicht jeder Eingriff wirkt gleich stark. Meadows ordnet „Hebelpunkte“ nach ihrer Wirkung: Zahlen wie Steuersätze zu verändern bewirkt meist wenig; Regeln, Informationsflüsse und vor allem die Ziele eines Systems zu verändern bewirkt viel.", "Ein Stromzähler, der gut sichtbar im Flur hängt statt im Keller, senkt nachweislich den Verbrauch – allein durch die Information.", null],
      ],
      limits: "Das Buch erschien 2008 nach Meadows’ Tod aus einem älteren Manuskript; ihre Beispiele sind bewusst einfach. Systemmodelle hängen stark von ihren Annahmen ab – sie helfen beim Denken, sagen aber die Zukunft nicht zuverlässig voraus.",
      reflect: "Wo in deinem Alltag gibt es eine Schleife, die sich selbst verstärkt – im Guten oder im Schlechten?",
    },
    {
      thesis: "Meadows shows that the behaviour of companies, ecosystems or economies can often be explained better by their structure than by the intentions of those involved. Seeing stocks, flows and feedback helps to understand why well-meant interventions fail.",
      ideas: [
        ["Stocks and flows", "A stock is whatever accumulates: water in a bathtub, money in an account, CO₂ in the atmosphere. It changes only through inflows and outflows – and therefore slowly. Many problems arise because we look at the flows and forget the stock.", "Even when emissions fall, the amount of CO₂ in the air keeps rising – as long as the inflow is larger than the outflow.", null],
        ["Feedback loops", "Systems regulate themselves through loops. A balancing loop counteracts a change, like a thermostat. A reinforcing loop drives it on – in either direction, as an upward or a downward spiral.", "Interest on a balance produces a bigger balance, which again produces more interest: a reinforcing loop.", { type: "loop", nodes: ["Bigger balance", "More interest", "Even bigger balance"], note: "Reinforcing loop: it grows until a balancing loop slows it down." }],
        ["Leverage points", "Not every intervention has the same effect. Meadows ranks “leverage points” by their power: changing numbers such as tax rates usually achieves little; changing rules, information flows and above all the goals of a system achieves a lot.", "An electricity meter hanging clearly visible in the hall instead of the cellar demonstrably lowers consumption – through information alone.", null],
      ],
      limits: "The book was published in 2008 after Meadows' death from an older manuscript; her examples are deliberately simple. System models depend heavily on their assumptions – they help with thinking but do not reliably predict the future.",
      reflect: "Where in your everyday life is there a loop that reinforces itself – for better or worse?",
    }),

  book("newport", "habits", "technology", "Deep Work", "Konzentriert arbeiten", "Cal Newport", 2016, 13, "Cal_Newport", ["clear", "brown"],
    {
      thesis: "Newport behauptet, dass die Fähigkeit, lange und ungestört an schwierigen Dingen zu arbeiten, immer seltener und zugleich immer wertvoller wird. Wer sie trainiert, lernt schneller und leistet in weniger Zeit mehr.",
      ideas: [
        ["Tiefe und oberflächliche Arbeit", "„Deep Work“ nennt Newport konzentrierte Arbeit ohne Ablenkung, die das Denken an seine Grenze bringt. „Shallow Work“ sind Aufgaben, die man auch halb abgelenkt erledigen kann – E-Mails, Abstimmungen, Formulare. Sie fühlen sich produktiv an, schaffen aber wenig Neues.", "Eine Stunde am Stück an einem schwierigen Text bringt oft mehr als ein ganzer Tag, der von Nachrichten zerhackt wird.", { type: "compare", left: ["Oberflächliche Arbeit", "nebenbei machbar", "leicht zu ersetzen", "E-Mails, Chats, Meetings", "fühlt sich fleißig an"], right: ["Tiefe Arbeit", "braucht volle Konzentration", "schwer zu kopieren", "Lernen, Schreiben, Lösen", "schafft bleibenden Wert"] }],
        ["Aufmerksamkeitsreste", "Wer von einer Aufgabe zur nächsten springt, nimmt einen Teil der Aufmerksamkeit mit. Newport stützt sich dabei auf die Forscherin Sophie Leroy: Nach jedem Wechsel arbeitet man eine Weile schlechter – auch nach einem „kurzen Blick“ aufs Handy.", "Deshalb empfiehlt er feste Blöcke für tiefe Arbeit und feste Zeiten für E-Mails, statt beides zu mischen.", null],
        ["Langeweile aushalten", "Konzentration ist für Newport ein Muskel. Wer jede freie Minute mit dem Handy füllt, trainiert das Gehirn darauf, bei der kleinsten Langeweile Ablenkung zu verlangen – und kann sie dann auch bei der Arbeit nicht mehr abstellen.", "In der Schlange im Supermarkt einfach mal warten, ohne das Telefon herauszuholen.", null],
      ],
      limits: "Newport ist Informatikprofessor und schreibt aus einer Lage, in der man seine Zeit selbst einteilen kann. Wer Kunden bedient, pflegt oder im Team auf Zuruf arbeitet, kann seine Tage nicht einfach blocken. Vieles stützt sich auf Beispiele erfolgreicher Einzelner.",
      reflect: "Wann in deiner Woche könntest du 60 Minuten wirklich ungestört an deiner wichtigsten Sache arbeiten?",
    },
    {
      thesis: "Newport claims that the ability to work for long, undisturbed stretches on difficult things is becoming ever rarer and at the same time ever more valuable. Those who train it learn faster and achieve more in less time.",
      ideas: [
        ["Deep and shallow work", "Newport calls concentrated, distraction-free work that pushes thinking to its limit “deep work”. “Shallow work” is tasks that can be done half-distracted – emails, coordination, forms. They feel productive but create little that is new.", "One uninterrupted hour on a difficult text often achieves more than a whole day chopped up by messages.", { type: "compare", left: ["Shallow work", "can be done on the side", "easy to replace", "emails, chats, meetings", "feels busy"], right: ["Deep work", "needs full concentration", "hard to copy", "learning, writing, solving", "creates lasting value"] }],
        ["Attention residue", "Whoever jumps from one task to the next carries part of their attention along. Newport relies here on the researcher Sophie Leroy: after every switch you work worse for a while – even after a “quick look” at your phone.", "That is why he recommends fixed blocks for deep work and fixed times for email instead of mixing the two.", null],
        ["Putting up with boredom", "For Newport, concentration is a muscle. Whoever fills every free minute with their phone trains the brain to demand distraction at the slightest boredom – and can then no longer switch that off at work either.", "Just wait in the supermarket queue for once without taking out your phone.", null],
      ],
      limits: "Newport is a computer science professor and writes from a position in which you can organise your own time. Those who serve customers, provide care or work in a team on call cannot simply block out their days. Much rests on examples of successful individuals.",
      reflect: "When in your week could you work on your most important thing for 60 minutes truly undisturbed?",
    }),

  book("dweck", "psychology", "science", "Mindset: The New Psychology of Success", "Selbstbild", "Carol S. Dweck", 2006, 13, "Carol_Dweck", ["clear", "brown", "newport"],
    {
      thesis: "Dweck unterscheidet zwei Überzeugungen über die eigenen Fähigkeiten: dass sie feststehen oder dass sie sich entwickeln lassen. Welche davon jemand hat, beeinflusst nach ihrer Forschung, wie er mit Herausforderungen und Rückschlägen umgeht.",
      ideas: [
        ["Zwei Selbstbilder", "Im statischen Selbstbild gelten Begabung und Intelligenz als gegeben – jede Aufgabe wird zum Test, ob man „es hat“. Im dynamischen Selbstbild gelten sie als trainierbar – eine schwere Aufgabe ist dann eine Gelegenheit, besser zu werden.", "Dieselbe schlechte Note: „Ich bin eben schlecht in Mathe“ – oder „Ich habe das noch nicht verstanden“.", { type: "compare", left: ["Statisches Selbstbild", "Fähigkeiten stehen fest", "meidet Herausforderungen", "Fehler = Beweis des Scheiterns", "Anstrengung wirkt peinlich"], right: ["Dynamisches Selbstbild", "Fähigkeiten wachsen", "sucht Herausforderungen", "Fehler = Information", "Anstrengung ist der Weg"] }],
        ["Lob für den Weg, nicht für das Talent", "In Dwecks Versuchen wählten Kinder, die für ihre Klugheit gelobt wurden, danach lieber leichte Aufgaben. Kinder, die für ihre Anstrengung gelobt wurden, trauten sich an schwierigere heran und hielten länger durch.", "Statt „Du bist so schlau“: „Du hast verschiedene Wege ausprobiert, bis es geklappt hat.“", null],
        ["Die Macht des „noch nicht“", "Ein einziges Wort verändert nach Dweck die Bedeutung eines Misserfolgs: „Ich kann das nicht“ beschreibt einen Zustand, „Ich kann das noch nicht“ einen Weg. Niemand hat dabei nur ein Selbstbild – es wechselt je nach Gebiet und Situation.", "Wer sich für unmusikalisch hält, kann beim Sport durchaus ein dynamisches Selbstbild haben.", null],
      ],
      limits: "Große Studien und Metaanalysen fanden für Mindset-Programme an Schulen meist nur kleine Effekte, die vor allem schwächeren Schülern nützen. Dweck selbst warnt vor einem „falschen“ dynamischen Selbstbild: bloß Anstrengung zu loben, ohne dass jemand tatsächlich dazulernt.",
      reflect: "In welchem Bereich sagst du über dich „Das liegt mir einfach nicht“ – und stimmt das wirklich?",
    },
    {
      thesis: "Dweck distinguishes two beliefs about one's own abilities: that they are fixed or that they can be developed. According to her research, which of these someone holds influences how they deal with challenges and setbacks.",
      ideas: [
        ["Two mindsets", "In the fixed mindset, talent and intelligence are seen as given – every task becomes a test of whether you “have it”. In the growth mindset they are seen as trainable – a hard task is then an opportunity to get better.", "The same bad mark: “I'm just bad at maths” – or “I haven't understood this yet”.", { type: "compare", left: ["Fixed mindset", "abilities are fixed", "avoids challenges", "mistakes = proof of failure", "effort seems embarrassing"], right: ["Growth mindset", "abilities grow", "seeks challenges", "mistakes = information", "effort is the way"] }],
        ["Praise the process, not the talent", "In Dweck's experiments, children praised for being clever afterwards preferred easy tasks. Children praised for their effort dared to take on harder ones and persisted longer.", "Instead of “You're so smart”: “You tried different approaches until it worked.”", null],
        ["The power of “not yet”", "According to Dweck, a single word changes the meaning of a failure: “I can't do this” describes a state, “I can't do this yet” a path. Nobody has only one mindset – it varies by field and situation.", "Someone who thinks they are unmusical may well have a growth mindset in sport.", null],
      ],
      limits: "Large studies and meta-analyses have mostly found only small effects for mindset programmes in schools, mainly benefiting weaker students. Dweck herself warns of a “false” growth mindset: merely praising effort without anyone actually learning more.",
      reflect: "In which area do you say of yourself “That's just not my thing” – and is that really true?",
    }),

  book("brown", "learning", "science", "Make It Stick: The Science of Successful Learning", "Das merk ich mir!", "Peter C. Brown, Henry L. Roediger III, Mark A. McDaniel", 2014, 13, "Lernen", ["dweck", "newport", "clear"],
    {
      thesis: "Die Autoren – zwei Gedächtnisforscher und ein Schriftsteller – zeigen, dass die beliebtesten Lernmethoden die schwächsten sind. Was sich leicht anfühlt, bleibt selten hängen; wirksames Lernen ist anstrengend.",
      ideas: [
        ["Abrufen statt wiederlesen", "Einen Text mehrmals zu lesen und anzustreichen erzeugt ein Gefühl von Vertrautheit, das wir mit Wissen verwechseln. Deutlich wirksamer ist es, das Buch zuzuklappen und sich selbst abzufragen: Jedes Abrufen festigt die Erinnerung.", "Nach einem Kapitel drei Fragen aufschreiben und am nächsten Tag ohne Nachsehen beantworten.", { type: "compare", left: ["Fühlt sich gut an", "mehrfach durchlesen", "bunt markieren", "alles an einem Abend", "ein Thema am Stück"], right: ["Wirkt besser", "sich selbst abfragen", "in eigenen Worten erklären", "über Tage verteilen", "Themen abwechseln"] }],
        ["Verteilt lernen", "Wer Wiederholungen über Tage und Wochen verteilt, behält mehr als jemand, der dieselbe Zeit am Stück lernt. Das teilweise Vergessen dazwischen ist kein Fehler, sondern der Grund: Das Gehirn muss die Erinnerung neu aufbauen und stärkt sie dabei.", "Vokabeln lieber an fünf Tagen je zehn Minuten als einmal fünfzig Minuten.", null],
        ["Erwünschte Schwierigkeiten", "Lernen, das sich mühsam anfühlt, wirkt oft am besten. Die Autoren greifen dafür den Begriff „erwünschte Schwierigkeiten“ des Psychologen Robert Bjork auf: Aufgaben mischen, selbst nach einer Lösung suchen, bevor man sie gezeigt bekommt.", "Erst selbst versuchen, eine Aufgabe zu lösen – auch wenn es misslingt –, und dann die Erklärung lesen.", null],
      ],
      limits: "Die Befunde zu Abrufen und verteiltem Lernen gehören zu den am besten gesicherten der Lernforschung. Wie groß der Vorteil ist, hängt aber vom Stoff und vom Vorwissen ab – und nicht jede Schwierigkeit ist „erwünscht“: Ist eine Aufgabe zu schwer, lernt man wenig.",
      reflect: "Was hast du diese Woche gelernt – und könntest du es jetzt, ohne nachzusehen, jemandem erklären?",
    },
    {
      thesis: "The authors – two memory researchers and a writer – show that the most popular learning methods are the weakest. What feels easy rarely sticks; effective learning is effortful.",
      ideas: [
        ["Retrieve instead of rereading", "Reading a text several times and highlighting it creates a feeling of familiarity that we mistake for knowledge. It is far more effective to close the book and quiz yourself: every act of retrieval strengthens the memory.", "After a chapter, write down three questions and answer them the next day without looking.", { type: "compare", left: ["Feels good", "rereading several times", "colourful highlighting", "everything in one evening", "one topic at a stretch"], right: ["Works better", "quizzing yourself", "explaining in your own words", "spreading over days", "mixing topics"] }],
        ["Spaced practice", "Whoever spreads repetitions over days and weeks retains more than someone who studies for the same time in one go. The partial forgetting in between is not a flaw but the reason: the brain has to rebuild the memory and strengthens it in the process.", "Vocabulary: rather ten minutes on each of five days than fifty minutes once.", null],
        ["Desirable difficulties", "Learning that feels laborious often works best. The authors take up the psychologist Robert Bjork's term “desirable difficulties”: mixing tasks, searching for a solution yourself before being shown it.", "First try to solve a problem yourself – even if you fail – and then read the explanation.", null],
      ],
      limits: "The findings on retrieval and spaced practice are among the best established in learning research. How large the advantage is depends, however, on the material and prior knowledge – and not every difficulty is “desirable”: if a task is too hard, little is learned.",
      reflect: "What did you learn this week – and could you explain it to someone now, without looking it up?",
    }),

  book("dawkins", "science", "science", "The Selfish Gene", "Das egoistische Gen", "Richard Dawkins", 1976, 16, "Das_egoistische_Gen", ["harari", "hawking", "diamond"],
    {
      thesis: "Dawkins schlägt vor, die Evolution aus der Sicht der Gene zu betrachten: Nicht Arten oder Individuen sind die Einheit, die über Generationen fortbesteht, sondern Gene. Lebewesen sind in seinem Bild die „Überlebensmaschinen“, die Gene sich gebaut haben.",
      ideas: [
        ["Der Blick des Gens", "Ein Gen, das seinem Träger hilft, sich fortzupflanzen, wird in der nächsten Generation häufiger. „Egoistisch“ meint bei Dawkins nichts anderes: Gene haben keine Absichten, aber es setzen sich die durch, die ihre eigene Verbreitung begünstigen.", "Ein Gen für schärfere Augen bei einem Greifvogel verbreitet sich, weil seine Träger mehr Beute machen und mehr Junge aufziehen.", null],
        ["Warum es trotzdem Selbstlosigkeit gibt", "Aus egoistischen Genen folgen nicht egoistische Lebewesen. Hilft ein Tier seinen Verwandten, fördert es Kopien der eigenen Gene, die auch in ihnen stecken. Dawkins erklärt so Fürsorge, Warnrufe und die Arbeiterinnen im Bienenstock.", "Eine Arbeiterbiene hat keinen eigenen Nachwuchs – aber sie hilft, ihre Schwestern aufzuziehen, mit denen sie besonders eng verwandt ist.", null],
        ["Das Mem", "Im letzten Kapitel überträgt Dawkins die Idee auf die Kultur. Auch Melodien, Redewendungen oder Moden werden kopiert, verändert und ausgelesen. Für solche Einheiten erfand er das Wort „Mem“ – Jahrzehnte, bevor es im Internet eine neue Bedeutung bekam.", "Ein Ohrwurm verbreitet sich von Kopf zu Kopf, unabhängig davon, ob er dem Menschen nützt.", null],
      ],
      limits: "Der Titel wird oft missverstanden: Dawkins beschreibt, wie Auslese wirkt, und empfiehlt keinen Egoismus. Unter Biologen ist umstritten, ob das Gen die einzige sinnvolle Ebene der Auslese ist; Gene wirken zudem selten einzeln, sondern im Zusammenspiel mit vielen anderen und mit der Umwelt.",
      reflect: "Welches Verhalten, das du für rein menschlich und kulturell hältst, könnte auch eine biologische Vorgeschichte haben?",
    },
    {
      thesis: "Dawkins proposes looking at evolution from the point of view of the genes: it is not species or individuals that persist over generations but genes. In his image, living things are the “survival machines” that genes have built for themselves.",
      ideas: [
        ["The gene's-eye view", "A gene that helps its carrier to reproduce becomes more common in the next generation. That is all “selfish” means for Dawkins: genes have no intentions, but those that favour their own spread prevail.", "A gene for sharper eyes in a bird of prey spreads because its carriers catch more prey and raise more young.", null],
        ["Why there is altruism anyway", "Selfish genes do not imply selfish organisms. When an animal helps its relatives, it promotes copies of its own genes that are also in them. Dawkins uses this to explain care, alarm calls and the workers in a beehive.", "A worker bee has no offspring of her own – but she helps to raise her sisters, to whom she is particularly closely related.", null],
        ["The meme", "In the last chapter Dawkins applies the idea to culture. Tunes, catchphrases and fashions are also copied, altered and selected. For such units he invented the word “meme” – decades before it took on a new meaning on the internet.", "A catchy tune spreads from head to head regardless of whether it benefits the person.", null],
      ],
      limits: "The title is often misunderstood: Dawkins describes how selection works and does not recommend selfishness. Biologists dispute whether the gene is the only meaningful level of selection; genes also rarely act alone but in interplay with many others and with the environment.",
      reflect: "Which behaviour that you consider purely human and cultural might also have a biological prehistory?",
    }),

  book("hawking", "science", "science", "A Brief History of Time", "Eine kurze Geschichte der Zeit", "Stephen Hawking", 1988, 13, "Eine_kurze_Geschichte_der_Zeit", ["dawkins", "harari"],
    {
      thesis: "Hawking erklärt Laien, was die Physik über Ursprung, Aufbau und Schicksal des Universums weiß – vom Urknall bis zu Schwarzen Löchern – und warum Relativitätstheorie und Quantenphysik noch nicht zusammenpassen.",
      ideas: [
        ["Das Universum hat einen Anfang", "Die Galaxien entfernen sich voneinander: Der Raum selbst dehnt sich aus. Rechnet man zurück, war alles vor rund 13,8 Milliarden Jahren extrem dicht und heiß beisammen. Mit dem Urknall begannen nach heutigem Verständnis auch Raum und Zeit.", "Wie Punkte auf einem Luftballon, der aufgeblasen wird: Jeder Punkt entfernt sich von jedem anderen, ohne dass es eine Mitte gibt.", null],
        ["Schwarze Löcher sind nicht ganz schwarz", "Ein Schwarzes Loch hat eine so starke Schwerkraft, dass aus seinem Inneren nichts entkommt. Hawking zeigte 1974 rechnerisch, dass es durch Quanteneffekte an seinem Rand trotzdem eine schwache Strahlung abgibt – und so über unvorstellbar lange Zeit verdampfen kann.", "Diese „Hawking-Strahlung“ ist bei echten Schwarzen Löchern so schwach, dass sie bisher nicht direkt gemessen wurde.", null],
        ["Die Suche nach einer einzigen Theorie", "Die Allgemeine Relativitätstheorie beschreibt das Große – Schwerkraft, Sterne, Galaxien. Die Quantenphysik beschreibt das Kleine. Beide sind hervorragend bestätigt, widersprechen sich aber dort, wo beides zugleich zählt: im Urknall und im Inneren Schwarzer Löcher.", "Eine Theorie, die beide vereint, wird bis heute gesucht.", null],
      ],
      limits: "Das Buch ist von 1988: Dass sich die Ausdehnung des Universums beschleunigt, wurde erst 1998 entdeckt, und viele Zahlen sind seither genauer bestimmt. Hawkings eigene Vorschläge zum Anfang des Universums sind Hypothesen, keine gesicherten Ergebnisse.",
      reflect: "Was bedeutet es für dich, dass es „vor dem Urknall“ nach dieser Sicht vielleicht gar kein Davor gab?",
    },
    {
      thesis: "Hawking explains to lay readers what physics knows about the origin, structure and fate of the universe – from the Big Bang to black holes – and why relativity and quantum physics do not yet fit together.",
      ideas: [
        ["The universe has a beginning", "The galaxies are moving apart: space itself is expanding. Run the clock backwards and everything was extremely dense and hot about 13.8 billion years ago. On current understanding, space and time also began with the Big Bang.", "Like dots on a balloon being blown up: every dot moves away from every other without there being a centre.", null],
        ["Black holes are not entirely black", "A black hole has gravity so strong that nothing escapes from inside it. In 1974 Hawking showed by calculation that, through quantum effects at its edge, it nevertheless emits faint radiation – and can thus evaporate over unimaginably long periods.", "This “Hawking radiation” is so weak for real black holes that it has not yet been measured directly.", null],
        ["The search for a single theory", "General relativity describes the large – gravity, stars, galaxies. Quantum physics describes the small. Both are superbly confirmed but contradict each other where both matter at once: in the Big Bang and inside black holes.", "A theory uniting the two is still being sought today.", null],
      ],
      limits: "The book dates from 1988: that the expansion of the universe is accelerating was only discovered in 1998, and many figures have been determined more precisely since. Hawking's own proposals about the beginning of the universe are hypotheses, not established results.",
      reflect: "What does it mean to you that, on this view, there may have been no “before” before the Big Bang?",
    }),

  book("diamond", "history", "history", "Guns, Germs, and Steel", "Arm und Reich", "Jared Diamond", 1997, 16, "Jared_Diamond", ["harari", "dawkins"],
    {
      thesis: "Diamond fragt, warum Eurasier Amerika, Australien und Afrika eroberten und nicht umgekehrt. Seine Antwort: nicht wegen biologischer Unterschiede zwischen Menschen, sondern wegen der Geografie – der Pflanzen, Tiere und Kontinente, mit denen sie zufällig lebten.",
      ideas: [
        ["Der Vorsprung der Landwirtschaft", "Von den vielen Wildpflanzen und großen Säugetieren der Erde ließen sich nur wenige zähmen – und sie waren sehr ungleich verteilt. Im Fruchtbaren Halbmond gab es Weizen, Gerste, Schafe, Ziegen und Rinder. Wo früh Ackerbau entstand, wuchsen Bevölkerung, Arbeitsteilung, Schrift und Staaten.", "In Australien gab es kein einziges heimisches Großtier, das sich als Nutztier eignete.", null],
        ["Die Achsen der Kontinente", "Eurasien erstreckt sich vor allem von Ost nach West. Auf gleicher geografischer Breite ähneln sich Klima und Tageslängen – Nutzpflanzen und Tiere konnten sich über Tausende Kilometer verbreiten. Amerika und Afrika verlaufen von Nord nach Süd; dort bremsten Klimazonen die Ausbreitung.", "Weizen gelangte vom Nahen Osten bis nach Spanien und China. Der Mais brauchte Jahrtausende von Mexiko bis in den Osten Nordamerikas.", null],
        ["Keime als Waffe", "Wer seit Jahrtausenden eng mit Nutztieren lebte, war auch deren Krankheiten ausgesetzt – und entwickelte eine gewisse Abwehr. Als Europäer nach Amerika kamen, töteten Pocken, Masern und Grippe einen sehr großen Teil der Bevölkerung, oft bevor es zu Kämpfen kam.", "Die eingeschleppten Seuchen forderten weit mehr Opfer als die Waffen der Eroberer.", null],
      ],
      limits: "Historiker und Anthropologen werfen Diamond vor, die Umwelt zu stark zu betonen und Entscheidungen, Politik und Zufälle zu wenig – etwa die Frage, warum Europa und nicht China die Welt eroberte, obwohl beide in Eurasien liegen. Auch das Ausmaß einzelner Bevölkerungsverluste ist umstritten.",
      reflect: "Welche Unterschiede zwischen Ländern erklärst du dir mit „Mentalität“ – und könnten sie eher mit Ausgangsbedingungen zu tun haben?",
    },
    {
      thesis: "Diamond asks why Eurasians conquered the Americas, Australia and Africa and not the other way round. His answer: not because of biological differences between people but because of geography – the plants, animals and continents they happened to live with.",
      ideas: [
        ["The head start of farming", "Of the many wild plants and large mammals on Earth only a few could be domesticated – and they were very unevenly distributed. The Fertile Crescent had wheat, barley, sheep, goats and cattle. Where farming arose early, population, division of labour, writing and states grew.", "Australia had not a single native large animal suitable as livestock.", null],
        ["The axes of the continents", "Eurasia stretches mainly from east to west. At the same latitude, climate and day length are similar – crops and animals could spread over thousands of kilometres. The Americas and Africa run from north to south; there, climate zones slowed the spread.", "Wheat travelled from the Middle East to Spain and China. Maize needed millennia to get from Mexico to eastern North America.", null],
        ["Germs as a weapon", "Those who had lived closely with livestock for millennia were also exposed to their diseases – and developed some resistance. When Europeans came to the Americas, smallpox, measles and influenza killed a very large part of the population, often before any fighting took place.", "The introduced epidemics claimed far more victims than the conquerors' weapons.", null],
      ],
      limits: "Historians and anthropologists accuse Diamond of emphasising the environment too much and decisions, politics and chance too little – for instance the question of why Europe and not China conquered the world, although both are in Eurasia. The scale of individual population losses is also disputed.",
      reflect: "Which differences between countries do you explain by “mentality” – and might they have more to do with starting conditions?",
    }),

  book("aurel", "philosophy", "culture", "Meditations", "Selbstbetrachtungen", "Mark Aurel", 175, 16, "Selbstbetrachtungen", ["carnegie", "housel"],
    {
      thesis: "Die „Selbstbetrachtungen“ sind die privaten Notizen des römischen Kaisers Mark Aurel, geschrieben auf Griechisch um 170–180 n. Chr. und nie zur Veröffentlichung gedacht. Er ermahnt sich darin selbst, nach den Grundsätzen der Stoa zu leben: gelassen, pflichtbewusst und im Bewusstsein der eigenen Vergänglichkeit.",
      ideas: [
        ["Was in meiner Macht steht", "Ein Grundgedanke der Stoa, den Mark Aurel immer wieder aufgreift: Über äußere Ereignisse haben wir keine Gewalt, wohl aber über unser Urteil darüber. Nicht die Dinge selbst beunruhigen uns, sondern unsere Meinung über sie.", "Der Zug fällt aus. Daran lässt sich nichts ändern – wohl aber daran, ob man eine Stunde lang innerlich tobt.", { type: "compare", left: ["Nicht in meiner Macht", "das Wetter, der Stau", "was andere denken", "die Vergangenheit", "der Ausgang"], right: ["In meiner Macht", "mein Urteil darüber", "wie ich handle", "worauf ich achte", "mein Einsatz"] }],
        ["Die Vergänglichkeit bedenken", "Mark Aurel erinnert sich oft daran, dass Ruhm, Besitz und das eigene Leben kurz sind. Das soll nicht entmutigen, sondern ordnen: Wer weiß, dass seine Zeit begrenzt ist, verschwendet sie weniger mit Ärger und Nebensachen.", "Seine Frage an sich selbst: Wenn dies meine letzte Handlung wäre – würde ich sie so tun?", null],
        ["Teil eines Ganzen", "Menschen sind für Mark Aurel füreinander gemacht, wie die Glieder eines Körpers. Wer anderen schadet, schadet dem Ganzen und damit sich selbst. Ärger über schwierige Menschen sei deshalb sinnlos: Man soll sie belehren oder ertragen.", "Am Morgen nimmt er sich vor: Heute werde ich undankbaren und rücksichtslosen Menschen begegnen – und sie sind trotzdem meinesgleichen.", null],
      ],
      limits: "Es sind persönliche Notizen ohne Ordnung, voller Wiederholungen, und je nach Übersetzung klingen sie sehr verschieden. Kritiker sehen in der stoischen Gelassenheit die Gefahr, Ungerechtigkeit hinzunehmen, statt sie zu ändern – und Mark Aurel schrieb als mächtigster Mann seiner Welt, der zugleich Kriege führte.",
      reflect: "Worüber hast du dich heute geärgert – und welcher Teil davon lag tatsächlich in deiner Hand?",
    },
    {
      thesis: "The “Meditations” are the private notes of the Roman emperor Marcus Aurelius, written in Greek around AD 170–180 and never meant for publication. In them he urges himself to live by the principles of Stoicism: calm, dutiful and aware of his own mortality.",
      ideas: [
        ["What is in my power", "A basic Stoic idea that Marcus Aurelius returns to again and again: we have no power over external events, but we do over our judgement of them. It is not things themselves that trouble us but our opinion of them.", "The train is cancelled. Nothing can be done about that – but something can be done about whether you rage inwardly for an hour.", { type: "compare", left: ["Not in my power", "the weather, the traffic jam", "what others think", "the past", "the outcome"], right: ["In my power", "my judgement of it", "how I act", "what I pay attention to", "my effort"] }],
        ["Remembering impermanence", "Marcus Aurelius often reminds himself that fame, possessions and his own life are short. This is meant not to discourage but to put things in order: whoever knows their time is limited wastes less of it on anger and trivia.", "His question to himself: if this were my last act – would I do it this way?", null],
        ["Part of a whole", "For Marcus Aurelius, human beings are made for one another, like the limbs of one body. Whoever harms others harms the whole and thereby themselves. Anger at difficult people is therefore pointless: one should teach them or bear with them.", "In the morning he tells himself: today I shall meet ungrateful and inconsiderate people – and they are still my own kind.", null],
      ],
      limits: "They are personal notes without order, full of repetition, and they sound very different depending on the translation. Critics see in Stoic calm the danger of accepting injustice instead of changing it – and Marcus Aurelius wrote as the most powerful man of his world, who was also waging wars.",
      reflect: "What annoyed you today – and which part of it was actually in your hands?",
    }),

  book("carnegie", "communication", "culture", "How to Win Friends and Influence People", "Wie man Freunde gewinnt", "Dale Carnegie", 1936, 13, "Dale_Carnegie", ["cialdini", "aurel"],
    {
      thesis: "Carnegies Grundgedanke: Menschen lassen sich nicht durch Kritik und Argumente gewinnen, sondern dadurch, dass man sich ehrlich für sie interessiert und ihnen das Gefühl gibt, wichtig zu sein.",
      ideas: [
        ["Kritik bewirkt selten, was sie soll", "Wer kritisiert wird, verteidigt sich – und ändert sich deshalb gerade nicht. Carnegie rät, zuerst verstehen zu wollen, warum jemand so handelt, und eigene Fehler zu erwähnen, bevor man die des anderen anspricht.", "Statt „Das hast du falsch gemacht“: „Mir ist das früher auch passiert. Wie könnten wir es beim nächsten Mal anders angehen?“", null],
        ["Echtes Interesse", "Man gewinnt nach Carnegie in zwei Monaten mehr Freunde, wenn man sich für andere interessiert, als in zwei Jahren, wenn man versucht, andere für sich zu interessieren. Dazu gehört: zuhören, Fragen stellen, den Namen behalten.", "Im Gespräch eine Frage mehr stellen, bevor man von sich selbst erzählt.", { type: "scenario", prompt: "Ein Kollege erzählt begeistert von seinem Wochenende in den Bergen. Du warst letztes Jahr selbst dort. Was sagst du?", options: [["„Da war ich auch schon! Wir sind damals …“", "Verständlich – aber das Gespräch handelt jetzt von dir. Carnegie würde sagen: Du hast eine Gelegenheit verschenkt, dem anderen zuzuhören."], ["„Was hat dir am besten gefallen?“", "Das empfiehlt Carnegie: den anderen ermutigen, von sich zu erzählen. Deine eigene Geschichte kann später immer noch kommen."]], insight: "Menschen erinnern sich weniger daran, was du gesagt hast, als daran, wie sie sich im Gespräch mit dir gefühlt haben." }],
        ["Die Sicht des anderen", "Wer jemanden überzeugen will, sollte nach Carnegie nicht über die eigenen Wünsche sprechen, sondern über die des anderen – und Streit möglichst vermeiden, weil man ihn selbst dann verliert, wenn man recht behält.", "Nicht „Ich brauche den Bericht bis Freitag“, sondern erklären, was der andere davon hat, wenn er rechtzeitig fertig ist.", null],
      ],
      limits: "Das Buch von 1936 stützt sich auf Anekdoten, nicht auf Forschung. Kritiker werfen ihm vor, Freundlichkeit als Technik zu lehren, die sich auch zur Manipulation eignet. Carnegie selbst betont, dass die Ratschläge nur wirken, wenn das Interesse ehrlich ist.",
      reflect: "Bei wem hast du zuletzt wirklich nachgefragt – statt auf die Gelegenheit zu warten, selbst zu erzählen?",
    },
    {
      thesis: "Carnegie's basic idea: people are not won over by criticism and arguments but by taking a sincere interest in them and making them feel important.",
      ideas: [
        ["Criticism rarely does what it should", "Whoever is criticised defends themselves – and for that very reason does not change. Carnegie advises first trying to understand why someone acts as they do, and mentioning your own mistakes before addressing the other person's.", "Instead of “You did that wrong”: “That used to happen to me too. How could we approach it differently next time?”", null],
        ["Genuine interest", "According to Carnegie, you make more friends in two months by being interested in other people than in two years by trying to get other people interested in you. That includes listening, asking questions, remembering names.", "In a conversation, ask one more question before talking about yourself.", { type: "scenario", prompt: "A colleague enthusiastically tells you about his weekend in the mountains. You were there yourself last year. What do you say?", options: [["“I've been there too! Back then we …”", "Understandable – but now the conversation is about you. Carnegie would say you have given away a chance to listen to the other person."], ["“What did you like best?”", "This is what Carnegie recommends: encourage the other person to talk about themselves. Your own story can still come later."]], insight: "People remember less what you said than how they felt in the conversation with you." }],
        ["The other person's point of view", "Whoever wants to persuade someone should, Carnegie says, talk not about their own wishes but about the other person's – and avoid arguments wherever possible, because you lose them even when you are right.", "Not “I need the report by Friday” but explain what the other person gains by finishing on time.", null],
      ],
      limits: "The 1936 book relies on anecdotes, not research. Critics accuse it of teaching friendliness as a technique that also lends itself to manipulation. Carnegie himself stresses that the advice only works if the interest is sincere.",
      reflect: "Whom did you last really ask follow-up questions – instead of waiting for the chance to talk yourself?",
    }),
];
