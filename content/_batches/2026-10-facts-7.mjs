// Content batch (21.10.2026): 8 facts for the thinnest topics (sport, language, business, economy), routine format:
// every claim has a word-for-word quote from the linked article, checked by scripts/content/verify-evidence.mjs.
//   node scripts/content/verify-evidence.mjs content/_batches/2026-10-facts-7.mjs && node content/_batches/2026-10-facts-7.mjs
import { pathToFileURL } from "node:url";
import { mergeFacts, wiki } from "../../scripts/content/merge-facts.mjs";

export const TODAY = "2026-10-21";
export const verification = "ai_checked";

export const facts = [
  ["f-wm-1930", "sport", "sport", [wiki("Fußball-Weltmeisterschaft_1930")], "Die erste Fußball-Weltmeisterschaft fand 1930 in Uruguay statt.", "Sie dauerte vom 13. bis zum 30. Juli 1930. Gastgeber war Uruguay.", "The first FIFA World Cup took place in Uruguay in 1930.", "It ran from 13 to 30 July 1930. Uruguay was the host."],
  ["f-basketball-1891", "sport", "sport", [wiki("Basketball")], "Basketball wurde 1891 erfunden – als Hallensport.", "Erfunden hat ihn der kanadische Arzt und Pädagoge James Naismith, ursprünglich für YMCA-Studenten. Über den YMCA verbreitete sich das Spiel schnell weltweit. Seit 1936 ist es olympisch.", "Basketball was invented in 1891 – as an indoor sport.", "It was invented by the Canadian physician and educator James Naismith, originally for YMCA students. Through the YMCA the game quickly spread around the world. It has been an Olympic sport since 1936."],
  ["f-golf-mond", "sport", "sport", [wiki("Alan_Shepard")], "Auf dem Mond wurde schon Golf gespielt.", "Alan Shepard, Kommandant von Apollo 14, nahm zwei Golfbälle und ein Eisen 6 mit auf den Mond. Er ging als erster Golfspieler auf dem Mond in die Geschichte ein.", "Golf has been played on the Moon.", "Alan Shepard, commander of Apollo 14, took two golf balls and a 6-iron to the Moon. He went down in history as the first person to play golf on the Moon."],
  ["f-esperanto", "language", "language", [wiki("Esperanto")], "Esperanto heißt übersetzt „der Hoffende“ – nach dem Decknamen seines Erfinders.", "Der Augenarzt Ludwik Lejzer Zamenhof veröffentlichte die Grundlagen 1887 unter dem Namen Doktoro Esperanto. Es ist die am weitesten verbreitete Plansprache.", "Esperanto means “one who hopes” – after its inventor's pen name.", "The ophthalmologist Ludwik Lejzer Zamenhof published its foundations in 1887 under the name Doktoro Esperanto. It is the most widely spoken constructed language."],
  ["f-quarantaene", "language", "language", [wiki("Quarantäne")], "„Quarantäne“ bedeutet eigentlich „vierzig Tage“.", "Das Wort kam im 17. Jahrhundert aus dem Französischen (quarantaine de jours) ins Deutsche.", "“Quarantine” actually means “forty days”.", "The word came into German from French (quarantaine de jours) in the 17th century."],
  ["f-coca-cola", "curious", "business", [wiki("The_Coca-Cola_Company")], "Coca-Cola hat ein Pharmazeut erfunden – 1886 in Atlanta.", "John Stith Pemberton, Kriegsveteran und Pharmazeut, entwickelte das Getränk am 8. Mai 1886.", "Coca-Cola was invented by a pharmacist – in Atlanta in 1886.", "John Stith Pemberton, a war veteran and pharmacist, created the drink on 8 May 1886."],
  ["f-adidas-puma", "curious", "business", [wiki("Adidas")], "Adidas und Puma wurden von zwei Brüdern gegründet – aus derselben Kleinstadt.", "Adolf und Rudolf Dassler fertigten in den 1920er-Jahren in Herzogenaurach gemeinsam Sportschuhe. Dann gingen sie getrennte Wege: Rudolf gründete 1948 Puma.", "Adidas and Puma were founded by two brothers – from the same small town.", "In the 1920s Adolf and Rudolf Dassler made sports shoes together in Herzogenaurach. Then they went separate ways: Rudolf founded Puma in 1948."],
  ["f-inflation-1923", "money", "economy", [wiki("Deutsche_Inflation_1914_bis_1923")], "Im November 1923 kostete ein US-Dollar 4,2 Billionen Mark.", "Der Kurs der Mark gegenüber dem Dollar sank rapide. Die Hyperinflation führte zu einem teilweisen Zusammenbruch der deutschen Wirtschaft und des Bankensystems.", "In November 1923 one US dollar cost 4.2 trillion marks.", "The mark fell rapidly against the dollar. The hyperinflation led to a partial collapse of the German economy and banking system."],
];

export const evidence = {
  "f-wm-1930": ["de|Fußball-Weltmeisterschaft_1930|war die erste Ausspielung des bedeutendsten Turniers für Fußballnationalmannschaften", "de|Fußball-Weltmeisterschaft_1930|vom 13. bis zum 30. Juli 1930 statt. Gastgeber war Uruguay"],
  "f-basketball-1891": ["de|Basketball|Basketball wurde im Jahr 1891 vom kanadischen Arzt und Pädagogen James Naismith als Hallensport ursprünglich für YMCA-Studenten erfunden", "de|Basketball|über den YMCA schnell weltweite Verbreitung", "de|Basketball|Seit 1936 ist die Sportart für Männer"],
  "f-golf-mond": ["de|Alan_Shepard|Al Shepard ging als erster Golfspieler auf dem Mond in die Geschichtsbücher ein", "de|Alan_Shepard|Er hatte zwei Golfbälle mit auf den Mond genommen, außerdem ein Eisen 6", "de|Alan_Shepard|als Kommandant der Mission Apollo 14"],
  "f-esperanto": ["de|Esperanto|Esperanto ist die am weitesten verbreitete Plansprache", "de|Esperanto|1887 von dem Augenarzt Ludwik Lejzer Zamenhof veröffentlicht, dessen Pseudonym Doktoro Esperanto („Doktor Hoffender“) zum Namen der Sprache wurde"],
  "f-quarantaene": ["de|Quarantäne|gelangte im 17. Jahrhundert wie italienisch quarantena aus französisch quarantaine de jours („vierzig Tage“) ins Deutsche"],
  "f-coca-cola": ["de|The_Coca-Cola_Company|Erfunden wurde Coca-Cola von John Stith Pemberton am 8. Mai 1886", "de|The_Coca-Cola_Company|Der Kriegsveteran und Pharmazeut aus Atlanta"],
  "f-adidas-puma": ["de|Adidas|fertigten die Brüder Adolf und Rudolf Dassler in der alten Waschküche ihrer Mutter in Herzogenaurach Sportschuhe", "de|Adidas|gingen getrennte Wege", "de|Adidas|Rudolf Dassler gründete 1948 die Firma Puma"],
  "f-inflation-1923": ["de|Deutsche_Inflation_1914_bis_1923|Der Wechselkurs der Mark gegenüber dem US-Dollar sank rapide", "de|Deutsche_Inflation_1914_bis_1923|betrug im November 1923 1 US-Dollar zu 4,2 Billionen Mark", "de|Deutsche_Inflation_1914_bis_1923|Die Hyperinflation führte zu einem teilweisen Zusammenbruch der deutschen Wirtschaft und des Bankensystems"],
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeFacts(facts, { today: TODAY, verification });
