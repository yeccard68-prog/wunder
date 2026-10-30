// „Blick ins Innere“ (30.10.2026, the operator's idea from a slide with a heart): a new visual type "reveal" – one
// own drawing, outside and inside, and a slider that moves the line between them (components/viz/RevealViz.tsx,
// drawings in components/viz/reveal/scenes.tsx). First two: the Earth and the heart. Every label and figure below
// is backed by the quotes in `evidence` (German Wikipedia, checked word for word on 30.10.2026).
//   node content/_batches/2026-10-visuals-5.mjs      (idempotent; rewrites content/visuals.json)
import fs from "node:fs";

const W = (title, name = title.replaceAll("_", " ")) => ({ name: "Wikipedia: " + name, url: "https://de.wikipedia.org/wiki/" + title });

export const evidence = {
  "v-erde-innen": [
    "de|Erdkern|Der innere Kern beginnt ab einer Tiefe von 5150 km und reicht bis zum Erdmittelpunkt.",
    "de|Erdkern|Der äußere Kern beginnt ab einer Tiefe von im Mittel 2900 km und endet an der Grenze zum inneren Erdkern bei 5150 km.",
    "de|Erdkern|Auswertungen von Erdbebenwellen ergaben, dass der Erdkern aus einem flüssigen äußeren Kern und einem festen inneren Kern besteht.",
    "de|Erdkern|Trotz der sehr hohen Temperaturen im inneren Kern, die bei 6000 ± 500 K liegen, besteht dieser Teil des Erdkerns vorwiegend aus festem Metall.",
    "de|Erdkern|Die Kola-Bohrung, die das tiefste jemals gebohrte Loch darstellt, war 12,3 km tief, was lediglich 1⁄518 und damit rund 0,2 % der Strecke zum Erdmittelpunkt entspricht.",
    "de|Erdkruste|Ozeanische Erdkruste hat eine geringe Dicke von fünf bis sieben Kilometern, nur vereinzelt ist sie über zehn Kilometer dick.",
    "de|Erdkruste|Die kontinentale Erdkruste hat eine Dicke von 30 bis 60 Kilometer, wobei sie unter Gebirgsländern (insbesondere unter langen Gebirgsketten) viel weiter hinabreicht.",
    "de|Erdradius|Er beträgt im Mittel 6.371 Kilometer.",
  ],
  "v-herz-innen": [
    "de|Herz|In den rechten Vorhof münden die obere und untere Hohlvene (Vena cava superior und inferior).",
    "de|Herz|Zwischen rechtem Vorhof und rechter Kammer befindet sich die Trikuspidalklappe, die bei der Kammerkontraktion einen Rückstrom des Blutes in den Vorhof verhindert.",
    "de|Herz|Der Rückfluss in die rechte Kammer wird durch die taschenförmige Pulmonalklappe verhindert.",
    "de|Herz|Durch meist vier Lungenvenen fließt das in der Lunge mit Sauerstoff angereicherte Blut in den linken Vorhof.",
    "de|Herz|Von hier aus gelangt es über eine weitere Segelklappe, die Mitralklappe, zur linken Kammer.",
    "de|Herz|Der Ausstrom erfolgt durch den sogenannten linksventrikulären Ausflusstrakt (LVOT) über eine weitere Taschenklappe (Aortenklappe) und die Hauptschlagader (Aorta) in den Körperkreislauf.",
    "de|Herz|Getrennt werden die Räume der Herzhälften vertikal durch die Herzscheidewand (Septum).",
    "de|Herz|Das Blut kann zwischen den Herzräumen nur in eine Richtung fließen, da sich zwischen den Vorhöfen und den Kammern sowie zwischen den Kammern und den sich anschließenden Gefäßen Herzklappen befinden, die wie Rückschlagventile arbeiten.",
    "de|Herz|Die rechte Herzhälfte pumpt das Blut durch den Lungenkreislauf („kleiner Kreislauf“), wonach es sauerstoffreich im linken Vorhof ankommt.",
    "de|Herz|Da der Gesamtgefäßwiderstand sowie der Blutdruck im Körperkreislauf erheblich größer sind als im Lungenkreislauf, muss die linke Herzkammer eine entsprechend größere Arbeit (Herzarbeit) gegen diesen Widerstand verrichten und weist daher eine deutlich stärkere Wanddicke auf als die rechte.",
  ],
};

const visuals = [
  {
    id: "v-erde-innen",
    type: "reveal",
    category_id: "earth",
    min_age: 10,
    difficulty: 1,
    data_kind: "drawing",
    config: {
      scene: "earth",
      parts: [
        { key: "crust", x: 75.8, y: 13.1, side: "left" },
        { key: "kola", x: 91.1, y: 31.7, side: "left", late: true },
        { key: "inner", x: 55, y: 50, side: "right" },
        { key: "outer", x: 59.5, y: 63.6, side: "left" },
        { key: "mantle", x: 67.4, y: 80, side: "left" },
      ],
    },
    title: "Blick ins Innere: der Aufbau der Erde",
    goal: "Du kannst die Schalen der Erde von außen nach innen benennen und sagen, welche fest und welche flüssig ist.",
    intro: "Von außen siehst du Meere und Kontinente. Zieh die Linie nach links und schneide die Erde auf: Darunter liegen Mantel, äußerer und innerer Kern.",
    note: "Eigene Zeichnung. Die Schalen sind maßstabsgetreu (6371 km Radius, Kern ab 2900 km Tiefe, innerer Kern ab 5150 km) – nur die Kruste ist dicker gezeichnet: In echt wäre sie mit 5 bis 60 km dünner als die Linie am Rand. Kontinente nach Natural Earth (gemeinfrei).",
    labels: {
      outside: "Außen", inside: "Innen", slider: "Linie zwischen außen und innen",
      crust: "Kruste: 5 bis 60 km dick", mantle: "Mantel: bis 2900 km tief", outer: "Äußerer Kern: flüssig", inner: "Innerer Kern: fest",
      kola: "Tiefstes Bohrloch: 12,3 km",
    },
    explain: "Bis zum Erdmittelpunkt sind es im Mittel 6371 km. Gebohrt hat noch niemand weiter als 12,3 km – alles darunter kennt man aus Erdbebenwellen: Sie zeigen einen flüssigen äußeren Kern ab 2900 km Tiefe und darin einen festen inneren Kern ab 5150 km. Der innere Kern ist rund 6000 Kelvin heiß und trotzdem vor allem festes Metall.",
    predict: {
      question: "Das tiefste Bohrloch der Welt, die Kola-Bohrung, ist 12,3 km tief. Welcher Teil des Wegs zum Erdmittelpunkt ist das?",
      options: ["Rund 0,2 %", "Rund 2 %", "Rund 20 %"],
      feedback: "Nur rund 0,2 % – in der Zeichnung wäre das Bohrloch dünner als die Linie der Kruste. Was darunter liegt, weiß man nur aus Erdbebenwellen.",
    },
    predict_correct: 0,
    apply: "Schieb die Linie so weit, dass nur der innere Kern noch außen liegt. Wie viele Schalen hast du dabei überquert, und welche davon ist flüssig?",
    sources: [W("Erdkern"), W("Erdkruste"), W("Erdradius")],
    links: [{ kind: "animation", id: "a-platten" }],
    verification_status: "ai_checked",
    status: "published",
    translations: {
      en: {
        title: "A look inside: how the Earth is built",
        goal: "You can name the Earth's layers from the outside in and say which is solid and which is liquid.",
        intro: "From the outside you see oceans and continents. Drag the line to the left and cut the Earth open: beneath lie the mantle, the outer and the inner core.",
        note: "Own drawing. The layers are to scale (6,371 km radius, core from 2,900 km deep, inner core from 5,150 km) – only the crust is drawn thicker: at 5 to 60 km it would really be thinner than the line along the edge. Continents after Natural Earth (public domain).",
        labels: {
          outside: "Outside", inside: "Inside", slider: "Line between outside and inside",
          crust: "Crust: 5 to 60 km thick", mantle: "Mantle: down to 2,900 km", outer: "Outer core: liquid", inner: "Inner core: solid",
          kola: "Deepest borehole: 12.3 km",
        },
        explain: "It is 6,371 km to the centre of the Earth on average. Nobody has drilled deeper than 12.3 km – everything below is known from earthquake waves: they show a liquid outer core from 2,900 km down and inside it a solid inner core from 5,150 km. The inner core is about 6,000 kelvin hot and still mostly solid metal.",
        predict: {
          question: "The deepest borehole in the world, the Kola borehole, is 12.3 km deep. What share of the way to the centre of the Earth is that?",
          options: ["About 0.2%", "About 2%", "About 20%"],
          feedback: "Only about 0.2% – in the drawing the borehole would be thinner than the line of the crust. What lies below is known only from earthquake waves.",
        },
        apply: "Move the line until only the inner core is still on the outside. How many layers did you cross, and which of them is liquid?",
      },
    },
  },
  {
    id: "v-herz-innen",
    type: "reveal",
    category_id: "science",
    min_age: 10,
    difficulty: 2,
    data_kind: "drawing",
    config: {
      scene: "heart",
      parts: [
        { key: "cava", x: 34, y: 25, side: "left" },
        { key: "ra", x: 40, y: 53, side: "left" },
        { key: "tricuspid", x: 43, y: 63, side: "left" },
        { key: "rv", x: 45, y: 75, side: "left" },
        { key: "aorticValve", x: 53.5, y: 45.5, side: "left" },
        { key: "aorta", x: 74, y: 21, side: "right" },
        { key: "la", x: 64, y: 43, side: "right" },
        { key: "mitral", x: 65.5, y: 55, side: "right" },
        { key: "lv", x: 64, y: 71, side: "right" },
        { key: "septum", x: 61.5, y: 85, side: "left" },
      ],
    },
    title: "Blick ins Innere: das Herz",
    goal: "Du kannst die vier Räume des Herzens und seine Klappen zeigen und erklären, welchen Weg das Blut nimmt.",
    intro: "Von außen ist das Herz ein Muskel mit großen Gefäßen. Zieh die Linie nach links und schau hinein: vier Räume, vier Klappen und eine Scheidewand.",
    note: "Eigene, vereinfachte Zeichnung von vorn, kein medizinisches Modell. Rechts und links gelten wie in der Anatomie aus Sicht des Menschen, dem das Herz gehört – in der Zeichnung also seitenverkehrt. Blau: sauerstoffarmes Blut, rot: sauerstoffreiches.",
    labels: {
      outside: "Außen", inside: "Innen", slider: "Linie zwischen außen und innen",
      cava: "Obere Hohlvene", ra: "Rechter Vorhof", tricuspid: "Trikuspidalklappe", rv: "Rechte Kammer", aorticValve: "Aortenklappe",
      aorta: "Aorta", la: "Linker Vorhof", mitral: "Mitralklappe", lv: "Linke Kammer", septum: "Scheidewand",
    },
    explain: "Sauerstoffarmes Blut kommt über die Hohlvenen in den rechten Vorhof und durch die Trikuspidalklappe in die rechte Kammer. Die pumpt es durch die Pulmonalklappe zur Lunge. Von dort fließt es mit Sauerstoff angereichert in den linken Vorhof, durch die Mitralklappe in die linke Kammer und über die Aortenklappe in die Aorta. Die Klappen lassen das Blut nur in eine Richtung durch; die Scheidewand trennt die beiden Hälften.",
    predict: {
      question: "Welche Herzkammer hat die dickste Wand?",
      options: ["Die rechte Kammer", "Die linke Kammer", "Beide sind gleich dick"],
      feedback: "Die linke: Sie pumpt das Blut durch den ganzen Körper, gegen einen viel größeren Widerstand als die rechte, die es nur durch die Lunge schickt. Zieh die Linie und vergleiche die Wände.",
    },
    predict_correct: 1,
    apply: "Folge dem Blut: Zieh die Linie Stück für Stück nach links und nenne die Räume und Klappen in der Reihenfolge, in der das Blut sie durchfließt.",
    sources: [W("Herz")],
    links: [{ kind: "animation", id: "a-herz" }],
    verification_status: "ai_checked",
    status: "published",
    translations: {
      en: {
        title: "A look inside: the heart",
        goal: "You can point out the heart's four chambers and its valves and explain which way the blood flows.",
        intro: "From the outside the heart is a muscle with large vessels. Drag the line to the left and look inside: four chambers, four valves and a dividing wall.",
        note: "Own, simplified drawing from the front, not a medical model. As in anatomy, right and left are seen from the person the heart belongs to – so they are mirrored in the drawing. Blue: oxygen-poor blood, red: oxygen-rich.",
        labels: {
          outside: "Outside", inside: "Inside", slider: "Line between outside and inside",
          cava: "Superior vena cava", ra: "Right atrium", tricuspid: "Tricuspid valve", rv: "Right ventricle", aorticValve: "Aortic valve",
          aorta: "Aorta", la: "Left atrium", mitral: "Mitral valve", lv: "Left ventricle", septum: "Septum",
        },
        explain: "Oxygen-poor blood comes through the venae cavae into the right atrium and through the tricuspid valve into the right ventricle, which pumps it through the pulmonary valve to the lungs. From there it flows, rich in oxygen, into the left atrium, through the mitral valve into the left ventricle and through the aortic valve into the aorta. The valves let blood through in one direction only; the septum divides the two halves.",
        predict: {
          question: "Which chamber of the heart has the thickest wall?",
          options: ["The right ventricle", "The left ventricle", "Both are equally thick"],
          feedback: "The left: it pumps the blood through the whole body, against a much greater resistance than the right one, which only sends it through the lungs. Drag the line and compare the walls.",
        },
        apply: "Follow the blood: move the line to the left bit by bit and name the chambers and valves in the order the blood flows through them.",
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
