// Content batch (25.10.2026): 9 more sport questions (sport had the fewest cards). Every statement is taken from the
// linked article, word-for-word evidence below. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-sport-2.mjs
//
// Evidence (de.wikipedia.org):
//   Basketball: "Der kanadische Arzt und Pädagoge James Naismith entwickelte das Ballspiel im Jahr 1891 in Springfield
//     (Massachusetts) als Hallensport für seine Studenten."
//   Puck (Sport): "Ein Puck ist eine flache Hartgummischeibe, die als das Spielgerät bei Hockeysportarten dient." · "Frühe Pucks
//     waren aus Holz oder gefüllten Lederlappen."
//   Badminton: "Der Kopf ist aus Kork, der Federkranz besteht in der Regel aus 16 Gänse- oder Entenfedern"
//   Curling: "Hergestellt werden die meisten Wettkampfsteine seit 1876 durch eine schottische Firma in Ayrshire, das Rohmaterial
//     kommt von der nahe gelegenen Insel Ailsa Craig. Der Granit auf dieser Insel ist außergewöhnlich feinkörnig"
//   Fußball-Weltmeisterschaft: "Alle vier Jahre können sich die Mannschaften für die Endrunde der Weltmeisterschaft qualifizieren.
//     In einem abschließend rund vierwöchigen Turnier"
//   Darts: "Der äußere Ring, das Bull (auch: Outer-Bull oder Single-Bull, grün) zählt 25 Punkte. Der innere Kreis, das Bull’s Eye
//     (auch Inner-Bull oder Double-Bull, rot […]), zählt 50 Punkte."
//   Snooker: "Die 15 roten Kugeln sind je einen Punkt wert, die anderen Objektbälle („Farben“) haben aufsteigende Punktzahlen
//     (gelb → 2, grün → 3, braun → 4, blau → 5, pink → 6, schwarz → 7)."
//   Bowling: "im letzten – dem zehnten – Durchgang" · "Für das gesamte Spiel können maximal 300 Punkte erzielt werden"
//   Axel (Eiskunstlauf): "Benannt ist er nach dem norwegischen Eiskunstläufer Axel Paulsen, der ihn erstmals 1882 zeigte" · "Der
//     Axel ist ebenfalls der einzige der sechs Grundsprünge, der vorwärts abgesprungen wird."
export const LOCALE = "en";
export const TODAY = "2026-10-25";
export const verification = "ai_checked";

// [id, category, difficulty, minAge, maxAge, question, options, correct, explanation, wiki, enQuestion, enOptions, enExplanation, tags]
export const questions = [
  ["sp45", "sport", 2, 10, null, "Wer erfand 1891 das Basketballspiel?", ["James Naismith", "Pierre de Coubertin", "William Webb Ellis", "Walter Camp"], 0, "Der kanadische Arzt und Pädagoge James Naismith entwickelte Basketball 1891 in Springfield (USA) als Hallensport für seine Studenten.", "Basketball", "Who invented the game of basketball in 1891?", ["James Naismith", "Pierre de Coubertin", "William Webb Ellis", "Walter Camp"], "The Canadian doctor and teacher James Naismith developed basketball in 1891 in Springfield (USA) as an indoor sport for his students.", ["Basketball", "Geschichte"]],
  ["sp46", "sport", 1, 10, null, "Woraus besteht ein heutiger Eishockeypuck?", ["Aus Hartgummi", "Aus Kork", "Aus Aluminium", "Aus Styropor"], 0, "Ein Puck ist eine flache Scheibe aus Hartgummi. Frühe Pucks waren noch aus Holz oder gefüllten Lederlappen.", "Puck_(Sport)", "What is a modern ice hockey puck made of?", ["Hard rubber", "Cork", "Aluminium", "Polystyrene"], "A puck is a flat disc of hard rubber. Early pucks were made of wood or stuffed leather.", ["Eishockey"]],
  ["sp47", "sport", 2, 10, null, "Woraus besteht der Federkranz eines Naturfederballs beim Badminton?", ["Aus Gänse- oder Entenfedern", "Aus Papier", "Aus Gummi", "Aus Leder"], 0, "Der Kopf des Balls ist aus Kork, der Federkranz besteht meist aus 16 Gänse- oder Entenfedern.", "Badminton", "What is the feather skirt of a natural shuttlecock in badminton made of?", ["Goose or duck feathers", "Paper", "Rubber", "Leather"], "The head of the shuttlecock is made of cork; the skirt usually consists of 16 goose or duck feathers.", ["Badminton"]],
  ["sp48", "sport", 3, 13, null, "Von welcher Insel stammt der Granit der meisten Curlingsteine für Wettkämpfe?", ["Von Ailsa Craig in Schottland", "Von Island", "Von Sizilien", "Von Grönland"], 0, "Die meisten Wettkampfsteine stellt seit 1876 eine schottische Firma her. Das Rohmaterial kommt von der Insel Ailsa Craig – ihr Granit ist außergewöhnlich feinkörnig.", "Curling", "Which island does the granite of most competition curling stones come from?", ["Ailsa Craig in Scotland", "Iceland", "Sicily", "Greenland"], "Most competition stones have been made by a Scottish company since 1876. The raw material comes from the island of Ailsa Craig – its granite is unusually fine-grained.", ["Curling", "Wintersport"]],
  ["sp49", "sport", 1, 10, null, "Wie oft findet die Fußball-Weltmeisterschaft der Männer statt?", ["Alle vier Jahre", "Jedes Jahr", "Alle zwei Jahre", "Alle fünf Jahre"], 0, "Alle vier Jahre können sich die Nationalmannschaften für die Endrunde qualifizieren, die dann als rund vierwöchiges Turnier ausgetragen wird.", "Fußball-Weltmeisterschaft", "How often is the men's football World Cup held?", ["Every four years", "Every year", "Every two years", "Every five years"], "Every four years the national teams can qualify for the final tournament, which then lasts about four weeks.", ["Fußball"]],
  ["sp50", "sport", 1, 10, null, "Wie viele Punkte zählt das rote Bull’s Eye in der Mitte einer Dartscheibe?", ["25", "50", "60", "100"], 1, "Der innere rote Kreis, das Bull’s Eye, zählt 50 Punkte. Der grüne Ring darum, das Single Bull, zählt 25.", "Darts", "How many points is the red bull's eye in the centre of a dartboard worth?", ["25", "50", "60", "100"], "The inner red circle, the bull's eye, is worth 50 points. The green ring around it, the single bull, is worth 25.", ["Darts"]],
  ["sp51", "sport", 2, 10, null, "Wie viele Punkte bringt die schwarze Kugel beim Snooker?", ["1", "5", "7", "10"], 2, "Die 15 roten Kugeln sind je einen Punkt wert, die Farben steigen von Gelb (2) bis Schwarz (7).", "Snooker", "How many points is the black ball worth in snooker?", ["1", "5", "7", "10"], "The 15 red balls are worth one point each; the colours rise from yellow (2) to black (7).", ["Snooker"]],
  ["sp52", "sport", 2, 10, null, "Wie viele Punkte kann man in einem Bowlingspiel höchstens erreichen?", ["100", "200", "300", "1000"], 2, "Ein Spiel hat zehn Durchgänge. Für das gesamte Spiel können höchstens 300 Punkte erzielt werden.", "Bowling", "What is the highest possible score in a game of bowling?", ["100", "200", "300", "1000"], "A game has ten frames. At most 300 points can be scored in a whole game.", ["Bowling"]],
  ["sp53", "sport", 2, 10, null, "Welcher Eiskunstlaufsprung wird als einziger der sechs Grundsprünge vorwärts abgesprungen?", ["Der Axel", "Der Rittberger", "Der Salchow", "Der Lutz"], 0, "Der Axel ist der einzige der sechs Grundsprünge mit einem Absprung nach vorn. Benannt ist er nach dem Norweger Axel Paulsen, der ihn 1882 erstmals zeigte.", "Axel_(Eiskunstlauf)", "Which figure skating jump is the only one of the six basic jumps taken off forwards?", ["The Axel", "The loop", "The Salchow", "The Lutz"], "The Axel is the only one of the six basic jumps with a forward take-off. It is named after the Norwegian Axel Paulsen, who first showed it in 1882.", ["Eiskunstlauf", "Wintersport"]],
];
