// Content batch (23.10.2026): six more "Persönlichkeiten" clips (video/src/people.ts, Lebenslinie.tsx), same rules as
// 2026-10-people-1.mjs: long-dead people known for their work, no portraits, every claim quoted below.
//   node scripts/content/verify-evidence.mjs content/_batches/2026-10-people-4.mjs
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-people-4.mjs && npm --prefix video run render -- <ids>
import fs from "node:fs";

export const LOCALE = "en";
export const TODAY = "2026-10-23";
export const verification = "ai_checked";

const W = "https://de.wikipedia.org/wiki/";
const wiki = (title) => ({ name: "Wikipedia: " + title.replaceAll("_", " "), url: W + title });
const own = (id, category_id, min_age, tags, sources, de, en, quiz) => ({
  id, category_id, min_age, tags, title: de[0], hook: de[1], description: de[2], captions: de[3],
  en: { title: en[0], hook: en[1], description: en[2], captions: en[3], file: `/clips/${id}.en.mp4`, poster: `/clips/${id}.en.jpg` },
  quiz, creator_name: "Wunder Redaktion", license: "Eigene Produktion", source: sources[0], sources, format: "animated_fact",
  production: { provider: "remotion", composition: id, start: 0, end: 10 },
});

export const videos = [
  own("v-person-kopernikus", "science", 10, ["Persönlichkeiten", "Astronomie"], [wiki("Nikolaus_Kopernikus")],
    ["Nikolaus Kopernikus: Astronom, Domherr und Arzt", "Sein Hauptwerk von 1543 führte zu einem Umbruch, der als „kopernikanische Wende“ bezeichnet wird.",
      "Nikolaus Kopernikus wurde am 19. Februar 1473 in Thorn geboren. Von 1491 bis 1494 besuchte er die Universität Krakau, wo er die Sieben Freien Künste studierte. Zum Wintersemester 1496/1497 begann er in Bologna ein Studium beider Rechte; dort studierte er auch Astronomie. In seinem Hauptwerk De revolutionibus orbium coelestium von 1543 beschreibt er ein heliozentrisches Weltbild: Die Erde sei ein Planet, drehe sich um ihre eigene Achse und bewege sich wie die anderen Planeten um die Sonne. Kopernikus starb am 24. Mai 1543 in Frauenburg.",
      ["Geboren 1473 in Thorn.", "Studium in Krakau und später in Bologna.", "1543: sein Hauptwerk De revolutionibus."]],
    ["Nicolaus Copernicus: astronomer, canon and physician", "His main work of 1543 led to an upheaval known as the \"Copernican Revolution\".",
      "Nicolaus Copernicus was born in Thorn on 19 February 1473. From 1491 to 1494 he attended the University of Kraków, where he studied the seven liberal arts. In the winter semester of 1496/1497 he began studying both laws in Bologna; there he also studied astronomy. In his main work De revolutionibus orbium coelestium of 1543 he describes a heliocentric view of the world: the Earth is a planet, rotates on its own axis and, like the other planets, moves around the Sun. Copernicus died in Frauenburg on 24 May 1543.",
      ["Born in Thorn in 1473.", "Studied in Kraków and later in Bologna.", "1543: his main work De revolutionibus."]],
    ["Was beschreibt Kopernikus in seinem Hauptwerk über die Erde?", ["Sie ist ein Planet, der um die Sonne kreist", "Sie ruht im Mittelpunkt des Weltalls", "Sie ist eine flache Scheibe", "Sie ist ein Stern"], 0,
      "Kopernikus beschreibt ein heliozentrisches Weltbild: Die Erde ist ein Planet, der sich um die eigene Achse dreht und wie die anderen Planeten um die Sonne bewegt.",
      "What does Copernicus describe about the Earth in his main work?", ["It is a planet that orbits the Sun", "It rests at the centre of the universe", "It is a flat disc", "It is a star"],
      "Copernicus describes a heliocentric view of the world: the Earth is a planet that rotates on its own axis and, like the other planets, moves around the Sun."]),

  own("v-person-bach", "culture", 10, ["Persönlichkeiten", "Musik"], [wiki("Johann_Sebastian_Bach")],
    ["Johann Sebastian Bach: Komponist des Barock", "Vielen Berufsmusikern gilt Bach als der Inbegriff eines tiefgründigen und genialen Komponisten.",
      "Johann Sebastian Bach wurde nach dem Gregorianischen Kalender am 31. März 1685 in Eisenach geboren. Im Juli 1708 zog er mit seiner Frau nach Weimar. 1717 unterschrieb er den Vertrag als Hofkapellmeister in Köthen. 1723 trat er in Leipzig seinen Dienst als Thomaskantor an und behielt diese Stelle bis zu seinem Tod. Zu seinen bekanntesten Werken gehören die Brandenburgischen Konzerte, die Matthäus-Passion und das Weihnachtsoratorium. Bach hatte insgesamt 20 Kinder, von denen die meisten schon im Kindesalter starben. Er starb am 28. Juli 1750 in Leipzig.",
      ["Geboren 1685 in Eisenach.", "1708 Weimar, 1717 Köthen.", "Ab 1723 Thomaskantor in Leipzig."]],
    ["Johann Sebastian Bach: a Baroque composer", "Many professional musicians regard Bach as the epitome of a profound and brilliant composer.",
      "Johann Sebastian Bach was born in Eisenach on 31 March 1685 by the Gregorian calendar. In July 1708 he moved to Weimar with his wife. In 1717 he signed the contract as court Kapellmeister in Köthen. In 1723 he took up his post in Leipzig as Thomaskantor and kept this position until his death. His best-known works include the Brandenburg Concertos, the St Matthew Passion and the Christmas Oratorio. Bach had 20 children in total, most of whom died in childhood. He died in Leipzig on 28 July 1750.",
      ["Born in Eisenach in 1685.", "1708 Weimar, 1717 Köthen.", "From 1723 Thomaskantor in Leipzig."]],
    ["Wie viele Kinder hatte Johann Sebastian Bach insgesamt?", ["20", "8", "12", "5"], 0,
      "Bach hatte insgesamt 20 Kinder – neun Töchter und elf Söhne; die meisten starben schon im Kindesalter.",
      "How many children did Johann Sebastian Bach have in total?", ["20", "8", "12", "5"],
      "Bach had 20 children in total – nine daughters and eleven sons; most of them died in childhood."]),

  own("v-person-shakespeare", "culture", 10, ["Persönlichkeiten", "Literatur"], [wiki("William_Shakespeare")],
    ["William Shakespeare: Dichter der Weltliteratur", "Shakespeares Dramen gehören zu den bedeutendsten Werken der Weltliteratur.",
      "William Shakespeare wurde laut Kirchenregister am 26. April 1564 in Stratford-upon-Avon getauft; sein Geburtsdatum ist nicht überliefert. Im Alter von 18 Jahren heiratete er vermutlich 1582 Anne Hathaway. Als seine Truppe 1599 ihren Spielort in das neu errichtete Globe Theatre verlegte, wurde er dort Teilhaber. Das überlieferte Gesamtwerk umfasst um 38 Bühnenstücke, sechs Versdichtungen sowie 154 Sonette. 1623 erschienen seine dramatischen Werke in der First Folio. Shakespeare starb 1616 in Stratford-upon-Avon.",
      ["Getauft 1564 in Stratford-upon-Avon.", "1599: Teilhaber am neuen Globe Theatre.", "1623 erschien die First Folio mit seinen Dramen."]],
    ["William Shakespeare: a poet of world literature", "Shakespeare's dramas are among the most important works of world literature.",
      "According to the church register, William Shakespeare was baptised in Stratford-upon-Avon on 26 April 1564; his date of birth is not recorded. At the age of 18 he probably married Anne Hathaway in 1582. When his company moved to the newly built Globe Theatre in 1599, he became a shareholder there. His surviving works comprise about 38 plays, six narrative poems and 154 sonnets. In 1623 his dramatic works were published in the First Folio. Shakespeare died in Stratford-upon-Avon in 1616.",
      ["Baptised in Stratford-upon-Avon in 1564.", "1599: shareholder in the new Globe Theatre.", "1623: the First Folio of his plays appears."]],
    ["Mitbesitzer welches Londoner Theaters war Shakespeare?", ["Globe Theatre", "Royal Opera House", "Old Vic", "London Palladium"], 0,
      "Als Mitbesitzer des Londoner Globe Theatre war Shakespeare zunehmend als Dichter und Geschäftsmann erfolgreich.",
      "Shakespeare was a co-owner of which London theatre?", ["The Globe Theatre", "The Royal Opera House", "The Old Vic", "The London Palladium"],
      "As co-owner of the London Globe Theatre, Shakespeare became increasingly successful as a poet and businessman."]),

  own("v-person-gauss", "math", 10, ["Persönlichkeiten", "Mathematik"], [wiki("Carl_Friedrich_Gauß")],
    ["Carl Friedrich Gauß: Mathematiker und Astronom", "Wegen seiner überragenden Leistungen galt Gauß schon zu Lebzeiten als „Fürst der Mathematiker“.",
      "Carl Friedrich Gauß wurde am 30. April 1777 in Braunschweig geboren. Am 30. März 1796, einen Monat vor seinem neunzehnten Geburtstag, bewies er die Konstruierbarkeit des regelmäßigen Siebzehnecks. Mit der Methode der kleinsten Quadrate ermöglichte er 1801 die Wiederentdeckung des ersten Asteroiden Ceres. 1807 wurde er zum Universitätsprofessor und Sternwartendirektor in Göttingen berufen. Zusammen mit Wilhelm Eduard Weber erfand er als einer der Ersten die elektromagnetische Telegrafie. Gauß starb am 23. Februar 1855 in Göttingen.",
      ["Geboren 1777 in Braunschweig.", "1796 bewies er die Konstruierbarkeit des Siebzehnecks.", "1801 berechnete er die Bahn der Ceres, 1807 wurde er Professor."]],
    ["Carl Friedrich Gauss: mathematician and astronomer", "Because of his outstanding achievements, Gauss was already regarded in his lifetime as the \"Prince of Mathematicians\".",
      "Carl Friedrich Gauss was born in Braunschweig on 30 April 1777. On 30 March 1796, a month before his nineteenth birthday, he proved that the regular heptadecagon (17-gon) can be constructed. With the method of least squares he made the rediscovery of the first asteroid, Ceres, possible in 1801. In 1807 he was appointed university professor and director of the observatory in Göttingen. Together with Wilhelm Eduard Weber he was one of the first to invent electromagnetic telegraphy. Gauss died in Göttingen on 23 February 1855.",
      ["Born in Braunschweig in 1777.", "In 1796 he proved the 17-gon constructible.", "1801: orbit of Ceres; 1807: professor."]],
    ["Wessen Wiederentdeckung ermöglichte Gauß im Jahr 1801?", ["Des Asteroiden Ceres", "Des Planeten Neptun", "Des Halleyschen Kometen", "Des Mondes Titan"], 0,
      "Mit der Methode der kleinsten Quadrate ermöglichte Gauß 1801 die Wiederentdeckung des ersten Asteroiden Ceres.",
      "Whose rediscovery did Gauss make possible in 1801?", ["The asteroid Ceres", "The planet Neptune", "Halley's Comet", "The moon Titan"],
      "With the method of least squares, Gauss made the rediscovery of the first asteroid, Ceres, possible in 1801."]),

  own("v-person-franklin", "science", 10, ["Persönlichkeiten", "Biologie"], [wiki("Rosalind_Franklin")],
    ["Rosalind Franklin: ein Schlüssel zur DNA-Struktur", "Ihre Forschung bildete die Grundlage für die Entschlüsselung der DNA – doch Rosalind Franklin wurde dafür nicht gewürdigt.",
      "Rosalind Franklin wurde am 25. Juli 1920 in London geboren. Im Oktober 1938 begann sie in Cambridge ein Studium der Naturwissenschaften, das sie 1941 abschloss. 1950 kehrte sie nach London zurück, um am King's College London weiterzuforschen. Sie war Spezialistin für Röntgenstrukturanalyse; ihre mathematische Analyse der Röntgenbeugungsdiagramme der DNA war Voraussetzung zur Aufklärung der Doppelhelixstruktur. Ihr im April 1953 veröffentlichter Forschungsartikel bildete die Basis für den parallel erschienenen Artikel von James Watson und Francis Crick, die dafür 1962 den Nobelpreis erhielten. Franklin starb am 16. April 1958 im Alter von 37 Jahren.",
      ["Geboren 1920 in London.", "1938 Studium in Cambridge, ab 1950 am King's College.", "1953: ihr Artikel zur DNA erscheint."]],
    ["Rosalind Franklin: a key to the structure of DNA", "Her research formed the basis for deciphering DNA – yet Rosalind Franklin was never honoured for it.",
      "Rosalind Franklin was born in London on 25 July 1920. In October 1938 she began studying natural sciences in Cambridge, which she completed in 1941. In 1950 she returned to London to continue her research at King's College London. She was a specialist in X-ray crystallography; her mathematical analysis of the X-ray diffraction patterns of DNA was a prerequisite for working out the double-helix structure. Her research paper, published in April 1953, formed the basis for the paper by James Watson and Francis Crick that appeared at the same time; they received the Nobel Prize for it in 1962. Franklin died on 16 April 1958, aged 37.",
      ["Born in London in 1920.", "1938 studies in Cambridge, from 1950 at King's College.", "1953: her paper on DNA appears."]],
    ["Mit welcher Methode untersuchte Rosalind Franklin die DNA?", ["Röntgenbeugung", "Elektronenmikroskopie", "Chromatographie", "Massenspektrometrie"], 0,
      "Franklin war Spezialistin für Röntgenstrukturanalyse; ihr wichtigstes Ergebnis war die mathematische Analyse ihrer Röntgenbeugungsdiagramme der DNA.",
      "Which method did Rosalind Franklin use to study DNA?", ["X-ray diffraction", "Electron microscopy", "Chromatography", "Mass spectrometry"],
      "Franklin was a specialist in X-ray crystallography; her most important result was the mathematical analysis of her X-ray diffraction patterns of DNA."]),

  own("v-person-polo", "earth", 10, ["Persönlichkeiten", "Entdecker"], [wiki("Marco_Polo")],
    ["Marco Polo: Reisender zwischen Venedig und China", "Marco Polo wurde durch seinen Bericht über seinen mehr als zwei Jahrzehnte dauernden Aufenthalt in China bekannt.",
      "Marco Polo wurde 1254 in Venedig geboren. 1271 brachen sein Vater Niccolò und sein Onkel Maffeo wieder zur Reise auf und nahmen den siebzehnjährigen Marco mit. 1275 kamen sie in Shangdu an, wo Marco Polo Kublai Khan traf, den Großkhan der Mongolen. Die Rückreise nach Venedig begann 1291 im Hafen von Quanzhou; 1295 erreichten die Reisenden schließlich Venedig. Die größte Verbreitung seines Reiseberichts fand die lateinische Übersetzung, die allein in über 50 Handschriften erhalten ist. Marco Polo starb am 8. Januar 1324 in Venedig.",
      ["Geboren 1254 in Venedig.", "1271 brach er mit Vater und Onkel nach Asien auf.", "1275 traf er Kublai Khan, 1295 kehrte er heim."]],
    ["Marco Polo: a traveller between Venice and China", "Marco Polo became famous for his account of a stay in China lasting more than two decades.",
      "Marco Polo was born in Venice in 1254. In 1271 his father Niccolò and his uncle Maffeo set off again and took the seventeen-year-old Marco with them. In 1275 they arrived in Shangdu, where Marco Polo met Kublai Khan, the Great Khan of the Mongols. The return journey to Venice began in 1291 in the port of Quanzhou; in 1295 the travellers finally reached Venice. The Latin translation of his travel account was the most widely circulated and survives in more than 50 manuscripts alone. Marco Polo died in Venice on 8 January 1324.",
      ["Born in Venice in 1254.", "In 1271 he set off for Asia with his father and uncle.", "1275: met Kublai Khan; 1295: back home."]],
    ["Wie alt war Marco Polo, als er 1271 mit Vater und Onkel aufbrach?", ["17", "25", "12", "31"], 0,
      "Niccolò und Maffeo Polo nahmen 1271 den siebzehnjährigen Marco mit auf die Reise.",
      "How old was Marco Polo when he set off with his father and uncle in 1271?", ["17", "25", "12", "31"],
      "In 1271 Niccolò and Maffeo Polo took the seventeen-year-old Marco with them on the journey."]),
];

export const evidence = {
  "v-person-kopernikus": [
    "de|Nikolaus_Kopernikus|19. Februar 1473 in Thorn",
    "de|Nikolaus_Kopernikus|24. Mai 1543 in Frauenburg",
    "de|Nikolaus_Kopernikus|war ein Domherr des Fürstbistums Ermland in Preußen sowie Astronom und Arzt",
    "de|Nikolaus_Kopernikus|Die Rezeption des Werkes führte zu dem Umbruch, der als „kopernikanische Wende“ bezeichnet wird",
    "de|Nikolaus_Kopernikus|Von 1491 bis 1494 besuchte Kopernikus gemeinsam mit seinem Bruder Andreas die Universität Krakau, wo er die Sieben Freien Künste studierte",
    "de|Nikolaus_Kopernikus|zum Wintersemester 1496/1497 ein Studium beider Rechte begann",
    "de|Nikolaus_Kopernikus|In Bologna studierte Kopernikus neben Griechisch bei Urceus Codrus auch Astronomie",
    "de|Nikolaus_Kopernikus|In seinem Hauptwerk De revolutionibus orbium coelestium von 1543 beschreibt er ein heliozentrisches Weltbild, nach dem die Erde ein Planet sei, sich um ihre eigene Achse drehe und zudem wie die anderen Planeten um die Sonne bewege",
  ],
  "v-person-bach": [
    "de|Johann_Sebastian_Bach|31. März 1685greg. in Eisenach",
    "de|Johann_Sebastian_Bach|Nach dem Gregorianischen Kalender ist sein Geburtsdatum der 31. März",
    "de|Johann_Sebastian_Bach|28. Juli 1750 in Leipzig",
    "de|Johann_Sebastian_Bach|gilt Bach als der Inbegriff eines tiefgründigen und genialen Komponisten",
    "de|Johann_Sebastian_Bach|Bach übersiedelte in der ersten Julihälfte 1708 mit seiner schwangeren Gattin nach Weimar",
    "de|Johann_Sebastian_Bach|Als im folgenden Jahre der bisherige Hofkapellmeister Augustin Reinhard Stricker seinen Posten verließ, unterschrieb Bach bereits am 5. August 1717 den Vertrag als dessen Amtsnachfolger in Köthen",
    "de|Johann_Sebastian_Bach|Mit einer Amtseinführung am 30. Mai 1723 in der Nikolaikirche nahm Bach seinen Dienst in Leipzig als Thomaskantor auf; er sollte diese Stelle bis zu seinem Tod 1750 behalten",
    "de|Johann_Sebastian_Bach|die Brandenburgischen Konzerte, viele Kirchenkantaten, die Johannes-Passion, die Matthäus-Passion, das Weihnachtsoratorium",
    "de|Johann_Sebastian_Bach|Johann Sebastian Bach hatte insgesamt 20 Kinder – neun Töchter und elf Söhne",
    "de|Johann_Sebastian_Bach|von denen allerdings die meisten schon im Kindesalter starben",
  ],
  "v-person-shakespeare": [
    "de|William_Shakespeare|Laut Kirchenregister der Holy Trinity Church in Stratford-upon-Avon, Warwickshire, wurde er am 26. April 1564 getauft",
    "de|William_Shakespeare|Shakespeares Geburtsdatum ist nicht überliefert",
    "de|William_Shakespeare|gestorben am 23. Apriljul. / 3. Mai 1616greg. ebenda",
    "de|William_Shakespeare|dessen Dramen zu den bedeutendsten Werken der Weltliteratur gehören",
    "de|William_Shakespeare|Das überlieferte Gesamtwerk umfasst um 38 Bühnenstücke, sechs Versdichtungen sowie 154 Sonette",
    "de|William_Shakespeare|Im Alter von 18 Jahren heiratete er vermutlich am 30. November oder 1. Dezember 1582 Anne Hathaway",
    "de|William_Shakespeare|Als seine Truppe 1599 ihren Spielort in das neu errichtete Globe Theatre verlegte, überließ ihm James Burbage, dessen Familie das alte Globe Theatre besessen hatte, eine Teilhaberschaft von zunächst einem Zehntel",
    "de|William_Shakespeare|Als Mitbesitzer des Londoner Globe Theatre, das seine Truppe als Ersatz für das Theatre gebaut hatte, nachdem dessen Pachtvertrag abgelaufen war, war Shakespeare zunehmend als Dichter und Geschäftsmann erfolgreich",
    "de|William_Shakespeare|Theaterkollegen John Heminges und Henry Condell veröffentlichten 1623 seine dramatischen Werke unter dem Titel Mr William Shakespeare’s Comedies, Histories and Tragedies in einem großformatigen, als First Folio bezeichneten Band",
  ],
  "v-person-gauss": [
    "de|Carl_Friedrich_Gauß|30. April 1777 in Braunschweig",
    "de|Carl_Friedrich_Gauß|23. Februar 1855 in Göttingen",
    "de|Carl_Friedrich_Gauß|Wegen seiner überragenden wissenschaftlichen Leistungen galt er bereits zu seinen Lebzeiten als Princeps mathematicorum (Fürst der Mathematiker)",
    "de|Carl_Friedrich_Gauß|war ein deutscher Mathematiker, Statistiker, Astronom, Geodät, Elektrotechniker und Physiker",
    "de|Carl_Friedrich_Gauß|Am 30. März 1796, einen Monat vor seinem neunzehnten Geburtstag, bewies er die Konstruierbarkeit des regelmäßigen Siebzehnecks",
    "de|Carl_Friedrich_Gauß|Methode der kleinsten Quadrate), mit der er 1801 die Wiederentdeckung des ersten Asteroiden Ceres ermöglichte",
    "de|Carl_Friedrich_Gauß|dessen Wiederauffindung 1801 Gauß’ Bahnberechnung ermöglicht hatte",
    "de|Carl_Friedrich_Gauß|1807 wurde er zum Universitätsprofessor und Sternwartendirektor in Göttingen berufen",
    "de|Carl_Friedrich_Gauß|er erfand zusammen mit Wilhelm Eduard Weber als einer der Ersten elektromagnetische Telegrafie",
  ],
  "v-person-franklin": [
    "de|Rosalind_Franklin|geboren am 25. Juli 1920 in London; gestorben am 16. April 1958 ebenda",
    "de|Rosalind_Franklin|Franklin starb vier Jahre vor der Vergabe des Nobelpreises im Alter von 37 Jahren an einer Krebserkrankung",
    "de|Rosalind_Franklin|Franklin war Spezialistin für die Röntgenstrukturanalyse kristallisierter Makromoleküle",
    "de|Rosalind_Franklin|Ihr wichtigstes Forschungsergebnis war die mathematische Analyse ihrer Röntgenbeugungsdiagramme der Desoxyribonukleinsäure; sie war Voraussetzung zur Aufklärung der Doppelhelixstruktur der DNA",
    "de|Rosalind_Franklin|Ihr gemeinsam mit ihrem Doktoranden Raymond Gosling im April 1953 zu diesem Thema veröffentlichter Forschungsartikel bildete die Basis für den parallel erschienenen Artikel von James Watson und Francis Crick zur Struktur der DNA",
    "de|Rosalind_Franklin|Obwohl die Forschungsergebnisse von Franklin die Grundlage für die Entschlüsselung der DNA durch Watson und Crick bildeten, wofür die beiden 1962 den Nobelpreis erhielten, wurden weder Franklin noch Gosling für ihre Forschung gewürdigt",
    "de|Rosalind_Franklin|In Cambridge boten ihr beide Frauencolleges, Girton und Newnham, einen Studienplatz an",
    "de|Rosalind_Franklin|Rosalind Franklin entschied sich für Newnham und begann im Oktober 1938 ein Studium der Naturwissenschaften, das sie 1941 abschloss",
    "de|Rosalind_Franklin|1950 kehrte sie nach London zurück, um unter Leitung von John Turton Randall am King’s College London weiterzuforschen",
  ],
  "v-person-polo": [
    "de|Marco_Polo|* 1254 in Venedig; † 8. Januar 1324 ebenda",
    "de|Marco_Polo|durch seinen Bericht über seinen mehr als zwei Jahrzehnte dauernden Aufenthalt im Kaiserreich China bekannt wurde",
    "de|Marco_Polo|Noch vor dem Ende der Sedisvakanz brachen Niccolò und Maffeo Polo 1271 wieder auf und nahmen den siebzehnjährigen Marco mit",
    "de|Marco_Polo|In Akkon betrat dieser zum ersten Mal den Boden Asiens",
    "de|Marco_Polo|kam 1275 in Shangdu als ihrem eigentlichen Reiseziel an. Dort traf Marco Polo Kublai Khan, den Großkhan der Mongolen",
    "de|Marco_Polo|Die Rückreise nach Venedig begann 1291 im Hafen von Quanzhou",
    "de|Marco_Polo|1295 erreichten die Reisenden schließlich Venedig",
    "de|Marco_Polo|Die größte Verbreitung fand die lateinische Übersetzung des Dominikaners Francesco Pipino aus Bologna, die allein in über 50 Handschriften erhalten ist",
  ],
};

// keep the Remotion clip list in step with this batch
const clips = JSON.parse(fs.readFileSync(new URL("../../video/src/clips.json", import.meta.url), "utf8"));
for (const v of videos) if (!clips.some((c) => c.id === v.id)) throw new Error(`${v.id} is missing in video/src/clips.json`);
