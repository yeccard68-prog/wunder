// „Blick ins Innere“, two more (30.10.2026): a stratovolcano and the eye – own drawings (components/viz/reveal/scenes.tsx),
// every label and figure backed by the quotes in `evidence` (German Wikipedia, checked word for word).
//   node content/_batches/2026-10-visuals-6.mjs      (idempotent; rewrites content/visuals.json)
import fs from "node:fs";

const W = (title, name = title.replaceAll("_", " ")) => ({ name: "Wikipedia: " + name, url: "https://de.wikipedia.org/wiki/" + title });

export const evidence = {
  "v-vulkan-innen": [
    "de|Schichtvulkan|Schichtvulkane, auch Stratovulkane (von lateinisch stratum ‚Schicht‘) genannt, sind aus einzelnen geologischen Schichten von Lava und Lockermassen aufgebaute Vulkane.",
    "de|Schichtvulkan|Der hohe Gasanteil bewirkt, dass die Eruptionen explosiv verlaufen und zwar meist im Wechsel zwischen austretendem Lockermaterial, genannt Tephra (Bomben, Lapilli, Aschen), und Lava.",
    "de|Schichtvulkan|Eine solche Abfolge verursacht bei Erkaltung und Ablagerung die charakteristische Schichtung, die namensgebend für diesen Vulkantyp ist.",
    "de|Schichtvulkan|als vulkanische Aschen bis in Höhen von 40 km in die Erdatmosphäre geschleudert werden können.",
    "de|Vulkan|die Öffnung, aus der Lava aus der Tiefe aufsteigt, heißt Vulkanschlot.",
    "de|Vulkan|Die mehr oder minder breite Öffnung an der Spitze eines Vulkans ist der Vulkankrater.",
    "de|Magmakammer|Von diesen Kammern aus – die zwischen einigen Kilometern und Dutzenden Kilometern tief liegen – kann das Magma entlang von Klüften und Schwächezonen oder durch sogenannte Gänge empordringen",
  ],
  "v-auge-innen": [
    "de|Wirbeltierauge|Das Licht tritt durch die durchsichtige Hornhaut (Cornea) ein.",
    "de|Wirbeltierauge|Sie geht unmittelbar in die weiße Lederhaut (Sclera) über",
    "de|Wirbeltierauge|Der vorderste Abschnitt der mittleren Augenhaut ist die Regenbogenhaut (Iris).",
    "de|Wirbeltierauge|Sie bildet die Pupille und reguliert den Lichteinfall.",
    "de|Wirbeltierauge|Ihre Pigmentierung verursacht die Augenfarbe.",
    "de|Wirbeltierauge|wird von der Netzhaut (Retina) gebildet.",
    "de|Wirbeltierauge|Dort, wo der Sehnerv das Auge verlässt (Sehnervenpapille), befinden sich keine Lichtsinneszellen.",
    "de|Wirbeltierauge|Den zu dieser Stelle korrespondierenden Bereich des Gesichtsfelds nennt man den Blinden Fleck.",
    "de|Wirbeltierauge|ist eine gelartige, durchsichtige Substanz, die die Kugelform des Auges aufrechterhält.",
    "de|Wirbeltierauge|Der Glaskörper besteht zu ca. 98 % aus Wasser sowie aus ca. 2 % Hyaluronsäure und einem Netz von Kollagenfasern",
    "de|Wirbeltierauge|bestehen aus der Hornhaut, der Linse, dem Kammerwasser und dem Glaskörper.",
    "de|Wirbeltierauge|Beim erwachsenen Menschen hat der Augapfel einen Durchmesser von durchschnittlich etwa 23 mm.",
  ],
};

const visuals = [
  {
    id: "v-vulkan-innen",
    type: "reveal",
    category_id: "earth",
    min_age: 10,
    difficulty: 1,
    data_kind: "drawing",
    config: {
      scene: "volcano",
      parts: [
        { key: "plume", x: 50, y: 10, side: "right" },
        { key: "crater", x: 50, y: 26, side: "right" },
        { key: "layers", x: 65, y: 43, side: "left" },
        { key: "conduit", x: 50, y: 52, side: "right" },
        { key: "chamber", x: 50, y: 84, side: "right" },
        { key: "depth", x: 30, y: 92, side: "right", late: true },
      ],
    },
    title: "Blick ins Innere: ein Vulkan",
    goal: "Du kannst erklären, wie ein Schichtvulkan aufgebaut ist und woher das Magma kommt, das an seinem Krater austritt.",
    intro: "Von außen ist ein Vulkan ein Berg mit einem Krater und manchmal einer Aschewolke. Zieh die Linie nach links und schneide ihn auf: Schichten, ein Schlot und tief darunter die Magmakammer.",
    note: "Eigene Zeichnung eines Schichtvulkans, nicht maßstäblich: Die Magmakammer liegt in Wirklichkeit viel tiefer, als es hier aussieht.",
    labels: {
      outside: "Außen", inside: "Innen", slider: "Linie zwischen außen und innen",
      plume: "Aschewolke", crater: "Krater", layers: "Lava- und Ascheschichten", conduit: "Schlot", chamber: "Magmakammer", depth: "einige bis Dutzende km tief",
    },
    explain: "Bei einem Schichtvulkan wechseln sich Ausbrüche von Lava und Lockermaterial ab – Asche, Lapilli, Bomben. Erkaltet und abgelagert, bilden sie die typischen Schichten. Das Magma kommt aus einer Magmakammer, die zwischen einigen Kilometern und Dutzenden Kilometern tief liegt, steigt durch den Schlot auf und tritt am Krater aus. Bei heftigen Ausbrüchen kann Asche bis in 40 km Höhe geschleudert werden.",
    predict: {
      question: "Wie tief unter der Oberfläche liegen Magmakammern?",
      options: ["Wenige Meter unter dem Krater", "Einige bis Dutzende Kilometer tief", "Tausende Kilometer tief, beim Erdkern"],
      feedback: "Zwischen einigen Kilometern und Dutzenden Kilometern – in der Zeichnung ist das stark zusammengeschoben. Von dort steigt das Magma durch Spalten und Gänge auf.",
    },
    predict_correct: 1,
    apply: "Zieh die Linie Stück für Stück nach links und folge dem Magma: aus welcher Tiefe, durch welchen Weg, bis wohin?",
    sources: [W("Schichtvulkan"), W("Vulkan"), W("Magmakammer")],
    links: [{ kind: "animation", id: "a-platten" }],
    verification_status: "ai_checked",
    status: "published",
    translations: {
      en: {
        title: "A look inside: a volcano",
        goal: "You can explain how a stratovolcano is built and where the magma comes from that comes out of its crater.",
        intro: "From the outside a volcano is a mountain with a crater and sometimes a cloud of ash. Drag the line to the left and cut it open: layers, a conduit and, deep below, the magma chamber.",
        note: "Own drawing of a stratovolcano, not to scale: the magma chamber really lies much deeper than it looks here.",
        labels: {
          outside: "Outside", inside: "Inside", slider: "Line between outside and inside",
          plume: "Ash cloud", crater: "Crater", layers: "Layers of lava and ash", conduit: "Conduit", chamber: "Magma chamber", depth: "a few to dozens of km deep",
        },
        explain: "In a stratovolcano, eruptions of lava and loose material – ash, lapilli, bombs – take turns. Cooled and deposited, they form the typical layers. The magma comes from a magma chamber lying between a few kilometres and dozens of kilometres deep, rises through the conduit and comes out at the crater. In violent eruptions ash can be hurled up to 40 km high.",
        predict: {
          question: "How deep below the surface do magma chambers lie?",
          options: ["A few metres below the crater", "A few to dozens of kilometres deep", "Thousands of kilometres deep, near the core"],
          feedback: "Between a few kilometres and dozens of kilometres – in the drawing that is strongly squeezed together. From there the magma rises through cracks and dykes.",
        },
        apply: "Move the line to the left bit by bit and follow the magma: from what depth, along which way, up to where?",
      },
    },
  },
  {
    id: "v-auge-innen",
    type: "reveal",
    category_id: "science",
    min_age: 10,
    difficulty: 2,
    data_kind: "drawing",
    config: {
      scene: "eye",
      parts: [
        { key: "iris", x: 27.5, y: 40, side: "right" },
        { key: "lens", x: 34.5, y: 50, side: "right" },
        { key: "cornea", x: 20, y: 62, side: "right" },
        { key: "retina", x: 72.7, y: 27.4, side: "right" },
        { key: "vitreous", x: 60, y: 52, side: "right" },
        { key: "water", x: 40, y: 70, side: "right", late: true },
        { key: "blind", x: 80.75, y: 61, side: "left" },
        { key: "nerve", x: 96, y: 77, side: "left" },
        { key: "sclera", x: 38, y: 77, side: "left" },
      ],
    },
    title: "Blick ins Innere: das Auge",
    goal: "Du kannst die Teile des Auges vom Licht-Eingang bis zum Sehnerv benennen und sagen, wo der blinde Fleck liegt.",
    intro: "Von der Seite ist das Auge eine weiße Kugel mit der Hornhaut vorn. Zieh die Linie nach links und schau hinein: Iris, Linse, Glaskörper, Netzhaut – und der Sehnerv.",
    note: "Eigene, vereinfachte Zeichnung von der Seite, kein medizinisches Modell; das Licht kommt von links. Größen sind nicht maßstäblich.",
    labels: {
      outside: "Außen", inside: "Innen", slider: "Linie zwischen außen und innen",
      cornea: "Hornhaut", iris: "Regenbogenhaut (Iris)", lens: "Linse", vitreous: "Glaskörper", water: "zu etwa 98 % Wasser", retina: "Netzhaut", blind: "Blinder Fleck", nerve: "Sehnerv", sclera: "Lederhaut",
    },
    explain: "Licht tritt durch die durchsichtige Hornhaut ein. Die Regenbogenhaut (Iris) bildet die Pupille und regelt, wie viel Licht hineinkommt – ihre Farbe ist die Augenfarbe. Hornhaut, Linse, Kammerwasser und Glaskörper bündeln das Licht auf die Netzhaut. Wo der Sehnerv das Auge verlässt, gibt es keine Lichtsinneszellen: der blinde Fleck. Der ganze Augapfel misst beim Erwachsenen im Mittel etwa 23 mm.",
    predict: {
      question: "Woraus besteht der Glaskörper im Auge hauptsächlich?",
      options: ["Aus einem glasartigen Kristall", "Zu etwa 98 % aus Wasser", "Aus Fett und Muskelfasern"],
      feedback: "Zu etwa 98 % aus Wasser, dazu Hyaluronsäure und ein feines Netz aus Kollagenfasern – eine durchsichtige, gelartige Masse, die das Auge rund hält.",
    },
    predict_correct: 1,
    apply: "Folge dem Licht: Zieh die Linie von rechts nach links und nenne alles, was das Licht auf dem Weg zur Netzhaut durchquert.",
    sources: [W("Wirbeltierauge")],
    links: [{ kind: "animation", id: "a-auge" }],
    verification_status: "ai_checked",
    status: "published",
    translations: {
      en: {
        title: "A look inside: the eye",
        goal: "You can name the parts of the eye from where light enters to the optic nerve and say where the blind spot is.",
        intro: "From the side the eye is a white ball with the cornea at the front. Drag the line to the left and look inside: iris, lens, vitreous body, retina – and the optic nerve.",
        note: "Own, simplified drawing from the side, not a medical model; the light comes from the left. Sizes are not to scale.",
        labels: {
          outside: "Outside", inside: "Inside", slider: "Line between outside and inside",
          cornea: "Cornea", iris: "Iris", lens: "Lens", vitreous: "Vitreous body", water: "about 98% water", retina: "Retina", blind: "Blind spot", nerve: "Optic nerve", sclera: "Sclera",
        },
        explain: "Light enters through the transparent cornea. The iris forms the pupil and controls how much light gets in – its colour is the eye colour. Cornea, lens, aqueous humour and vitreous body focus the light onto the retina. Where the optic nerve leaves the eye there are no light-sensing cells: the blind spot. The whole eyeball measures about 23 mm on average in adults.",
        predict: {
          question: "What is the vitreous body in the eye mainly made of?",
          options: ["A glass-like crystal", "About 98% water", "Fat and muscle fibres"],
          feedback: "About 98% water, plus hyaluronic acid and a fine network of collagen fibres – a clear, gel-like mass that keeps the eye round.",
        },
        apply: "Follow the light: move the line from right to left and name everything the light passes on its way to the retina.",
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
