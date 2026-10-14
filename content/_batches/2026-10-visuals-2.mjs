// Two more interactive visualisations (14.10.2026): speed of sound (bars, real data) and milestones of technology (timeline, real data).
//   node content/_batches/2026-10-visuals-2.mjs      (idempotent; rewrites content/visuals.json)
import fs from "node:fs";

const W = (title, name = title.replaceAll("_", " ")) => ({ name: "Wikipedia: " + name, url: "https://de.wikipedia.org/wiki/" + title });

const visuals = [
  {
    id: "v-schall",
    type: "bars",
    category_id: "science",
    min_age: 10,
    difficulty: 1,
    data_kind: "real",
    // values as given in the German Wikipedia article "Schallgeschwindigkeit" (retrieved 14.10.2026), longitudinal waves
    config: {
      unit: "m/s",
      baseline: "air",
      items: [
        { key: "co2", value: 266 },
        { key: "air", value: 343 },
        { key: "helium", value: 981 },
        { key: "water", value: 1484 },
        { key: "wood", value: 3300 },
        { key: "ice", value: 3884 },
        { key: "steel", value: 5920 },
      ],
    },
    title: "Wie schnell ist Schall?",
    goal: "Du kannst einschätzen, wie schnell sich Schall in Gasen, Flüssigkeiten und festen Stoffen ausbreitet, und mit der Schallgeschwindigkeit in Luft eine Entfernung berechnen.",
    intro: "Schall ist eine Welle, die von Teilchen zu Teilchen weitergegeben wird. Wie schnell das geht, hängt vom Stoff ab. Tippe einen Balken an und schalte auf den Vergleich mit Luft um.",
    note: "Echte Messwerte für Längswellen aus der genannten Quelle: Gase bei 20 °C und Normaldruck, Wasser bei 20 °C, Eis bei −16 °C, Holz: Buche. Die Werte hängen von Temperatur, Druck und genauer Zusammensetzung ab; für Stahl nennt die Quelle je nach Sorte 5.850 bis 5.920 m/s.",
    labels: { co2: "Kohlendioxid", air: "Luft", helium: "Helium", water: "Wasser", wood: "Holz (Buche)", ice: "Eis", steel: "Stahl", relative: "× so schnell wie in Luft", sort: "nach Tempo sortieren", relativeHead: "im Vergleich zu Luft", pick: "Tippe einen Balken an.", detail: "{name}: {value} – {times}-mal so schnell wie in Luft." },
    explain: "Schall läuft umso schneller, je steifer ein Stoff im Verhältnis zu seiner Dichte ist. Flüssigkeiten und feste Stoffe lassen sich kaum zusammendrücken – ein Stoß wird sofort weitergegeben. In Gasen sind die Teilchen weit voneinander entfernt. Im leichten Helium sind sie schneller unterwegs als in Luft, im schweren Kohlendioxid langsamer.",
    predict: { question: "Wie viel schneller breitet sich Schall in Wasser aus als in Luft?", options: ["Etwa gleich schnell", "Gut viermal so schnell", "Etwa zwanzigmal so schnell"], feedback: "Gut viermal so schnell: 1.484 gegen 343 Meter pro Sekunde. Wale können sich deshalb über große Entfernungen verständigen." },
    predict_correct: 1,
    apply: "Bei einem Gewitter siehst du den Blitz und zählst sechs Sekunden bis zum Donner. Wie weit ist das Gewitter ungefähr entfernt? Rechne mit dem Wert für Luft.",
    sources: [W("Schallgeschwindigkeit")],
    links: [{ kind: "animation", id: "a-gewitter" }],
    verification_status: "ai_checked",
    status: "published",
    translations: {
      en: {
        title: "How fast is sound?",
        goal: "You can estimate how fast sound travels in gases, liquids and solids, and use the speed of sound in air to work out a distance.",
        intro: "Sound is a wave passed on from particle to particle. How fast that happens depends on the material. Tap a bar and switch to the comparison with air.",
        note: "Real measured values for longitudinal waves from the source named: gases at 20 °C and normal pressure, water at 20 °C, ice at −16 °C, wood: beech. The values depend on temperature, pressure and exact composition; for steel the source gives 5,850 to 5,920 m/s depending on the grade.",
        labels: { co2: "Carbon dioxide", air: "Air", helium: "Helium", water: "Water", wood: "Wood (beech)", ice: "Ice", steel: "Steel", relative: "× as fast as in air", sort: "sort by speed", relativeHead: "compared with air", pick: "Tap a bar.", detail: "{name}: {value} – {times} times as fast as in air." },
        explain: "Sound travels the faster, the stiffer a material is in relation to its density. Liquids and solids can hardly be compressed – a push is passed on at once. In gases the particles are far apart. In light helium they move faster than in air, in heavy carbon dioxide more slowly.",
        predict: { question: "How much faster does sound travel in water than in air?", options: ["About as fast", "A little over four times as fast", "About twenty times as fast"], feedback: "A little over four times as fast: 1,484 against 343 metres per second. That is why whales can communicate over great distances." },
        apply: "In a thunderstorm you see the lightning and count six seconds until the thunder. Roughly how far away is the storm? Use the value for air.",
      },
    },
  },
  {
    id: "v-technik-zeitleiste",
    type: "timeline",
    category_id: "history",
    min_age: 10,
    difficulty: 1,
    data_kind: "real",
    config: {
      from: 1400,
      to: 2030,
      items: [
        { key: "print", year: 1450 },
        { key: "steam", year: 1769 },
        { key: "rail", year: 1825 },
        { key: "phone", year: 1876 },
        { key: "bulb", year: 1879 },
        { key: "flight", year: 1903 },
        { key: "moon", year: 1969, late: true },
        { key: "web", year: 1991 },
        { key: "smartphone", year: 2007 },
      ],
    },
    title: "Technik-Meilensteine: Wie schnell sich die Welt verändert",
    goal: "Du kannst wichtige Meilensteine der Technik zeitlich einordnen und erklären, warum eine maßstabsgetreue Zeitleiste mehr zeigt als eine mit gleichen Abständen.",
    intro: "Neun Meilensteine aus fast 600 Jahren. Tippe einen an, blende die Abstände ein – und schalte dann auf gleiche Abstände um.",
    note: "Jahreszahlen nach den verlinkten Artikeln. „Buchdruck um 1450“ ist eine ungefähre Angabe. Erfindungen haben fast immer Vorläufer; genannt ist jeweils ein bekannter Meilenstein: Watts Patent für die verbesserte Dampfmaschine, die erste öffentliche Eisenbahn mit Dampflok, Bells Telefon-Patent, Edisons Glühlampe, der erste Motorflug, die erste Mondlandung, die Freigabe des World Wide Web, das erste iPhone.",
    labels: { print: "Buchdruck mit beweglichen Lettern", steam: "Dampfmaschine von James Watt", rail: "Erste öffentliche Eisenbahn", phone: "Telefon", bulb: "Glühlampe von Edison", flight: "Erster Motorflug", moon: "Mondlandung", web: "World Wide Web", smartphone: "Smartphone (iPhone)", toScale: "maßstabsgetreu", even: "gleiche Abstände", showGaps: "Jahre dazwischen zeigen", year: "Jahr", gapHead: "Jahre seit dem vorigen", pick: "Tippe einen Meilenstein an.", detail: "{name}: {year}" },
    explain: "Maßstabsgetreu sieht man, wie sich die Ereignisse zur Gegenwart hin drängen: Zwischen Buchdruck und Dampfmaschine liegen über 300 Jahre, zwischen World Wide Web und Smartphone nur 16. Jede Erfindung baut auf früheren auf – deshalb geht es immer schneller. Mit gleichen Abständen verschwindet genau das. Eine Zeitleiste ohne Maßstab kann also in die Irre führen.",
    predict: { question: "Wie viele Jahre liegen zwischen dem ersten Motorflug und der ersten Mondlandung?", options: ["26 Jahre", "66 Jahre", "126 Jahre"], feedback: "66 Jahre: 1903 flogen die Brüder Wright zwölf Sekunden, 1969 landeten Menschen auf dem Mond. Die Mondlandung ist jetzt eingetragen." },
    predict_correct: 1,
    apply: "Blende die Jahre dazwischen ein. Wo ist die größte Lücke, wo die kleinste? Und was passiert mit dem Eindruck, wenn du auf gleiche Abstände umschaltest?",
    sources: [W("Buchdruck"), W("Dampfmaschine"), W("Stockton_and_Darlington_Railway"), W("Telefon"), W("Glühlampe"), W("Brüder_Wright"), W("Apollo_11"), W("World_Wide_Web"), W("IPhone_(1._Generation)", "iPhone (1. Generation)")],
    links: [{ kind: "question", id: "h6" }],
    verification_status: "ai_checked",
    status: "published",
    translations: {
      en: {
        title: "Milestones of technology: how fast the world changes",
        goal: "You can place important milestones of technology in time and explain why a timeline drawn to scale shows more than one with equal spacing.",
        intro: "Nine milestones from almost 600 years. Tap one, show the gaps – then switch to equal spacing.",
        note: "Years according to the linked articles. “Printing around 1450” is an approximate date. Inventions almost always have forerunners; each entry is a well-known milestone: Watt's patent for the improved steam engine, the first public railway with a steam locomotive, Bell's telephone patent, Edison's light bulb, the first powered flight, the first Moon landing, the release of the World Wide Web, the first iPhone.",
        labels: { print: "Printing with movable type", steam: "James Watt's steam engine", rail: "First public railway", phone: "Telephone", bulb: "Edison's light bulb", flight: "First powered flight", moon: "Moon landing", web: "World Wide Web", smartphone: "Smartphone (iPhone)", toScale: "to scale", even: "equal spacing", showGaps: "show years in between", year: "Year", gapHead: "years since the previous one", pick: "Tap a milestone.", detail: "{name}: {year}" },
        explain: "Drawn to scale, you can see the events crowding towards the present: more than 300 years lie between printing and the steam engine, only 16 between the World Wide Web and the smartphone. Every invention builds on earlier ones – which is why things move ever faster. With equal spacing exactly that disappears. A timeline without a scale can therefore be misleading.",
        predict: { question: "How many years lie between the first powered flight and the first Moon landing?", options: ["26 years", "66 years", "126 years"], feedback: "66 years: in 1903 the Wright brothers flew for twelve seconds, in 1969 people landed on the Moon. The Moon landing is now on the timeline." },
        apply: "Show the years in between. Where is the biggest gap, where the smallest? And what happens to the impression when you switch to equal spacing?",
      },
    },
  },
];

const file = "content/visuals.json";
const list = JSON.parse(fs.readFileSync(file, "utf8"));
for (const v of visuals) {
  const i = list.findIndex((x) => x.id === v.id);
  if (i >= 0) list[i] = v;
  else list.push(v);
}
fs.writeFileSync(file, JSON.stringify(list, null, 2) + "\n");
console.log(`${visuals.length} visualisations merged; ${list.length} in total.`);
