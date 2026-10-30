// „Blick ins Innere“, two more (30.10.2026): a hen's egg and a classic light bulb – own drawings
// (components/viz/reveal/scenes.tsx), every label and figure backed by the quotes in `evidence` (German Wikipedia).
//   node content/_batches/2026-10-visuals-7.mjs      (idempotent; rewrites content/visuals.json)
import fs from "node:fs";

const W = (title, name = title.replaceAll("_", " ")) => ({ name: "Wikipedia: " + name, url: "https://de.wikipedia.org/wiki/" + title });

export const evidence = {
  "v-ei-innen": [
    "de|Vogelei|Im hinteren Teil des Eileiters befindet sich der Uterus (Eihälter), in dem die porige Kalkschale (1), genannt Eierschale, entsteht.",
    "de|Vogelei|Im sich anschließenden Isthmus des Eileiters erfolgt die Bildung der Schalenhaut",
    "de|Vogelei|Geschieht dies, bildet sich an der Dotterkugel eine Keimscheibe; hier wächst der Embryo oder Keim heran.",
    "de|Vogelei|aus der später die Hagelschnüre (Chalazae) hervorgehen.",
    "de|Luftkammer|Die Luftkammer eines Vogeleis liegt zwischen Eihaut (Schalenhaut) und Kalkschale, und zwar immer am stumpfen Ende des Eis.",
    "de|Luftkammer|Sie wird in dem Maße größer, wie der Inhalt der Eihaut schrumpft.",
    "de|Luftkammer|Aus dem Eiklar verdunstet Wasser durch die Eihaut und die Kalkschale nach außen.",
    "de|Hühnerei|Sie ist durch die Schalenhaut abgeschlossen, enthält jedoch Poren, die für die Entwicklung des Embryos wichtig sind.",
    "de|Hühnerei|Die meisten Eier moderner Hühnerrassen und insbesondere die der üblichen Legehennen haben ein Gewicht von 50–60 g.",
  ],
  "v-gluehbirne-innen": [
    "de|Glühlampe|Die Glühlampe besteht aus einem Sockel einschließlich der elektrischen Stromzuführungen im Quetschfuß und einem Glaskolben, der den Glühfaden und dessen Halterung vor der Außenumgebung abschirmt.",
    "de|Glühlampe|Der Metallfaden hat die Form einer Glühwendel (Glühfaden).",
    "de|Glühlampe|Fließt ein ausreichend starker elektrischer Strom durch den Faden, wird dieser so stark erhitzt (joulesche Wärme), dass er glüht.",
    "de|Glühlampe|Die Temperatur der Glühwendel beträgt je nach Bauform ca. 1500–3000 °C",
    "de|Glühlampe|da bei gewöhnlichen Glühlampen nur ca. 2,2 % der elektrischen Energie in Licht gewandelt wird.",
    "de|Glühlampe|Der bei weitem größte Teil der Energie wird hingegen im infraroten Bereich als Wärmestrahlung abgestrahlt.",
    "de|Glühlampe|Im Jahre 1911 entdeckte Irving Langmuir, dass durch die Verwendung eines Argon-Stickstoff-Gemisches in einer Glühlampe die Lebensdauer des Wolfram-Glühfadens verlängert wird.",
    "de|Glühlampe|Traditionelle Glühlampen besitzen aus Blech gefertigte Edisonsockel, in die der Lampenkolben eingekittet ist.",
    "de|Glühlampe|Der Sockel einer Glühlampe dient dazu, sie in einer Lampenfassung zu fixieren und elektrisch zu kontaktieren.",
  ],
};

const visuals = [
  {
    id: "v-ei-innen",
    type: "reveal",
    category_id: "science",
    min_age: 6,
    difficulty: 1,
    data_kind: "drawing",
    config: {
      scene: "egg",
      parts: [
        { key: "shell", x: 50, y: 23, side: "right" },
        { key: "germ", x: 51.25, y: 36.5, side: "right" },
        { key: "air", x: 18, y: 50, side: "right" },
        { key: "chalaza", x: 71.5, y: 50, side: "right" },
        { key: "yolk", x: 54, y: 58, side: "right" },
        { key: "white", x: 35, y: 66, side: "left" },
        { key: "membrane", x: 50, y: 75.5, side: "right" },
      ],
    },
    title: "Blick ins Innere: ein Ei",
    goal: "Du kannst die Teile eines Hühnereis benennen und erklären, warum die Luftkammer mit der Zeit größer wird.",
    intro: "Von außen ist ein Ei eine glatte Schale. Zieh die Linie nach links und schau hinein: Schalenhaut, Luftkammer, Eiklar, Dotter – und die Hagelschnüre, die ihn halten.",
    note: "Eigene, vereinfachte Zeichnung eines Hühnereis im Schnitt, das stumpfe Ende links. Größen und Abstände sind nicht maßstäblich.",
    labels: {
      outside: "Außen", inside: "Innen", slider: "Linie zwischen außen und innen",
      shell: "Kalkschale mit Poren", germ: "Keimscheibe", air: "Luftkammer", chalaza: "Hagelschnur", yolk: "Dotter (Eigelb)", white: "Eiklar (Eiweiß)", membrane: "Schalenhaut",
    },
    explain: "Die Schale ist eine porige Kalkschale; innen liegt die Schalenhaut. Am stumpfen Ende liegt zwischen beiden die Luftkammer. Im Eiklar schwebt der Dotter, gehalten von den Hagelschnüren; auf ihm liegt die Keimscheibe, wo in einem befruchteten Ei der Embryo heranwächst. Die meisten Eier üblicher Legehennen wiegen 50 bis 60 Gramm.",
    predict: {
      question: "Je älter ein Ei ist, desto größer ist seine Luftkammer. Warum?",
      options: ["Durch die Poren wird Luft hineingedrückt", "Aus dem Eiklar verdunstet Wasser, der Inhalt schrumpft", "Der Dotter wird mit der Zeit kleiner"],
      feedback: "Aus dem Eiklar verdunstet Wasser durch die Schalenhaut und die Kalkschale nach außen. In dem Maß, wie der Inhalt schrumpft, wächst die Luftkammer am stumpfen Ende.",
    },
    predict_correct: 1,
    apply: "Zieh die Linie ganz nach links und nenne die Teile von außen nach innen – von der Schale bis zur Keimscheibe.",
    sources: [W("Vogelei"), W("Luftkammer"), W("Hühnerei")],
    links: [],
    verification_status: "ai_checked",
    status: "published",
    translations: {
      en: {
        title: "A look inside: an egg",
        goal: "You can name the parts of a hen's egg and explain why the air cell gets bigger over time.",
        intro: "From the outside an egg is a smooth shell. Drag the line to the left and look inside: shell membrane, air cell, egg white, yolk – and the chalazae that hold it.",
        note: "Own, simplified drawing of a hen's egg in section, the blunt end on the left. Sizes and distances are not to scale.",
        labels: {
          outside: "Outside", inside: "Inside", slider: "Line between outside and inside",
          shell: "Chalky shell with pores", germ: "Germinal disc", air: "Air cell", chalaza: "Chalaza", yolk: "Yolk", white: "Egg white", membrane: "Shell membrane",
        },
        explain: "The shell is a porous chalky shell; inside it lies the shell membrane. At the blunt end the air cell sits between the two. The yolk floats in the egg white, held by the chalazae; on it lies the germinal disc, where in a fertilised egg the embryo grows. Most eggs of common laying hens weigh 50 to 60 grams.",
        predict: {
          question: "The older an egg, the bigger its air cell. Why?",
          options: ["Air is pushed in through the pores", "Water evaporates from the egg white, the contents shrink", "The yolk gets smaller over time"],
          feedback: "Water evaporates from the egg white through the shell membrane and the shell. As the contents shrink, the air cell at the blunt end grows.",
        },
        apply: "Drag the line all the way to the left and name the parts from the outside in – from the shell to the germinal disc.",
      },
    },
  },
  {
    id: "v-gluehbirne-innen",
    type: "reveal",
    category_id: "technology",
    min_age: 10,
    difficulty: 1,
    data_kind: "drawing",
    config: {
      scene: "bulb",
      parts: [
        { key: "glass", x: 32, y: 21, side: "right" },
        { key: "coil", x: 50, y: 32, side: "right" },
        { key: "light", x: 50, y: 40, side: "right", late: true },
        { key: "supports", x: 43.5, y: 41, side: "left" },
        { key: "leads", x: 50, y: 58, side: "right" },
        { key: "base", x: 61, y: 74, side: "right" },
        { key: "contact", x: 50, y: 87, side: "right" },
      ],
    },
    title: "Blick ins Innere: eine Glühbirne",
    goal: "Du kannst erklären, wie eine klassische Glühlampe aufgebaut ist und warum sie so viel Wärme und so wenig Licht erzeugt.",
    intro: "Von außen ist die Glühbirne ein Glaskolben auf einem Schraubsockel. Zieh die Linie nach links: Innen glüht ein dünner Metallfaden, gehalten von Drähten, versorgt durch den Sockel.",
    note: "Eigene, vereinfachte Zeichnung einer klassischen Glühlampe mit Schraubsockel (Edisonsockel); außen als mattes Glas gezeichnet. Nicht maßstäblich.",
    labels: {
      outside: "Außen", inside: "Innen", slider: "Linie zwischen außen und innen",
      glass: "Glaskolben mit Füllgas", coil: "Glühwendel", light: "nur ca. 2,2 % werden Licht", supports: "Halterung", leads: "Stromzuführungen", base: "Edisonsockel", contact: "Kontakt",
    },
    explain: "Strom fließt über den Sockel und die Stromzuführungen durch den dünnen Metallfaden, die Glühwendel. Er wird so stark erhitzt, dass er glüht – je nach Bauform auf etwa 1500 bis 3000 °C. Der Glaskolben schirmt Faden und Halterung von außen ab; ein Gasgemisch aus Argon und Stickstoff verlängert die Lebensdauer des Wolfram-Fadens. Nur etwa 2,2 % der elektrischen Energie werden dabei zu Licht, der weitaus größte Teil wird als Wärmestrahlung abgegeben.",
    predict: {
      question: "Wie viel der elektrischen Energie macht eine gewöhnliche Glühlampe zu Licht?",
      options: ["Nur etwa 2 %", "Etwa ein Drittel", "Etwa 90 %"],
      feedback: "Nur etwa 2,2 % – der bei weitem größte Teil wird als Wärmestrahlung im Infrarot abgegeben. Deshalb wird eine Glühbirne so heiß.",
    },
    predict_correct: 0,
    apply: "Folge dem Strom: Zieh die Linie Stück für Stück nach links und nenne die Teile vom Kontakt bis zur Glühwendel.",
    sources: [W("Glühlampe")],
    links: [],
    verification_status: "ai_checked",
    status: "published",
    translations: {
      en: {
        title: "A look inside: a light bulb",
        goal: "You can explain how a classic incandescent bulb is built and why it makes so much heat and so little light.",
        intro: "From the outside a light bulb is a glass globe on a screw base. Drag the line to the left: inside a thin metal filament glows, held by wires and fed through the base.",
        note: "Own, simplified drawing of a classic incandescent bulb with a screw base (Edison base); drawn as frosted glass outside. Not to scale.",
        labels: {
          outside: "Outside", inside: "Inside", slider: "Line between outside and inside",
          glass: "Glass bulb with fill gas", coil: "Filament coil", light: "only about 2.2% becomes light", supports: "Supports", leads: "Lead-in wires", base: "Edison base", contact: "Contact",
        },
        explain: "Current flows through the base and the lead-in wires into the thin metal filament, the coil. It is heated so strongly that it glows – depending on the design, to about 1,500 to 3,000 °C. The glass bulb shields filament and supports from the outside; a mixture of argon and nitrogen extends the life of the tungsten filament. Only about 2.2% of the electrical energy becomes light; by far the largest part is given off as heat radiation.",
        predict: {
          question: "How much of the electrical energy does an ordinary incandescent bulb turn into light?",
          options: ["Only about 2%", "About a third", "About 90%"],
          feedback: "Only about 2.2% – by far the largest part is given off as heat radiation in the infrared. That is why a light bulb gets so hot.",
        },
        apply: "Follow the current: move the line to the left bit by bit and name the parts from the contact to the coil.",
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
