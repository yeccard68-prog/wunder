// Content batch (11.11.2026): 12 questions for "Business" – inventions and history of trade (terms like monopoly or inflation already exist under "economy").
// No investment advice: only definitions and history.
// Quotes checked by verify-evidence.mjs.
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-business-3.mjs && node scripts/content/apply-batch.mjs content/_batches/2026-11-business-3.mjs
import { balance } from "./_balance.mjs";

export const LOCALE = "en";
export const TODAY = "2026-11-11";
export const verification = "ai_checked";

// [id, category, difficulty, minAge, maxAge, question, options, correct, explanation, wiki, enQuestion, enOptions, enExplanation, tags]
export const questions = balance([
  ["b87", "business", 2, 10, null, "Wie nennt man einen Markt mit nur wenigen Anbietern, aber vielen Käufern?", ["Monopol", "Oligopol", "Polypol", "Monarchie"], 1,
    "Gibt es auf der Anbieterseite nur wenige Marktteilnehmer und auf der Nachfrageseite viele, spricht man von einem Oligopol. Bei nur einem Anbieter heißt es Monopol.", "Monopol",
    "What do you call a market with only a few sellers but many buyers?", ["Monopoly", "Oligopoly", "Polypoly", "Monarchy"],
    "If there are only a few participants on the supply side and many on the demand side, it is called an oligopoly. With only one seller it is called a monopoly.", ["Business", "Grundbegriffe"]],
  ["b89", "business", 2, 10, null, "Welches Produkt wurde 1974 als erstes mit seinem Strichcode an einer Scannerkasse verkauft?", ["Eine Packung Kaugummi", "Eine Flasche Milch", "Eine Dose Suppe", "Ein Brot"], 0,
    "Im Juni 1974 wurde in einem Supermarkt in Troy (Ohio) das erste Produkt mit Strichcode an einer Scannerkasse erfasst und verkauft: eine Zehnerpackung Kaugummi.", "Strichcode",
    "Which product was the first to be sold with its barcode at a scanner checkout in 1974?", ["A pack of chewing gum", "A bottle of milk", "A can of soup", "A loaf of bread"],
    "In June 1974 the first product with a barcode was scanned and sold at a checkout in a supermarket in Troy, Ohio: a ten-pack of chewing gum.", ["Business", "Erfindungen"]],
  ["b90", "business", 2, 10, null, "Was war die Hanse im Mittelalter?", ["Ein Ritterorden", "Ein Bund vor allem norddeutscher Kaufleute", "Eine Universität", "Eine Münze"], 1,
    "Die Hanse war vom 12. bis zum 17. Jahrhundert eine Vereinigung vor allem norddeutscher Kaufleute. Ihr Ziel waren sichere Überfahrten und gemeinsame wirtschaftliche Interessen im Ausland. Als entscheidend für ihre Entwicklung gilt die Gründung Lübecks im Jahr 1143.", "Hanse",
    "What was the Hanseatic League in the Middle Ages?", ["An order of knights", "An association mainly of north German merchants", "A university", "A coin"],
    "The Hanseatic League was an association mainly of north German merchants from the 12th to the 17th century. Its aims were safe sea passages and shared economic interests abroad. The founding of Lübeck in 1143 is considered decisive for its development.", ["Business", "Geschichte"]],
  ["b91", "business", 2, 10, null, "Wo wurde im Juni 1967 der erste Geldautomat aufgestellt?", ["In New York", "In London", "In Frankfurt", "In Tokio"], 1,
    "Der erste Geldautomat wurde im Juni 1967 von der Barclays Bank in Enfield im Norden von London aufgestellt. Anfangs konnte man nur so viel Geld abheben, wie man vorher in speziellen Schecks besaß.", "Geldautomat",
    "Where was the first cash machine installed in June 1967?", ["New York", "London", "Frankfurt", "Tokyo"],
    "The first cash machine was installed by Barclays Bank in June 1967 in Enfield in north London. At first customers could only withdraw as much money as they held in special cheques.", ["Business", "Erfindungen"]],
  ["b92", "business", 2, 10, null, "Von welchem Club stammte 1950 die erste Kreditkarte, die man in vielen Geschäften nutzen konnte?", ["Rotary Club", "Diners Club", "Golfclub", "Automobilclub"], 1,
    "Die erste Universalkreditkarte gab der Diners Club heraus, der im Februar 1950 gegründet wurde. Mit ihr konnte man in vielen verschiedenen Geschäften bezahlen.", "Kreditkarte",
    "Which club issued the first credit card in 1950 that could be used in many shops?", ["Rotary Club", "Diners Club", "A golf club", "An automobile club"],
    "The first general-purpose credit card was issued by the Diners Club, founded in February 1950. It could be used to pay in many different shops.", ["Business", "Erfindungen"]],
  ["b93", "business", 2, 10, null, "Warum stellte Sylvan Goldman 1937 in seinem Supermarkt die ersten Einkaufswagen auf?", ["Damit Kinder spielen können", "Damit die Kunden mehr einkaufen", "Wegen eines Gesetzes", "Um Diebstahl zu verhindern"], 1,
    "Erstmals wurden Einkaufswagen 1937 in den USA eingesetzt. Sylvan Goldman stellte sie in seinem Supermarkt in Oklahoma City zur Verfügung – nicht zuletzt, um die Kunden zu größeren Einkäufen anzuregen.", "Einkaufswagen",
    "Why did Sylvan Goldman put the first shopping trolleys in his supermarket in 1937?", ["So children could play", "So customers would buy more", "Because of a law", "To prevent theft"],
    "Shopping trolleys were first used in 1937 in the USA. Sylvan Goldman provided them in his supermarket in Oklahoma City – not least to encourage customers to buy more.", ["Business", "Erfindungen"]],
  ["b94", "business", 2, 10, null, "Wer verschiffte 1956 als Erster Waren in genormten Frachtcontainern?", ["Henry Ford", "Malcolm McLean", "Thomas Edison", "Carl Benz"], 1,
    "1956 verschiffte der Amerikaner Malcolm McLean als Erster 58 Container mit dem Schiff Ideal X von Newark nach Houston. 1961 wurden erstmals international gültige Maße für die ISO-Container festgelegt.", "Container",
    "Who was the first to ship goods in standardised freight containers in 1956?", ["Henry Ford", "Malcolm McLean", "Thomas Edison", "Carl Benz"],
    "In 1956 the American Malcolm McLean was the first to ship 58 containers, aboard the ship Ideal X from Newark to Houston. In 1961 internationally valid dimensions for ISO containers were set for the first time.", ["Business", "Erfindungen"]],
  ["b95", "business", 2, 10, null, "Wofür stehen die vier Buchstaben im Namen IKEA?", ["Für vier schwedische Städte", "Für den Gründer, den Bauernhof seiner Eltern und sein Dorf", "Für „Ideen, Komfort, Einrichtung, Alltag“", "Für vier Gründer"], 1,
    "IKEA steht für Ingvar Kamprad, den Gründer, für Elmtaryd, den Bauernhof seiner Eltern, und für das Dorf Agunnaryd. Kamprad gründete das Unternehmen 1943 in Schweden – mit 17 Jahren.", "IKEA",
    "What do the four letters in the name IKEA stand for?", ["Four Swedish cities", "The founder, his parents' farm and his village", "'Ideas, comfort, furnishing, everyday life'", "Four founders"],
    "IKEA stands for Ingvar Kamprad, the founder, Elmtaryd, his parents' farm, and the village of Agunnaryd. Kamprad founded the company in Sweden in 1943 – at the age of 17.", ["Business", "Marken"]],
  ["b96", "business", 3, 10, null, "Welche Form hatte die erste Milchverpackung von Tetra Pak, die 1943 entwickelt wurde?", ["Einen Würfel", "Einen Tetraeder – eine dreiseitige Pyramide", "Eine Kugel", "Einen Zylinder"], 1,
    "1943 entwickelten der Chemiker Erik Wallenberg und zwei Kollegen eine völlig neue Verpackung für Milch: einen Karton in der Form eines Tetraeders. Daher kommt auch der Name Tetra Pak, der heute oft für Getränkekartons allgemein steht.", "Tetra_Pak",
    "What shape was Tetra Pak's first milk package, developed in 1943?", ["A cube", "A tetrahedron – a three-sided pyramid", "A sphere", "A cylinder"],
    "In 1943 the chemist Erik Wallenberg and two colleagues developed a completely new package for milk: a carton in the shape of a tetrahedron. That is where the name Tetra Pak comes from, which today often stands for drinks cartons in general.", ["Business", "Erfindungen"]],
  ["b97", "business", 2, 13, null, "Mit welchem Bild wird der schottische Ökonom Adam Smith oft verbunden?", ["Der „unsichtbaren Hand“ des Marktes", "Dem „eisernen Vorhang“", "Dem „Schneeballeffekt“", "Der „goldenen Mitte“"], 0,
    "Adam Smith gilt als Begründer der klassischen Volkswirtschaftslehre. Mit ihm verbindet man das Bild der „unsichtbaren Hand“: Obwohl jeder seine eigenen Interessen verfolgt, entsteht dadurch – eher zufällig – Wohlstand für viele.", "Adam_Smith",
    "Which image is the Scottish economist Adam Smith often associated with?", ["The 'invisible hand' of the market", "The 'iron curtain'", "The 'snowball effect'", "The 'golden mean'"],
    "Adam Smith is considered the founder of classical economics. He is associated with the image of the 'invisible hand': although everyone pursues their own interests, this creates prosperity for many – more or less by chance.", ["Business", "Grundbegriffe"]],
  ["b98", "business", 1, 10, null, "Was ist der Unterschied zwischen Brutto- und Nettoeinkommen?", ["Es gibt keinen", "Netto ist, was nach Abzug von Steuern und Pflichtbeiträgen übrig bleibt", "Netto ist immer höher als Brutto", "Brutto gilt nur für Kinder"], 1,
    "Das Nettoeinkommen ist das, was nach Abzug von Abgaben, Steuern und Beiträgen für Pflichtversicherungen vom Bruttoeinkommen übrig bleibt. Es ist deshalb immer niedriger als oder gleich dem Bruttoeinkommen.", "Bruttoeinkommen",
    "What is the difference between gross and net income?", ["There is none", "Net is what remains after taxes and compulsory contributions are deducted", "Net is always higher than gross", "Gross only applies to children"],
    "Net income is what remains of gross income after deducting levies, taxes and compulsory insurance contributions. It is therefore always lower than or equal to gross income.", ["Business", "Grundbegriffe"]],
  ["b100", "business", 2, 10, null, "In welchem Land wurde als Erstes Papiergeld benutzt?", ["In Italien", "In China", "In England", "In Ägypten"], 1,
    "China war das erste Land der Welt, in dem Papiergeld genutzt wurde. Im Jahr 1402 schaffte man es dort jedoch wieder ab, weil oft große Mengen Banknoten ohne Deckung gedruckt worden waren.", "Papiergeld",
    "In which country was paper money first used?", ["Italy", "China", "England", "Egypt"],
    "China was the first country in the world to use paper money. In 1402, however, it was abolished there again because large quantities of banknotes had often been printed without backing.", ["Business", "Geschichte"]],
]);

export const evidence = {
  b87: ["de|Monopol|Oligopol: Wenn es nur wenige Marktteilnehmer auf der Anbieterseite und viele Marktteilnehmer auf der Nachfragerseite gibt, spricht man von einem Oligopol."],
  b89: ["de|Strichcode|Juni 1974 wurde in einer Filiale der US-amerikanischen Supermarktkette Marsh in Troy (Ohio) das erste mit einem Strichcode markierte Produkt, eine Zehnerpackung Juicy Fruit (Kaugummi)", "de|Strichcode|von einer Scannerkasse des Unternehmens Datalogic"],
  b90: ["de|Hanse|die zwischen Mitte des 12. Jahrhunderts und Mitte des 17. Jahrhunderts bestehenden Vereinigungen hauptsächlich norddeutscher Kaufleute, deren Ziel die Sicherheit der Überfahrt und die Vertretung gemeinsamer wirtschaftlicher Interessen besonders im Ausland war", "de|Hanse|Allgemein wird die Gründung Lübecks, der ersten deutschen Ostseestadt, im Jahr 1143 als entscheidend für die Entwicklung der Hanse angesehen."],
  b91: ["de|Geldautomat|Juni 1967 in Enfield Town (London Borough of Enfield) im Norden von London von der Barclays Bank aufgestellt", "de|Geldautomat|Anfangs konnten Bankkunden 1967 nur so viel Geld abheben, wie sie als Gegenwert in speziellen Schecks besaßen."],
  b92: ["de|Kreditkarte|Die erste derartige Universalkreditkarte war die des Diners Club, der im Februar 1950 in Form eines Clubs gegründet wurde."],
  b93: ["de|Einkaufswagen|Erstmals wurden Einkaufswagen 1937 in den USA eingesetzt.", "de|Einkaufswagen|Sylvan Goldman stellte in seinem Humpty-Dumpty-Supermarkt in Oklahoma City den Kunden einen shopping cart zur Verfügung – nicht zuletzt, um diese zu umfangreicheren Wareneinkäufen anzuregen."],
  b94: ["de|Container|1956 verschiffte der Amerikaner Malcom McLean als erster 58 Container mit dem Schiff Ideal X von Newark nach Houston; 1961 legte die Internationale Organisation für Normung (ISO) erstmals international gültige Maße für die ISO-Container fest."],
  b95: ["de|IKEA|IKEA (Abkürzung für Ingvar Kamprad Elmtaryd Agunnaryd)", "de|IKEA|Der damals 17-jährige Ingvar Kamprad gründete das Unternehmen 1943 in Schweden.", "de|IKEA|Das Akronym IKEA setzt sich aus den Anfangsbuchstaben von Ingvar Kamprad, des elterlichen Bauernhofs Elmtaryd und des Dorfes Agun"],
  b96: ["de|Tetra_Pak|1943 war es dem jungen Chemiker Erik Wallenberg, dem Ingenieur Harry Järund und dem Verkaufsleiter Erik Torudd gelungen, eine völlig neue Verpackung für Milch zu entwickeln – eine Kartonverpackung in der Form eines Tetraeders.", "de|Tetra_Pak|Der Markenname fand als Gattungsname für Getränkekartons im Allgemeinen Eingang in den deutschen Sprachgebrauch."],
  b97: ["de|Adam_Smith|war ein schottischer Moralphilosoph und Aufklärer und gilt als Begründer der klassischen Nationalökonomie", "de|Adam_Smith|Obwohl jeder Einzelne also ausschließlich die eigenen wirtschaftlichen Interessen verfolgt, wird durch die unsichtbare Hand des Marktes der größtmögliche gesellschaftliche Reichtum", "de|Adam_Smith|wenn auch mehr oder weniger nur zufällig"],
  b98: ["de|Bruttoeinkommen|ist dasjenige Einkommen, das nach Abzug bestimmter Ausgaben vom Bruttoeinkommen übrig bleibt. Die bestimmten Ausgaben sind Abgaben, Steuern und Beiträge für Pflichtversicherungen", "de|Bruttoeinkommen|Das Nettoeinkommen ist deshalb stets niedriger oder gleich dem Bruttoeinkommen."],
  b100: ["de|Papiergeld|China war das erste Land der Welt, in dem Papiergeld genutzt wurde.", "de|Papiergeld|1402 wurde in China das Papiergeld wieder abgeschafft, da es oft vorkam, dass Kaiser gewaltige Mengen von Banknoten drucken ließen, ohne deren Deckung zu beachten."],
};
