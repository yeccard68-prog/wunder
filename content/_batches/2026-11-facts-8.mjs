// Content batch (21.11.2026): 4 facts for thin topics (art, history, math), routine format:
// every claim has a word-for-word quote from the linked article, checked by scripts/content/verify-evidence.mjs.
// Dropped in review: didgeridoo, perfect number 28, concert pitch 440 Hz – each gave away the answer of an existing question.
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-facts-8.mjs && node content/_batches/2026-11-facts-8.mjs
import { pathToFileURL } from "node:url";
import { mergeFacts, wiki } from "../../scripts/content/merge-facts.mjs";

export const TODAY = "2026-11-21";
export const verification = "ai_checked";

export const facts = [
  ["f-antikythera", "history", "history", [wiki("Mechanismus_von_Antikythera")], "1900 holten Schwammtaucher aus einem Schiffswrack ein antikes Gerät mit Zahnrädern, das astronomische Zusammenhänge anzeigte.", "Das Wrack lag vor der griechischen Insel Antikythera; Münzen datieren den Untergang auf 70 bis 60 v. Chr. Der Forscher Price nannte das Gerät einen „Computer“. Heute sind 82 Fragmente erhalten, sie liegen in Athen.", "In 1900 sponge divers recovered an ancient gear-driven device from a shipwreck that displayed astronomical relationships.", "The wreck lay off the Greek island of Antikythera; coins date the sinking to 70 to 60 BC. The researcher Price called the device a “computer”. 82 fragments survive today and are kept in Athens."],
  ["f-mona-lisa-name", "language", "art", [wiki("Mona_Lisa")], "„Mona“ in „Mona Lisa“ ist gar kein Vorname.", "Mona geht auf die italienische Kurzform Monna für Madonna („Frau“) zurück. Auf Italienisch heißt das Bild La Gioconda, „die Heitere“.", "“Mona” in “Mona Lisa” is not a first name at all.", "Mona derives from the Italian short form Monna for Madonna (“lady”). In Italian the painting is called La Gioconda, “the cheerful one”."],
  ["f-fountain", "culture", "art", [wiki("Fountain_(Duchamp)")], "Ein Urinal gilt als Schlüsselwerk der modernen Kunst – und das Original ist verschollen.", "Fountain, ein Ready-made von 1917, wird Marcel Duchamp zugeschrieben. Es war ein Urinal aus dem Sanitärgeschäft, signiert mit „R. Mutt“. Vom Original existiert nur ein Foto.", "A urinal counts as a key work of modern art – and the original is lost.", "Fountain, a readymade from 1917, is attributed to Marcel Duchamp. It was a store-bought urinal signed “R. Mutt”. Only a photograph of the original exists."],
  ["f-null-indien", "numbers", "math", [wiki("Null")], "Unser Zehnersystem mit der Null entstand in Indien.", "Zwischen 300 v. Chr. und 600 n. Chr. entwickelte sich dort das dezimale Stellenwertsystem mit der 0 und den Zeichen 1 bis 9. Ein Lückenzeichen für die Null wurde darin unentbehrlich.", "Our decimal system with the zero arose in India.", "Between 300 BC and 600 AD the decimal place-value system with 0 and the digits 1 to 9 developed there. A gap symbol for zero became indispensable in it."],
];

export const evidence = {
  "f-antikythera": ["de|Mechanismus_von_Antikythera|Es wurde im Jahr 1900 von Schwammtauchern", "de|Mechanismus_von_Antikythera|in einem Schiffswrack vor der griechischen Insel Antikythera", "de|Mechanismus_von_Antikythera|mit Hilfe von Zahnrädern und Zifferblättern astronomisch-kalendarische Zusammenhänge zeigte", "de|Mechanismus_von_Antikythera|Die Münzen erlaubten eine Datierung des Schiffuntergangs auf den Zeitraum von 70 bis 60 v. Chr.", "de|Mechanismus_von_Antikythera|Price untersuchte den Mechanismus erstmals umfassend und nannte ihn in seinem Bericht einen „Computer“", "de|Mechanismus_von_Antikythera|Seine 82 Fragmente befinden sich im Archäologischen Nationalmuseum in Athen"],
  "f-mona-lisa-name": ["de|Mona_Lisa|Mona leitet sich von der italienischen Kurzform Monna (für Madonna ‚Frau‘) ab, und ist demnach also kein Vorname", "de|Mona_Lisa|La Gioconda (‚die Heitere‘)"],
  "f-fountain": ["de|Fountain_(Duchamp)|zählt zu den Schlüsselwerken der modernen Kunst", "de|Fountain_(Duchamp)|Das Original von 1917, von dem lediglich ein Fotodokument existiert, ist verschollen", "de|Fountain_(Duchamp)|ist ein Ready-made aus dem Jahr 1917, das Marcel Duchamp zugeschrieben wird", "de|Fountain_(Duchamp)|Das Objekt, ein mit „R. Mutt“ signiertes handelsübliches Urinal aus einem Sanitärgeschäft"],
  "f-null-indien": ["de|Null|entstand zwischen 300 v. Chr. und 600 n. Chr. in Indien das dezimale Stellenwertsystem mit 0 und Zahlzeichen für 1, …, 9", "de|Null|wurde ein Lückenzeichen für die Null im dezimalen Stellenwertsystem unentbehrlich"],
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeFacts(facts, { today: TODAY, verification });
