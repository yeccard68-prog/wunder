// Content batch (19.10.2026): 6 more "did you know" facts from areas with few facts so far (language, sport,
// economy, history), each checked against the linked article on 19.10.2026. Note: the marathon distance of
// 42.195 km was fixed in 1921 (per the article) – the popular "since London 1908" is not what it says. AI-checked.
//   node content/_batches/2026-10-facts-5.mjs
import { pathToFileURL } from "node:url";
import { mergeFacts, wiki } from "../../scripts/content/merge-facts.mjs";

export const TODAY = "2026-10-19";
export const verification = "ai_checked";

export const facts = [
  ["f-hawaii-alphabet", "language", "language", [wiki("Hawaiische_Sprache")], "Das hawaiische Alphabet kommt mit 13 Zeichen aus.", "Es besteht aus 12 Buchstaben der lateinischen Schrift und dem Zeichen ʻOkina. Damit ist es eines der kürzesten Alphabete der Welt.", "The Hawaiian alphabet gets by with 13 characters.", "It consists of 12 letters of the Latin script plus the character ʻokina. That makes it one of the shortest alphabets in the world."],
  ["f-marathon-1921", "sport", "sport", [wiki("Marathonlauf")], "Die Marathonstrecke von 42,195 Kilometern ist erst seit 1921 festgelegt.", "Der Marathon ist die längste olympische Laufdisziplin in der Leichtathletik. Bei großen Meisterschaften endet er oft mit einer Runde im Stadion.", "The marathon distance of 42.195 kilometres has only been fixed since 1921.", "The marathon is the longest Olympic running event in athletics. At major championships it often finishes with a lap in the stadium."],
  ["f-erste-aktie", "money", "economy", [wiki("Niederländische_Ostindien-Kompanie")], "Die ersten Aktien gab die Niederländische Ostindien-Kompanie aus – gegründet 1602.", "Das Handelsunternehmen beherrschte einen Teil des lukrativen Indienhandels und war in sechs „Kammern“ gegliedert. Nach einem Krieg gegen England geriet es in Geldnot und wurde 1798 aufgelöst.", "The first shares were issued by the Dutch East India Company – founded in 1602.", "The trading company dominated part of the lucrative trade with the East Indies and was organised in six “chambers”. After a war with England it ran into financial trouble and was dissolved in 1798."],
  ["f-euro-bargeld", "money", "economy", [wiki("Euro")], "Den Euro gab es drei Jahre lang nur auf dem Konto, bevor Scheine und Münzen kamen.", "Am 1. Januar 1999 wurde er als Buchgeld eingeführt, am 1. Januar 2002 als Bargeld. Nach dem US-Dollar ist er die zweitwichtigste Reservewährung der Welt.", "For three years the euro existed only in accounts before notes and coins arrived.", "It was introduced as book money on 1 January 1999 and as cash on 1 January 2002. After the US dollar it is the world's second most important reserve currency."],
  ["f-kuerzester-krieg", "history", "history", [wiki("Britisch-Sansibarischer_Krieg")], "Der kürzeste Krieg der Geschichte dauerte 38 Minuten.", "Großbritannien und das Sultanat Sansibar kämpften am 27. August 1896 von 9:00 bis 9:38 Uhr. Das Guinness-Buch der Rekorde führt ihn als kürzesten Krieg der Weltgeschichte.", "The shortest war in history lasted 38 minutes.", "Britain and the Sultanate of Zanzibar fought on 27 August 1896 from 9:00 to 9:38 a.m. Guinness World Records lists it as the shortest war in history."],
  ["f-mauer-mond", "history", "history", [wiki("Chinesische_Mauer")], "Die Chinesische Mauer ist vom Mond aus nicht zu sehen.", "Der Mond ist rund 380.000 Kilometer entfernt – die Mauer mit bloßem Auge von dort zu erkennen, wäre unmöglich. Die meisten bemannten Raumflüge fanden in 300 bis 600 Kilometern Höhe statt.", "The Great Wall of China cannot be seen from the Moon.", "The Moon is about 380,000 kilometres away – spotting the wall from there with the naked eye would be impossible. Most crewed spaceflights have taken place 300 to 600 kilometres up."],
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeFacts(facts, { today: TODAY, verification });
