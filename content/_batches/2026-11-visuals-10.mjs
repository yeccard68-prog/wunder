// „Blick ins Innere“, two more (05.11.2026): a long bone and a leaf – own drawings (components/viz/reveal/scenes.tsx),
// every label and figure backed by the quotes in `evidence` (German Wikipedia, checked word for word).
//   node content/_batches/2026-11-visuals-10.mjs      (idempotent; rewrites content/visuals.json)
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const W = (title, name = title.replaceAll("_", " ")) => ({ name: "Wikipedia: " + name, url: "https://de.wikipedia.org/wiki/" + title });

export const evidence = {
  "v-knochen-innen": [
    "de|Knochen|Röhrenknochen (lange Knochen, Ossa longa): Oberarmknochen (Humerus), Elle (Ulna) und Speiche (Radius), Oberschenkelknochen (Femur)",
    "de|Knochen|Der Knochen wird von einer Bindegewebshaut umgeben, der äußeren Knochenhaut (Periost), die ihm eng anliegt.",
    "de|Knochen|An Gelenkflächen ist der Knochen mit Knorpel überzogen, das Periost ist hier unterbrochen.",
    "de|Knochen|Dieses bildet an der Außenfläche des Knochens die Substantia corticalis (im Mittelteil von Röhrenknochen ist diese sehr dick und wird deshalb auch als Substantia compacta bezeichnet) und im Inneren die Substantia spongiosa, ein schwammartiges Gerüstwerk feiner Knochenbälkchen (Trabekel), die stets so angeordnet sind, dass sie nur auf Druck oder nur auf Zug belastet werden.",
    "de|Knochen|Im Schaft von Röhrenknochen ist eine Markhöhle (Cavitas medullaris) ausgebildet.",
    "de|Knochen|In der Markhöhle und in den Zwischenräumen der Spongiosa befindet sich das Knochenmark (Medulla ossium), das im Laufe des Lebens allmählich durch gelbes Fettmark ersetzt wird.",
    "de|Knochen|Außerdem bilden sich im roten Knochenmark die roten Blutkörperchen, die Blutplättchen und die weißen Blutkörperchen.",
    "de|Knochenmark|Während beim Säugling das rote Knochenmark überall im Knochen zu finden ist, konzentriert sich beim Erwachsenen das rote Knochenmark auf die platten und kurzen Knochen.",
    "de|Knochenmark|Im Schaft der langen Knochen (Diaphyse) wird das rote Knochenmark mit zunehmendem Alter durch Fettmark ersetzt.",
  ],
  "v-blatt-innen": [
    "de|Blatt (Pflanze)|Für alle Blätter charakteristisch sind die Elemente Epidermis, Mesophyll und Leitbündel.",
    "de|Blatt (Pflanze)|Das Blatt schließt nach außen mit einem Abschlussgewebe, der Epidermis, ab, die aus nur einer Zellschicht besteht.",
    "de|Blatt (Pflanze)|Die Epidermis besitzt nach außen eine wasserundurchlässige Wachsschicht Cuticula, die eine unregulierte Verdunstung verhindert.",
    "de|Blatt (Pflanze)|Die Zellen der Epidermis besitzen in der Regel keine Chloroplasten (die Zellbestandteile, in denen die Photosynthese stattfindet).",
    "de|Blatt (Pflanze)|Es ist meist in das unter der oberen Epidermis gelegene Palisadenparenchym und das darunter gelegene Schwammparenchym gegliedert.",
    "de|Blatt (Pflanze)|Das Palisadenparenchym besteht aus ein bis drei Lagen langgestreckter, senkrecht zur Blattoberfläche stehender, chloroplastenreicher Zellen.",
    "de|Blatt (Pflanze)|Im Palisadenparenchym, dessen Hauptaufgabe die Photosynthese ist, befinden sich rund 80 Prozent aller Chloroplasten.",
    "de|Blatt (Pflanze)|Das Schwammparenchym besteht aus unregelmäßig geformten Zellen, die aufgrund ihrer Form große Interzellularräume bilden.",
    "de|Blatt (Pflanze)|Die Hauptaufgabe des Schwammparenchyms ist es, die Durchlüftung des parenchymatischen Gewebes zu gewährleisten.",
    "de|Blatt (Pflanze)|Die Leitbündel befinden sich oft an der Grenze zwischen Palisaden- und Schwammparenchym im oberen Schwammparenchym.",
    "de|Blatt (Pflanze)|Die Funktion der Leitbündel ist der Antransport von Wasser und Mineralien ins Blatt (über das Xylem) sowie der Abtransport von Photosyntheseprodukten aus dem Blatt (über das Phloem).",
    "de|Blatt (Pflanze)|Dadurch weist das Xylem zur Blattoberseite, das Phloem zur Blattunterseite.",
    "de|Blatt (Pflanze)|Die Leitbündel werden volkstümlich meist als Nerven oder Adern bezeichnet, beides missverständliche Begriffe, da die Leitbündel weder eine Erregungsleitungs- noch eine Kreislauffunktion besitzen.",
    "de|Blatt (Pflanze)|die Schließzellen der Spaltöffnungen (Stomata), die immer Chloroplasten enthalten.",
    "de|Blatt (Pflanze)|Die Stomata dienen der Regulation des Gasaustausches, primär der Wasserdampfabgabe.",
    "de|Blatt (Pflanze)|hypostomatische (Stomata auf der Blattunterseite, häufigste Form)",
  ],
};

const base = { type: "reveal", category_id: "science", min_age: 10, difficulty: 2, data_kind: "drawing", links: [], verification_status: "ai_checked", status: "published" };
const slider = { de: { outside: "Außen", inside: "Innen", slider: "Linie zwischen außen und innen" }, en: { outside: "Outside", inside: "Inside", slider: "Line between outside and inside" } };

const visuals = [
  {
    id: "v-knochen-innen", ...base,
    config: {
      scene: "bone",
      parts: [
        { key: "cartilage", x: 50, y: 8, side: "right" },
        { key: "spongy", x: 56.5, y: 17, side: "right" },
        { key: "marrow", x: 46.5, y: 22.5, side: "left", late: true },
        { key: "periost", x: 56.5, y: 40, side: "right" },
        { key: "compact", x: 54.5, y: 55, side: "right" },
        { key: "cavity", x: 50, y: 62.5, side: "left" },
      ],
    },
    title: "Blick ins Innere: ein Knochen",
    goal: "Du kannst die Teile eines langen Knochens benennen und sagen, wo Blut entsteht.",
    intro: "Von außen sieht man einen glatten, harten Knochen mit Knorpel an den Enden. Zieh die Linie nach links und schau hinein: eine feste Wand, ein schwammartiges Gerüst – und Mark in der Mitte.",
    note: "Eigene, vereinfachte Längsschnitt-Zeichnung eines Röhrenknochens wie des Oberschenkelknochens, nicht maßstäblich. Beim Erwachsenen sitzt das rote Knochenmark vor allem in platten und kurzen Knochen.",
    labels: { ...slider.de, cartilage: "Gelenkknorpel", spongy: "Spongiosa", marrow: "rotes Mark: bildet Blut", periost: "Knochenhaut", compact: "Kompakta", cavity: "Markhöhle (Fettmark)" },
    explain: "Eine Haut aus Bindegewebe, die Knochenhaut, liegt dem Knochen eng an; an den Gelenkflächen ist er stattdessen mit Knorpel überzogen. Außen bildet das Knochengewebe eine feste Schicht, die im Schaft langer Knochen besonders dick ist; innen liegt ein schwammartiges Gerüst aus feinen Knochenbälkchen, die Spongiosa. Im Schaft gibt es eine Markhöhle. Dort und zwischen den Bälkchen sitzt das Knochenmark: Im roten Knochenmark entstehen rote und weiße Blutkörperchen und Blutplättchen. Im Lauf des Lebens wird es im Schaft langer Knochen durch gelbes Fettmark ersetzt.",
    predict: {
      question: "Wo entstehen unsere roten Blutkörperchen?",
      options: ["Im roten Knochenmark", "In der Knochenhaut", "Im Gelenkknorpel"],
      feedback: "Im roten Knochenmark, zwischen den feinen Bälkchen der Spongiosa. Beim Säugling steckt es überall im Knochen, beim Erwachsenen vor allem in platten und kurzen Knochen.",
    },
    predict_correct: 0,
    apply: "Zieh die Linie von außen nach innen und sag zu jeder Schicht, ob sie schützt, trägt oder Blut bildet.",
    sources: [W("Knochen"), W("Knochenmark")],
    translations: {
      en: {
        title: "A look inside: a bone",
        goal: "You can name the parts of a long bone and say where blood is made.",
        intro: "From the outside you see a smooth, hard bone with cartilage at its ends. Drag the line to the left and look inside: a solid wall, a sponge-like framework – and marrow in the middle.",
        note: "Own, simplified lengthwise section of a long bone such as the thighbone, not to scale. In adults the red bone marrow is found mainly in flat and short bones.",
        labels: { ...slider.en, cartilage: "Joint cartilage", spongy: "Spongy bone", marrow: "Red marrow (blood)", periost: "Periosteum", compact: "Compact bone", cavity: "Marrow cavity (fat)" },
        explain: "A skin of connective tissue, the periosteum, fits closely around the bone; at the joint surfaces it is covered with cartilage instead. On the outside the bone tissue forms a solid layer that is especially thick in the shaft of long bones; inside lies a sponge-like framework of fine bony struts, the spongy bone. The shaft has a marrow cavity. There and between the struts sits the bone marrow: red bone marrow makes red and white blood cells and platelets. Over a lifetime it is replaced by yellow fatty marrow in the shaft of long bones.",
        predict: {
          question: "Where are our red blood cells made?",
          options: ["In the red bone marrow", "In the periosteum", "In the joint cartilage"],
          feedback: "In the red bone marrow, between the fine struts of the spongy bone. In babies it fills the whole bone, in adults it is found mainly in flat and short bones.",
        },
        apply: "Move the line from outside in and say for each layer whether it protects, carries weight or makes blood.",
      },
    },
  },
  {
    id: "v-blatt-innen", ...base,
    config: {
      scene: "leaf",
      parts: [
        { key: "cuticle", x: 82.5, y: 27, side: "left" },
        { key: "epidermis", x: 72.5, y: 31, side: "left" },
        { key: "chloro", x: 37.5, y: 47.5, side: "right", late: true },
        { key: "palisade", x: 62.5, y: 38, side: "left" },
        { key: "bundle", x: 50, y: 56, side: "right" },
        { key: "spongy", x: 75, y: 62.5, side: "left" },
        { key: "stoma", x: 20.5, y: 74, side: "right" },
        { key: "lower", x: 85, y: 73, side: "left" },
      ],
    },
    title: "Blick ins Innere: ein Blatt",
    goal: "Du kannst die Schichten eines Laubblatts benennen und sagen, wo die Photosynthese vor allem stattfindet.",
    intro: "Von außen sieht man eine grüne, glänzende Fläche mit Adern. Zieh die Linie nach links und schau in den Schnitt: Wachs, eine dünne Haut, dicht gepackte grüne Säulen – und darunter viel Luft.",
    note: "Eigene, vereinfachte Schnittzeichnung eines Laubblatts, stark vergrößert; nicht jedes Blatt ist so gebaut.",
    labels: { ...slider.de, cuticle: "Wachsschicht (Cuticula)", epidermis: "obere Epidermis", palisade: "Palisadengewebe", chloro: "rund 80 % der Chloroplasten", bundle: "Leitbündel", spongy: "Schwammgewebe mit Luft", stoma: "Spaltöffnung", lower: "untere Epidermis" },
    explain: "Außen schließt eine einzige Zellschicht das Blatt ab, die Epidermis; eine wasserundurchlässige Wachsschicht darauf verhindert ungeregelte Verdunstung. Darunter stehen die langgestreckten Zellen des Palisadengewebes – hier sitzen rund 80 Prozent aller Chloroplasten, und hier findet vor allem die Photosynthese statt. Das Schwammgewebe darunter hat große Zwischenräume und sorgt für die Durchlüftung. Die Leitbündel bringen Wasser und Mineralien herein und Photosyntheseprodukte hinaus; volkstümlich heißen sie Adern oder Nerven. Durch die Spaltöffnungen, meist an der Unterseite, wird der Gasaustausch geregelt, vor allem die Abgabe von Wasserdampf.",
    predict: {
      question: "Wo sitzen die meisten Chloroplasten eines Blattes?",
      options: ["Im Palisadengewebe direkt unter der Oberseite", "Im Schwammgewebe weiter unten", "In der Epidermis ganz außen"],
      feedback: "Im Palisadengewebe: Dort sitzen rund 80 Prozent aller Chloroplasten. Die Zellen der Epidermis haben in der Regel gar keine.",
    },
    predict_correct: 0,
    apply: "Zieh die Linie von oben nach unten durch den Schnitt und sag zu jeder Schicht, ob sie schützt, Licht einfängt, lüftet oder leitet.",
    sources: [W("Blatt_(Pflanze)", "Blatt (Pflanze)")],
    translations: {
      en: {
        title: "A look inside: a leaf",
        goal: "You can name the layers of a leaf and say where photosynthesis mainly happens.",
        intro: "From the outside you see a green, shiny surface with veins. Drag the line to the left and look into the section: wax, a thin skin, tightly packed green columns – and plenty of air below.",
        note: "Own, simplified section drawing of a leaf, greatly enlarged; not every leaf is built like this.",
        labels: { ...slider.en, cuticle: "Wax layer (cuticle)", epidermis: "Upper epidermis", palisade: "Palisade tissue", chloro: "about 80 % of the chloroplasts", bundle: "Vascular bundle", spongy: "Spongy tissue with air", stoma: "Stoma (pore)", lower: "Lower epidermis" },
        explain: "A single layer of cells, the epidermis, closes off the leaf; a waterproof wax layer on top prevents uncontrolled evaporation. Below stand the long cells of the palisade tissue – about 80 per cent of all chloroplasts sit here, and this is where most photosynthesis happens. The spongy tissue beneath has large gaps and keeps the leaf aired. The vascular bundles bring in water and minerals and carry products of photosynthesis out; in everyday language they are called veins or nerves. The pores, mostly on the underside, regulate gas exchange, above all the release of water vapour.",
        predict: {
          question: "Where are most of a leaf's chloroplasts?",
          options: ["In the palisade tissue just under the top", "In the spongy tissue further down", "In the epidermis on the very outside"],
          feedback: "In the palisade tissue: about 80 per cent of all chloroplasts sit there. The cells of the epidermis usually have none at all.",
        },
        apply: "Move the line down through the section and say for each layer whether it protects, catches light, airs or carries.",
      },
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = "content/visuals.json";
  const list = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const v of visuals) {
    const i = list.findIndex((x) => x.id === v.id);
    if (i >= 0) list[i] = v;
    else list.push(v);
  }
  fs.writeFileSync(file, JSON.stringify(list, null, 2) + "\n");
  console.log(`${visuals.length} visualisations merged; ${list.length} in total.`);
}
