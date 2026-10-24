// Content batch (24.10.2026): how a price comes about at the stock exchange (3D scene "orderbook"). Every statement is
// taken from the linked articles, word-for-word evidence below. No investment advice – only how trading works. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-economy-1.mjs   → the question
//   node content/_batches/2026-10-animations-economy-1.mjs                                   → the animation (idempotent)
//
// Evidence (de.wikipedia.org):
//   Börse: "Die Börse führt Angebot und Nachfrage – vermittelt durch Börsenmakler oder Skontroführer (während festgelegter
//     Handelszeiten) – zusammen" · "Zu einer Kauforder muss also eine entsprechende Verkaufsorder oder umgekehrt vorliegen" ·
//     "Die Feststellung der Kurse oder Preise der gehandelten Objekte richtet sich laufend nach Angebot und Nachfrage."
//   Orderbuch: "eine nach Preis und Eingangszeitpunkt geordnete Liste aller zu einem bestimmten Wertpapier vorliegenden
//     Wertpapierorders" · "der Börsenkurs heute meist elektronisch ermittelt wird und die ausführbaren Orders automatisch zur
//     Ausführung kommen" · "Ein Limitkontrollsystem überwacht permanent die im Orderbuch vorhandenen Limite auf Ausführbarkeit."
//   Geldkurs: "ein Börsenkurs, den ein Käufer maximal bereit ist, für ein bestimmtes Wertpapier (Aktie, Anleihe) gegen Geld zu
//     bezahlen" · "In Höhe des Geldkurses ist an der Wertpapierbörse kein Börsenumsatz zustande gekommen, denn vorhandene
//     Verkaufsorders waren höher limitiert als der Geldkurs."
//   Briefkurs: "ein Börsenkurs, den ein Verkäufer mindestens erzielen will"
//   Marktpreis: "Entsprechend wird bei einem Überangebot der Preis hin zum Gleichgewichtspreis sinken, bei Übernachfrage
//     entsprechend steigen."
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-24";
export const verification = "ai_checked";

export const questions = [
  ["qa-boerse", "economy", 1, 10, null, "Wo stehen an der Börse alle Kauf- und Verkaufsaufträge zu einem Wertpapier?", ["Im Orderbuch", "Im Grundbuch", "In der Bilanz", "Im Kassenbuch"], 0, "Das Orderbuch ist eine nach Preis und Eingangszeitpunkt geordnete Liste aller Aufträge zu einem Wertpapier. Es ist die Grundlage dafür, wie der Börsenkurs ermittelt wird.", "Orderbuch", "Where are all the buy and sell orders for a security listed at the stock exchange?", ["In the order book", "In the land register", "In the balance sheet", "In the cash book"], "The order book is a list of all orders for a security, sorted by price and time of arrival. It is the basis on which the stock exchange price is worked out.", ["Börse", "Geld"]],
];

const animations = [
  {
    id: "a-boerse", scene: "orderbook", category: "economy", timing: [0.7, 1], sources: [wiki("Börse"), wiki("Orderbuch"), wiki("Geldkurs"), wiki("Briefkurs"), wiki("Marktpreis")], quiz: "qa-boerse", predict: [3, 0],
    de: {
      title: "Wie an der Börse ein Preis entsteht", summary: "Kaufaufträge treffen auf Verkaufsaufträge – und daraus ergibt sich der Preis.",
      goal: "Du kannst erklären, was im Orderbuch steht, wann ein Geschäft zustande kommt und warum der Preis steigt oder sinkt.",
      labels: ["Kaufaufträge", "Verkaufsaufträge", "Orderbuch", "Höchstens so viel will der Käufer zahlen", "Mindestens so viel will der Verkäufer", "Lücke: kein Geschäft", "Passt – Geschäft!", "Mehr Nachfrage: Preis steigt", "Preis"],
      steps: [
        ["An der Börse treffen Angebot und Nachfrage zusammen. Alle Aufträge zu einem Wertpapier stehen im Orderbuch, geordnet nach Preis und Eingangszeitpunkt: links die Kaufaufträge, rechts die Verkaufsaufträge.", 9],
        ["Jeder Käufer nennt den Preis, den er höchstens zahlen will, jeder Verkäufer den Preis, den er mindestens erzielen will. Solange alle Verkäufer mehr verlangen, als die Käufer bieten, kommt kein Geschäft zustande.", 10],
        ["Ein Geschäft kommt zustande, wenn zu einem Kaufauftrag ein passender Verkaufsauftrag vorliegt. Ein elektronisches System prüft die Aufträge ständig und führt passende automatisch aus.", 9],
        ["Der Preis richtet sich laufend nach Angebot und Nachfrage. Wollen mehr Menschen kaufen, als Angebote da sind, steigt er; gibt es mehr Angebot als Nachfrage, sinkt er.", 10],
      ],
      predict: ["Plötzlich kommen viele neue Kaufaufträge, aber kaum neue Verkaufsaufträge. Was passiert mit dem Preis?", "Er steigt", "Er sinkt", "Er bleibt genau gleich"],
    },
    en: {
      title: "How a price comes about at the stock exchange", summary: "Buy orders meet sell orders – and the price follows from that.",
      goal: "You can explain what is in the order book, when a trade takes place and why the price rises or falls.",
      labels: ["Buy orders", "Sell orders", "Order book", "The buyer will pay at most this much", "The seller wants at least this much", "Gap: no trade", "A match – trade!", "More demand: the price rises", "Price"],
      steps: [
        "At the stock exchange supply and demand meet. All orders for a security are listed in the order book, sorted by price and time of arrival: buy orders on the left, sell orders on the right.",
        "Every buyer names the price they will pay at most, every seller the price they want at least. As long as all sellers ask for more than the buyers offer, no trade takes place.",
        "A trade takes place when a buy order meets a matching sell order. An electronic system checks the orders all the time and carries out matching ones automatically.",
        "The price follows supply and demand all the time. If more people want to buy than there are offers, it rises; if there is more supply than demand, it falls.",
      ],
      predict: ["Suddenly many new buy orders arrive, but hardly any new sell orders. What happens to the price?", "It rises", "It falls", "It stays exactly the same"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
