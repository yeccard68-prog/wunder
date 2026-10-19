// Content batch (19.10.2026): first batch in the routine format (docs/CONTENT-ROUTINE.md) – 6 facts for the
// thinnest topics (business, language, culture, technology). Every claim has a word-for-word quote from the
// linked article in `evidence`, checked by scripts/content/verify-evidence.mjs. AI-checked.
//   node scripts/content/verify-evidence.mjs content/_batches/2026-10-facts-6.mjs && node content/_batches/2026-10-facts-6.mjs
import { pathToFileURL } from "node:url";
import { mergeFacts, wiki } from "../../scripts/content/merge-facts.mjs";

export const TODAY = "2026-10-19";
export const verification = "ai_checked";

export const facts = [
  ["f-ikea-name", "curious", "business", [wiki("IKEA")], "IKEA ist eine Abkürzung – aus dem Namen des Gründers und zwei Ortsnamen.", "Die Buchstaben stehen für Ingvar Kamprad, Elmtaryd und Agunnaryd. Kamprad gründete das Unternehmen 1943 in Schweden.", "IKEA is an acronym – made of the founder's name and two place names.", "The letters stand for Ingvar Kamprad, Elmtaryd and Agunnaryd. Kamprad founded the company in Sweden in 1943."],
  ["f-lego-name", "curious", "business", [wiki("Lego")], "Der Name Lego kommt aus dem Dänischen und heißt „spiel gut“.", "Er leitet sich von „leg godt“ ab und wird seit 1934 verwendet.", "The name Lego comes from Danish and means “play well”.", "It is derived from “leg godt” and has been used since 1934."],
  ["f-nokia-papier", "curious", "business", [wiki("Nokia")], "Nokia hat als Papierhersteller angefangen.", "Fredrik Idestam gründete das Unternehmen 1865 in Tampere in Finnland; anfangs stellte es Papiererzeugnisse her. Den Namen hat es von der Stadt Nokia, wo 1868 ein zweites Werk eröffnete.", "Nokia started out as a paper maker.", "Fredrik Idestam founded the company in Tampere, Finland, in 1865; at first it made paper products. It takes its name from the town of Nokia, where a second mill opened in 1868."],
  ["f-roboter-wort", "language", "language", [wiki("Roboter")], "Das Wort „Roboter“ kommt aus dem Tschechischen und bedeutete ursprünglich Zwangsarbeit.", "Es geht auf das tschechische Wort „robota“ zurück, das man mit „Frondienst“ oder „Zwangsarbeit“ übersetzen kann.", "The word “robot” comes from Czech and originally meant forced labour.", "It goes back to the Czech word “robota”, which can be translated as “corvée” or “forced labour”."],
  ["f-freiheitsstatue", "culture", "culture", [wiki("Freiheitsstatue")], "Die Freiheitsstatue in New York ist ein Geschenk Frankreichs.", "Sie steht auf Liberty Island im New Yorker Hafen und wurde am 28. Oktober 1886 eingeweiht. Seit 1984 ist sie UNESCO-Weltkulturerbe.", "The Statue of Liberty in New York is a gift from France.", "It stands on Liberty Island in New York Harbor and was dedicated on 28 October 1886. It has been a UNESCO World Heritage Site since 1984."],
  ["f-sms-1992", "tech", "technology", [wiki("Short_Message_Service")], "Die SMS wurde 1992 entwickelt – und 2012 so viel genutzt wie nie.", "Danach wurde sie rasch von Messengern wie WhatsApp abgelöst. Ihr Nachfolger als Standard heißt RCS (Rich Communication Services).", "Text messaging (SMS) was developed in 1992 – and used most in 2012.", "After that it was quickly replaced by messengers such as WhatsApp. Its successor standard is called RCS (Rich Communication Services)."],
];

// word-for-word quotes from the linked articles, one per claim (checked by verify-evidence.mjs)
export const evidence = {
  "f-ikea-name": ["de|IKEA|Abkürzung für Ingvar Kamprad Elmtaryd Agunnaryd", "de|IKEA|wurde 1943 von Ingvar Kamprad in Schweden gegründet"],
  "f-lego-name": ["de|Lego|Das Wort Lego leitet sich von dänisch leg godt („spiel gut“) ab und wird seit 1934 verwendet"],
  "f-nokia-papier": ["de|Nokia|wurde 1865 von dem Ingenieur Fredrik Idestam", "de|Nokia|in Tampere im Südwesten Finnlands gegründet und stellte anfangs Papiererzeugnisse her", "de|Nokia|1868 eröffnete Idestam ein Zweitwerk in der unweit westlich gelegenen Stadt Nokia"],
  "f-roboter-wort": ["de|Roboter|Der Ursprung des Wortes Roboter liegt im tschechischen Wort robota", "de|Roboter|mit ‚Frondienst‘ oder ‚Zwangsarbeit‘ übersetzt werden kann"],
  "f-freiheitsstatue": ["de|Freiheitsstatue|Sie steht auf Liberty Island im New Yorker Hafen, wurde am 28. Oktober 1886 eingeweiht und ist ein Geschenk Frankreichs", "de|Freiheitsstatue|seit 1984 als Weltkulturerbe der UNESCO"],
  "f-sms-1992": ["de|Short_Message_Service|1992 entwickelt, wurde SMS 2012 am meisten genutzt und wurde dann rasch durch Instant-Messaging-Dienste wie WhatsApp ersetzt", "de|Short_Message_Service|Der Nachfolger von SMS und MMS ist der Standard Rich Communication Services (RCS)"],
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeFacts(facts, { today: TODAY, verification });
