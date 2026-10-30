// „Blick ins Innere“, two more (30.10.2026): an animal cell and the ear – own drawings (components/viz/reveal/scenes.tsx),
// every label and figure backed by the quotes in `evidence` (German Wikipedia, checked word for word).
//   node content/_batches/2026-10-visuals-8.mjs      (idempotent; rewrites content/visuals.json)
import fs from "node:fs";

const W = (title, name = title.replaceAll("_", " ")) => ({ name: "Wikipedia: " + name, url: "https://de.wikipedia.org/wiki/" + title });

export const evidence = {
  "v-zelle-innen": [
    "de|Zelle (Biologie)|Jede Zelle, ob prokaryotisch oder eukaryotisch, besitzt eine Zellmembran.",
    "de|Zelle (Biologie)|Diese Zellmembran grenzt die Zelle von ihrer Umgebung ab und kontrolliert, was in die Zelle aufgenommen wird und was heraustransportiert wird.",
    "de|Zelle (Biologie)|Der wesentliche Unterschied zu prokaryotischen Zellen (Procyten) ist die Existenz eines Zellkerns mit einer Kernhülle um die in Chromosomen organisierte DNA.",
    "de|Zelle (Biologie)|In eukaryotischen Zellen ist die DNA an verschiedenen Orten verteilt: im Zellkern und in den Mitochondrien und Plastiden, Zellorganellen mit doppelter Membran.",
    "de|Zelle (Biologie)|Die menschliche Zelle besitzt 46 Chromosomen.",
    "de|Zelle (Biologie)|In den Mitochondrien und den Plastiden liegt die DNA wie in Prokaryoten „circulär“ vor.",
    "de|Zelle (Biologie)|Ribosomen – Die Proteinfabriken",
    "de|Zelle (Biologie)|weshalb die Ribosomen in vielfacher Zahl in den Zellen vorliegen, zum Teil hunderte bis tausende von Ribosomen pro Zelle.",
    "de|Zelle (Biologie)|Das Zellskelett gibt der Zelle ihre Form und ihre mechanische Stabilität.",
    "de|Zelle (Biologie)|Die Eizelle des Menschen hat einen Durchmesser von 0,15 mm; sie ist seine größte Zelle und die einzige, die mit bloßem Auge erkennbar ist.",
    "de|Mitochondrium|Mitochondrien regenerieren über die Atmungskette das energiereiche Molekül Adenosintriphosphat (ATP).",
  ],
  "v-ohr-innen": [
    "de|Ohr|Das Außenohr umfasst den Ohrknorpel, die Ohrmuschel, das Ohrläppchen und den äußeren Gehörgang oder auch Ohrkanal und die Außenseite des Trommelfells.",
    "de|Ohr|Zum Mittelohr gehören das Trommelfell und die Gehörknöchelchen Hammer, Amboss und Steigbügel.",
    "de|Ohr|Die Eustachische Röhre, auch Ohrtrompete genannt, verbindet Mittelohr und Nasenrachenraum.",
    "de|Ohr|in der Schall in Nervenimpulse umgesetzt wird",
    "de|Ohr|Zum Innenohr gehört auch das Gleichgewichtsorgan.",
    "de|Ohr|Das Gleichgewichtsorgan besteht aus den Bogengängen und zwei bläschenförmigen Anteilen, dem Utriculus und dem Sacculus.",
    "de|Ohr|Von der Gehörschnecke geht der Hörnerv gemeinsam mit den Nervenbündeln des Gleichgewichtsorganes als Nervus vestibulocochlearis in Richtung Gehirn.",
    "de|Steigbügel (Anatomie)|Der Steigbügel ist der kleinste Knochen des menschlichen Körpers",
    "de|Steigbügel (Anatomie)|Er ist im Mittel 3,3 mm hoch",
    "de|Steigbügel (Anatomie)|berührt das ovale Fenster der Hörschnecke und überträgt die Schwingungen auf die Flüssigkeit im Inneren der Schnecke.",
  ],
};

const visuals = [
  {
    id: "v-zelle-innen",
    type: "reveal",
    category_id: "science",
    min_age: 10,
    difficulty: 2,
    data_kind: "drawing",
    config: {
      scene: "cell",
      parts: [
        { key: "nucleus", x: 40, y: 40, side: "left" },
        { key: "mito", x: 72.5, y: 37.5, side: "left" },
        { key: "ribosomes", x: 75, y: 52.5, side: "left" },
        { key: "dna", x: 30, y: 67.5, side: "right", late: true },
        { key: "skeleton", x: 39.5, y: 75, side: "left" },
        { key: "plasma", x: 55, y: 75, side: "right" },
        { key: "membrane", x: 65.5, y: 85, side: "right" },
      ],
    },
    title: "Blick ins Innere: eine Zelle",
    goal: "Du kannst die wichtigsten Teile einer tierischen Zelle benennen und sagen, wo in ihr Erbgut steckt.",
    intro: "Von außen sieht man nur die Zellmembran. Zieh die Linie nach links und schau hinein: Zellkern, Mitochondrien, Ribosomen und ein Gerüst aus feinen Fasern.",
    note: "Eigene, vereinfachte Zeichnung einer tierischen Zelle, stark vergrößert und nicht maßstäblich; viele Bestandteile sind weggelassen.",
    labels: {
      outside: "Außen", inside: "Innen", slider: "Linie zwischen außen und innen",
      membrane: "Zellmembran", nucleus: "Zellkern", mito: "Mitochondrium", ribosomes: "Ribosomen", skeleton: "Zellskelett", plasma: "Zellplasma", dna: "auch hier: eigene DNA",
    },
    explain: "Die Zellmembran grenzt die Zelle ab und kontrolliert, was hinein- und hinausgelangt. Im Zellkern liegt die DNA, beim Menschen in 46 Chromosomen. Mitochondrien gewinnen über die Atmungskette das energiereiche Molekül ATP – und haben eigene DNA. Ribosomen, oft Hunderte bis Tausende pro Zelle, bauen Proteine; das Zellskelett gibt der Zelle Form und Halt. Die größte menschliche Zelle, die Eizelle, misst 0,15 mm.",
    predict: {
      question: "Wo steckt in einer Zelle außer im Zellkern noch Erbgut (DNA)?",
      options: ["In den Mitochondrien", "In der Zellmembran", "Nirgends sonst"],
      feedback: "In den Mitochondrien: Sie haben eine eigene, ringförmige DNA. Sonst liegt das Erbgut im Zellkern – beim Menschen in 46 Chromosomen.",
    },
    predict_correct: 0,
    apply: "Zieh die Linie Stück für Stück nach links und nenne zu jedem Teil, wofür die Zelle es braucht.",
    sources: [W("Zelle_(Biologie)"), W("Mitochondrium")],
    links: [],
    verification_status: "ai_checked",
    status: "published",
    translations: {
      en: {
        title: "A look inside: a cell",
        goal: "You can name the main parts of an animal cell and say where in it genetic material is found.",
        intro: "From the outside you only see the cell membrane. Drag the line to the left and look inside: nucleus, mitochondria, ribosomes and a scaffold of fine fibres.",
        note: "Own, simplified drawing of an animal cell, greatly enlarged and not to scale; many parts are left out.",
        labels: {
          outside: "Outside", inside: "Inside", slider: "Line between outside and inside",
          membrane: "Cell membrane", nucleus: "Nucleus", mito: "Mitochondrion", ribosomes: "Ribosomes", skeleton: "Cytoskeleton", plasma: "Cytoplasm", dna: "its own DNA, too",
        },
        explain: "The cell membrane separates the cell from its surroundings and controls what gets in and out. The DNA lies in the nucleus – in humans in 46 chromosomes. Mitochondria produce the energy-rich molecule ATP through the respiratory chain – and have DNA of their own. Ribosomes, often hundreds to thousands per cell, build proteins; the cytoskeleton gives the cell its shape and stability. The largest human cell, the egg cell, measures 0.15 mm.",
        predict: {
          question: "Where in a cell, apart from the nucleus, is there genetic material (DNA)?",
          options: ["In the mitochondria", "In the cell membrane", "Nowhere else"],
          feedback: "In the mitochondria: they have their own, ring-shaped DNA. Otherwise the genetic material lies in the nucleus – in humans in 46 chromosomes.",
        },
        apply: "Move the line to the left bit by bit and say for each part what the cell needs it for.",
      },
    },
  },
  {
    id: "v-ohr-innen",
    type: "reveal",
    category_id: "science",
    min_age: 10,
    difficulty: 2,
    data_kind: "drawing",
    config: {
      scene: "ear",
      parts: [
        { key: "balance", x: 79.5, y: 34.5, side: "left" },
        { key: "pinna", x: 12.5, y: 40, side: "right" },
        { key: "drum", x: 50, y: 44.5, side: "right" },
        { key: "canal", x: 37, y: 49, side: "left" },
        { key: "nerve", x: 96, y: 51.5, side: "left" },
        { key: "ossicles", x: 60, y: 56, side: "left" },
        { key: "cochlea", x: 77.5, y: 62.5, side: "left" },
        { key: "tube", x: 50, y: 80, side: "right" },
      ],
    },
    title: "Blick ins Innere: das Ohr",
    goal: "Du kannst Außen-, Mittel- und Innenohr unterscheiden und erklären, welchen Weg der Schall nimmt.",
    intro: "Von außen sieht man nur die Ohrmuschel. Zieh die Linie nach links und schau in den Kopf: Gehörgang, Trommelfell, drei winzige Knöchelchen – und die Schnecke.",
    note: "Eigene, vereinfachte Schnittzeichnung von vorn, kein medizinisches Modell; Mittel- und Innenohr sind stark vergrößert.",
    labels: {
      outside: "Außen", inside: "Innen", slider: "Linie zwischen außen und innen",
      pinna: "Ohrmuschel", canal: "Gehörgang", drum: "Trommelfell", ossicles: "Gehörknöchelchen", balance: "Gleichgewichtsorgan", cochlea: "Hörschnecke", nerve: "Hörnerv", tube: "Ohrtrompete",
    },
    explain: "Zum Außenohr gehören Ohrmuschel und Gehörgang bis zum Trommelfell. Im Mittelohr übertragen Hammer, Amboss und Steigbügel die Schwingungen; der Steigbügel ist mit im Mittel 3,3 mm der kleinste Knochen des Körpers und berührt die Hörschnecke. Dort wird der Schall in Nervenimpulse umgesetzt, die über den Hörnerv zum Gehirn laufen. Zum Innenohr gehört auch das Gleichgewichtsorgan mit seinen Bogengängen. Die Ohrtrompete verbindet das Mittelohr mit dem Nasenrachenraum.",
    predict: {
      question: "Wo sitzt unser Gleichgewichtsorgan?",
      options: ["Im Innenohr", "Im Kleinhirn", "Im Mittelohr"],
      feedback: "Im Innenohr, gleich neben der Hörschnecke: Es besteht aus den Bogengängen und zwei bläschenförmigen Teilen.",
    },
    predict_correct: 0,
    apply: "Folge dem Schall: Zieh die Linie von außen nach innen und nenne jede Station von der Ohrmuschel bis zum Hörnerv.",
    sources: [W("Ohr"), W("Steigbügel_(Anatomie)")],
    links: [],
    verification_status: "ai_checked",
    status: "published",
    translations: {
      en: {
        title: "A look inside: the ear",
        goal: "You can tell the outer, middle and inner ear apart and explain the path sound takes.",
        intro: "From the outside you only see the outer ear. Drag the line to the left and look into the head: ear canal, eardrum, three tiny bones – and the cochlea.",
        note: "Own, simplified section drawing from the front, not a medical model; middle and inner ear are greatly enlarged.",
        labels: {
          outside: "Outside", inside: "Inside", slider: "Line between outside and inside",
          pinna: "Outer ear", canal: "Ear canal", drum: "Eardrum", ossicles: "Ossicles", balance: "Balance organ", cochlea: "Cochlea", nerve: "Auditory nerve", tube: "Eustachian tube",
        },
        explain: "The outer ear includes the pinna and the ear canal up to the eardrum. In the middle ear, hammer, anvil and stirrup pass on the vibrations; at 3.3 mm on average the stirrup is the smallest bone in the body and touches the cochlea. There sound is turned into nerve impulses that travel along the auditory nerve to the brain. The inner ear also holds the balance organ with its semicircular canals. The Eustachian tube links the middle ear with the nasopharynx.",
        predict: {
          question: "Where is our organ of balance?",
          options: ["In the inner ear", "In the cerebellum", "In the middle ear"],
          feedback: "In the inner ear, right next to the cochlea: it consists of the semicircular canals and two small sacs.",
        },
        apply: "Follow the sound: move the line from outside in and name every stop from the outer ear to the auditory nerve.",
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
