// Content batch (19.10.2026): 6 more "did you know" facts, each checked against the linked articles on
// 19.10.2026. Left out because the sources did not state them: "octopus blood is blue" (only the name of
// hemocyanin means dark blue), the temperature of Earth's core, the speed of sound in water. AI-checked.
//   node content/_batches/2026-10-facts-4.mjs
import { pathToFileURL } from "node:url";
import { mergeFacts, wiki } from "../../scripts/content/merge-facts.mjs";

export const TODAY = "2026-10-19";
export const verification = "ai_checked";

export const facts = [
  ["f-steigbuegel", "body", "science", [wiki("Steigbügel_(Anatomie)")], "Der kleinste Knochen deines Körpers sitzt im Ohr und ist nur gut 3 Millimeter hoch.", "Der Steigbügel ist eines der drei Gehörknöchelchen im Mittelohr. Er wiegt 3 bis 4 Milligramm und hat seinen Namen von seiner Form.", "The smallest bone in your body sits in your ear and is just over 3 millimetres tall.", "The stirrup (stapes) is one of the three tiny bones in the middle ear. It weighs 3 to 4 milligrams and is named after its shape."],
  ["f-schnee-sechseck", "nature", "earth", [wiki("Schnee")], "Schneekristalle sind immer sechseckig aufgebaut.", "Wenn Wasserdampf direkt zu Eis wird, wachsen die Kristalle wegen der Struktur der Wassermoleküle nur in Winkeln von genau 60° oder 120° – daher die sechs Arme.", "Snow crystals are always built on a six-sided pattern.", "When water vapour turns straight into ice, the crystals can only grow at angles of exactly 60° or 120° because of the structure of water molecules – hence the six arms."],
  ["f-lichtjahr", "space", "science", [wiki("Lichtjahr")], "Ein Lichtjahr ist keine Zeit, sondern eine Strecke: rund 9,46 Billionen Kilometer.", "So weit kommt Licht im Vakuum in einem Jahr. Man nutzt die Einheit vor allem, um die riesigen Entfernungen zwischen Sternen anschaulich zu machen.", "A light-year is not a time but a distance: about 9.46 trillion kilometres.", "That is how far light travels in a vacuum in one year. The unit is mainly used to make the huge distances between stars easier to grasp."],
  ["f-erdrotation", "space", "science", [wiki("Erdrotation")], "Am Äquator rast du mit etwa 1670 km/h nach Osten – ohne es zu merken.", "So schnell bewegt sich die Erdoberfläche dort durch die Drehung der Erde. Zu den Polen hin wird es langsamer, weil die Breitenkreise kürzer werden.", "At the equator you are racing east at about 1,670 km/h – without noticing.", "That is how fast Earth's surface moves there as the planet turns. Towards the poles it gets slower because the circles of latitude get shorter."],
  ["f-diamant-graphit", "nature", "science", [wiki("Diamant"), wiki("Graphit")], "Diamant und Graphit – das Grau im Bleistift – bestehen beide aus reinem Kohlenstoff.", "Beim Diamanten sitzen die Kohlenstoffatome in einem kubischen Kristall, beim Graphit in einem sechseckigen. Graphit reibt sich leicht ab – deshalb schreibt der Bleistift.", "Diamond and graphite – the grey in a pencil – are both pure carbon.", "In diamond the carbon atoms sit in a cubic crystal, in graphite in a hexagonal one. Graphite rubs off easily – that is why a pencil writes."],
  ["f-kupferblut", "animals", "earth", [wiki("Hämocyanin")], "Tintenfische, Schnecken und Krebse transportieren Sauerstoff mit Kupfer statt mit Eisen.", "Ihr Blutfarbstoff heißt Hämocyanin – nach dem griechischen Wort für „dunkelblau“. Unser rotes Hämoglobin bindet den Sauerstoff dagegen mit Eisen.", "Squid, snails and crabs carry oxygen with copper instead of iron.", "Their blood pigment is called hemocyanin – from the Greek word for “dark blue”. Our red haemoglobin binds oxygen with iron instead."],
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeFacts(facts, { today: TODAY, verification });
