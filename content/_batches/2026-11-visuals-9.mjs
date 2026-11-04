// „Blick ins Innere“, three more (04.11.2026): a tooth, the Sun and a tree trunk – own drawings (components/viz/reveal/scenes.tsx),
// every label and figure backed by the quotes in `evidence` (German Wikipedia, checked word for word).
//   node content/_batches/2026-11-visuals-9.mjs      (idempotent; rewrites content/visuals.json)
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const W = (title, name = title.replaceAll("_", " ")) => ({ name: "Wikipedia: " + name, url: "https://de.wikipedia.org/wiki/" + title });

export const evidence = {
  "v-zahn-innen": [
    "de|Zahn|Jeder (echte) Zahn besteht aus der Zahnkrone (Corona dentis), dem Zahnhals (Cervix dentis, seltener: Collum dentis) und der Zahnwurzel (Radix dentis) und ist aus mehreren Schichten aufgebaut.",
    "de|Zahn|Bei einem gesunden Zahn sieht man nur den Zahnschmelz, der wie eine Glasur das innen liegende Zahnbein (Dentin) bedeckt.",
    "de|Zahn|Das Dentin wiederum umschließt das Zahnmark (Pulpa).",
    "de|Zahn|Die Wurzel wird bis zum Zahnhals von Wurzelzement (Cementum) und Wurzelhaut umschlossen.",
    "de|Zahn|Der Zahnschmelz (Latein: Enamelum) ist die härteste Substanz des menschlichen Körpers",
    "de|Zahn|Unter dem Zahnschmelz liegt das Zahnbein. Es stellt die Hauptmasse des Zahnes dar.",
    "de|Zahn|die Pulpa (Zahnmark), das von Blutgefäßen und Nervenfasern durchzogen wird und den Zahn ernährt.",
    "de|Zahn|Doch hat die Verbindung zum Kieferknochen, in dem jeder Zahn in seinem Zahnfach (Alveole) aufgehängt ist, eine gewisse Elastizität",
    "de|Zahn|An ihnen ist der Zahn federnd befestigt",
    "de|Zahn|Der Mensch verfügt normalerweise über insgesamt 32 bleibende Zähne (inklusive der Weisheitszähne)",
    "de|Zahn|Das Milchgebiss umfasst 20 Milchzähne, jeweils 5 pro Quadrant.",
    "de|Zahnpulpa|Das Pulpencavum reicht von der Zahnkrone bis an die Spitze der Zahnwurzel(n).",
  ],
  "v-sonne-innen": [
    "de|Sonne|Die Hälfte der Sonnenmasse konzentriert sich innerhalb von 25 % des Sonnenradius",
    "de|Sonne|Die Fallbeschleunigung am Rand dieser Kernzone ist 8-fach größer als an der Sonnenoberfläche",
    "de|Sonne|Da die Temperatur dort mit 15,6 Mio. K (Kelvin) vergleichsweise niedrig ist",
    "de|Sonne|Die durch die Sonnenstrahlung freigesetzte Energie beruht auf der Kernfusion von Wasserstoff zu Helium",
    "de|Sonne|werden 99 % der Fusionsleistung",
    "de|Sonne|innerhalb der dichten, heißen Kernzone frei.",
    "de|Sonne|Bei 71 % des Radius erreicht er den adiabatischen Wert, die Schichtung wird labil. Dies definiert die Grenze der sogenannten Strahlungszone. Oberhalb wird der Wärmestrom zunehmend konvektiv transportiert.",
    "de|Sonne|Diese Zone heißt Photosphäre, griechisch für „Kugelschale des Lichts“.",
    "de|Sonne|Oberhalb der Photosphäre liegt die Chromosphäre.",
    "de|Sonne|die meist knapp 2.000 km dicke Chromosphäre",
    "de|Sonne|als rötlich leuchtende Linie zu sehen ist",
    "de|Sonne|Oberhalb der Chromosphäre befindet sich die Korona.",
    "de|Sonne|das Zweihundert- bis Fünfhundertfache der Photosphärentemperatur, wird über den Heizmechanismus der Korona spekuliert.",
    "de|Sonne|Die Oberfläche der Sonne zeigt eine wechselnde Zahl von Sonnenflecken, die in Zusammenhang mit starken Magnetfeldern stehen.",
  ],
  "v-baum-innen": [
    "de|Baum|Ganz innen befinden sich das aus Primärgewebe bestehende Mark und das tote Kernholz.",
    "de|Baum|Weiter außen befindet sich das Splintholz, das der Leitung und Speicherung dient",
    "de|Baum|Die äußerste Schicht bildet die Baumrinde.",
    "de|Baum|Sie besteht aus der Bastschicht, die in Wasser gelöste Nährstoffe transportiert, und der Borke, die den Stamm vor Umwelteinflüssen (UV-Einstrahlung, Hitze, mechanische und biotische Schäden) schützt.",
    "de|Baum|Zwischen der Bastschicht und dem Holz befindet sich bei Gymnospermen und Dikotyledonen das Kambium.",
    "de|Baum|Diese Wachstumsschicht bildet durch sekundäres Dickenwachstum nach innen Holz (Xylem) und nach außen Bast (Phloem).",
    "de|Holz|Als Splintholz bezeichnet man den Bereich des Stammes, der aktiv am Wasser- und Nährstofftransport und der Speicherung teilnimmt.",
    "de|Holz|Ist der Kernbereich deutlich durch eine dunkle Färbung zu erkennen, spricht man von Kernholzbäumen",
    "de|Holz|Wenn kein Farbunterschied zu erkennen ist, aber über den verringerten Feuchtigkeitsgehalt darauf geschlossen werden kann, dass der Innenbereich verkernt ist, spricht man von Reifholzbäumen",
    "de|Jahresring|Jahresringe entstehen nur dort, wo es durch die klimatischen Bedingungen zu einer vorübergehenden Ruhe der Teilungsaktivität des Kambiums kommt.",
    "de|Jahresring|Ursächlich dafür können Winter im Jahreszeitenklima sein oder Trockenzeiten",
  ],
};

const base = { type: "reveal", category_id: "science", min_age: 10, difficulty: 2, data_kind: "drawing", links: [], verification_status: "ai_checked", status: "published" };
const slider = { de: { outside: "Außen", inside: "Innen", slider: "Linie zwischen außen und innen" }, en: { outside: "Outside", inside: "Inside", slider: "Line between outside and inside" } };

const visuals = [
  {
    id: "v-zahn-innen", ...base,
    config: {
      scene: "tooth",
      parts: [
        { key: "enamel", x: 32.5, y: 25, side: "left", late: true },
        { key: "crown", x: 66, y: 30, side: "right" },
        { key: "dentin", x: 60, y: 40, side: "right" },
        { key: "pulp", x: 50, y: 43, side: "left" },
        { key: "neck", x: 64.5, y: 51, side: "right" },
        { key: "cementum", x: 65.5, y: 65, side: "right" },
        { key: "vessels", x: 44.5, y: 75, side: "left" },
        { key: "root", x: 60, y: 80, side: "right" },
        { key: "bone", x: 85, y: 88, side: "left" },
      ],
    },
    title: "Blick ins Innere: ein Zahn",
    goal: "Du kannst die Teile eines Zahns benennen und sagen, woraus er aufgebaut ist.",
    intro: "Von außen sieht man nur die weiße Zahnkrone über dem Zahnfleisch. Zieh die Linie nach links und schau hinein: unter dem Schmelz das Dentin, ganz innen das Zahnmark – und Wurzeln tief im Kiefer.",
    note: "Eigene, vereinfachte Schnittzeichnung eines Backenzahns mit zwei Wurzeln, kein medizinisches Modell; nicht maßstäblich.",
    labels: { ...slider.de, crown: "Zahnkrone", neck: "Zahnhals", root: "Zahnwurzel", enamel: "Zahnschmelz", dentin: "Dentin (Zahnbein)", pulp: "Zahnmark (Pulpa)", vessels: "Gefäße und Nerven", cementum: "Wurzelzement", bone: "Kieferknochen" },
    explain: "Jeder Zahn besteht aus Krone, Hals und Wurzel. Sichtbar ist nur der Zahnschmelz: Er bedeckt das Dentin wie eine Glasur und ist die härteste Substanz des menschlichen Körpers. Das Dentin bildet die Hauptmasse des Zahns und umschließt das Zahnmark, die Pulpa – sie reicht von der Krone bis in die Wurzelspitzen und wird von Blutgefäßen und Nervenfasern durchzogen, die den Zahn ernähren. An der Wurzel liegt Wurzelzement; jeder Zahn hängt federnd in seinem Zahnfach im Kieferknochen. Erwachsene haben normalerweise 32 bleibende Zähne, das Milchgebiss hat 20.",
    predict: {
      question: "Welcher Teil des Zahns ist die härteste Substanz im ganzen menschlichen Körper?",
      options: ["Der Zahnschmelz", "Das Dentin", "Der Wurzelzement"],
      feedback: "Der Zahnschmelz: Er liegt wie eine Glasur über dem Dentin und ist die härteste Substanz des menschlichen Körpers.",
    },
    predict_correct: 0,
    apply: "Zieh die Linie von außen nach innen und nenne jede Schicht vom Schmelz bis zum Zahnmark.",
    sources: [W("Zahn"), W("Zahnpulpa")],
    translations: {
      en: {
        title: "A look inside: a tooth",
        goal: "You can name the parts of a tooth and say what it is made of.",
        intro: "From the outside you only see the white crown above the gum. Drag the line to the left and look inside: under the enamel the dentin, deep inside the pulp – and roots deep in the jaw.",
        note: "Own, simplified section drawing of a molar with two roots, not a medical model; not to scale.",
        labels: { ...slider.en, crown: "Crown", neck: "Neck", root: "Root", enamel: "Enamel", dentin: "Dentin", pulp: "Pulp", vessels: "Vessels and nerves", cementum: "Cementum", bone: "Jawbone" },
        explain: "Every tooth consists of crown, neck and root. Only the enamel is visible: it covers the dentin like a glaze and is the hardest substance in the human body. The dentin makes up most of the tooth and surrounds the pulp – it reaches from the crown into the tips of the roots and is threaded with blood vessels and nerve fibres that nourish the tooth. Cementum covers the root; every tooth hangs springily in its socket in the jawbone. Adults normally have 32 permanent teeth, children's milk teeth number 20.",
        predict: {
          question: "Which part of the tooth is the hardest substance in the whole human body?",
          options: ["The enamel", "The dentin", "The cementum"],
          feedback: "The enamel: it lies over the dentin like a glaze and is the hardest substance in the human body.",
        },
        apply: "Move the line from outside in and name every layer from the enamel to the pulp.",
      },
    },
  },
  {
    id: "v-sonne-innen", ...base,
    config: {
      scene: "sun",
      parts: [
        { key: "chromo", x: 50, y: 9, side: "right" },
        { key: "corona", x: 15, y: 77.5, side: "right", late: true },
        { key: "radiation", x: 50, y: 31, side: "right" },
        { key: "core", x: 50, y: 50, side: "right" },
        { key: "convection", x: 76, y: 65, side: "left" },
        { key: "photo", x: 78, y: 22, side: "left" },
      ],
    },
    title: "Blick ins Innere: die Sonne",
    goal: "Du kannst die Schichten der Sonne von innen nach außen nennen und sagen, wo ihre Energie entsteht.",
    intro: "Von außen sieht man die leuchtende Oberfläche mit dunklen Sonnenflecken. Zieh die Linie nach links und schau hinein: Kern, Strahlungszone, Konvektionszone – und außen eine überraschend heiße Hülle.",
    note: "Eigene, vereinfachte Schnittzeichnung. Kern, Strahlungs- und Konvektionszone sind maßstäblich (bis 25 % und 71 % des Radius); Chromosphäre und Korona sind stark vereinfacht.",
    labels: { ...slider.de, core: "Kern: Kernfusion", radiation: "Strahlungszone", convection: "Konvektionszone", photo: "Photosphäre (Oberfläche)", chromo: "Chromosphäre", corona: "Korona: viel heißer als die Oberfläche" },
    explain: "Im Kern, innerhalb eines Viertels des Radius, verschmilzt Wasserstoff zu Helium; hier herrschen rund 15,6 Millionen Kelvin, und hier werden 99 % der Fusionsleistung frei. Bis 71 % des Radius wandert die Energie als Strahlung nach außen, darüber wird sie von Gasströmen getragen – die Konvektionszone. Die leuchtende Oberfläche heißt Photosphäre, „Kugelschale des Lichts“; Sonnenflecken darauf hängen mit starken Magnetfeldern zusammen. Darüber liegen die meist knapp 2000 km dicke, rötliche Chromosphäre und die Korona – sie ist 200- bis 500-mal so heiß wie die Photosphäre, und warum, ist noch nicht sicher geklärt.",
    predict: {
      question: "Die äußere Hülle der Sonne, die Korona: Ist sie heißer oder kühler als die leuchtende Oberfläche?",
      options: ["Viel heißer", "Etwas kühler", "Viel kühler"],
      feedback: "Viel heißer: Die Korona hat das 200- bis 500-Fache der Temperatur der Photosphäre. Woher diese Hitze kommt, ist noch nicht sicher geklärt.",
    },
    predict_correct: 0,
    apply: "Zieh die Linie langsam von außen nach innen und sag zu jeder Schicht, wie die Energie dort weiterkommt.",
    sources: [W("Sonne")],
    translations: {
      en: {
        title: "A look inside: the Sun",
        goal: "You can name the layers of the Sun from the inside out and say where its energy comes from.",
        intro: "From the outside you see the shining surface with dark sunspots. Drag the line to the left and look inside: core, radiation zone, convection zone – and on the outside a surprisingly hot shell.",
        note: "Own, simplified section drawing. Core, radiation and convection zone are to scale (to 25 % and 71 % of the radius); chromosphere and corona are greatly simplified.",
        labels: { ...slider.en, core: "Core: nuclear fusion", radiation: "Radiation zone", convection: "Convection zone", photo: "Photosphere (surface)", chromo: "Chromosphere", corona: "Corona: far hotter than the surface" },
        explain: "In the core, within a quarter of the radius, hydrogen fuses into helium; it is about 15.6 million kelvin here, and 99 % of the fusion power is released here. Up to 71 % of the radius the energy travels outwards as radiation, above that it is carried by currents of gas – the convection zone. The shining surface is called the photosphere, 'sphere of light'; sunspots on it are linked to strong magnetic fields. Above lie the reddish chromosphere, usually just under 2,000 km thick, and the corona – it is 200 to 500 times as hot as the photosphere, and why is not yet settled.",
        predict: {
          question: "The Sun's outer shell, the corona: is it hotter or cooler than the shining surface?",
          options: ["Far hotter", "A little cooler", "Far cooler"],
          feedback: "Far hotter: the corona is 200 to 500 times the temperature of the photosphere. Where this heat comes from is not yet settled.",
        },
        apply: "Move the line slowly from outside in and say for each layer how the energy gets on from there.",
      },
    },
  },
  {
    id: "v-baum-innen", ...base,
    config: {
      scene: "trunk",
      parts: [
        { key: "rings", x: 60, y: 27, side: "right" },
        { key: "sapwood", x: 64, y: 40, side: "right" },
        { key: "bark", x: 71, y: 50, side: "right" },
        { key: "heartwood", x: 55, y: 57, side: "left" },
        { key: "bast", x: 68.75, y: 63, side: "right" },
        { key: "cambium", x: 32, y: 75, side: "right", late: true },
        { key: "pith", x: 50, y: 86, side: "left" },
      ],
    },
    title: "Blick ins Innere: ein Baumstamm",
    goal: "Du kannst die Schichten eines Baumstamms von der Borke bis zum Mark benennen und sagen, wo er in die Dicke wächst.",
    intro: "Von außen sieht man nur die raue Borke. Zieh die Linie nach links und schau in den Stamm: Bast, eine dünne Wachstumsschicht, helles Splintholz und dunkles Kernholz.",
    note: "Eigene, vereinfachte Zeichnung eines Stamms, längs aufgeschnitten; oben die Schnittfläche mit Jahresringen. Nicht jeder Baum hat ein farblich abgesetztes Kernholz.",
    labels: { ...slider.de, bark: "Borke", bast: "Bast", cambium: "Kambium: Wachstumsschicht", sapwood: "Splintholz", heartwood: "Kernholz", pith: "Mark", rings: "Jahresringe" },
    explain: "Die Borke schützt den Stamm vor Hitze, UV-Strahlung und Verletzungen. Darunter transportiert der Bast in Wasser gelöste Nährstoffe. Zwischen Bast und Holz liegt das Kambium, die Wachstumsschicht: Es bildet nach innen Holz und nach außen Bast – so wird der Stamm dicker. Das Splintholz leitet Wasser und Nährstoffe und speichert sie; ganz innen liegen das tote Kernholz und das Mark. Jahresringe entstehen, wo das Kambium jedes Jahr eine Ruhepause einlegt, etwa im Winter oder in einer Trockenzeit.",
    predict: {
      question: "Wo wächst ein Baumstamm in die Dicke?",
      options: ["In einer dünnen Schicht zwischen Holz und Rinde", "Im Mark ganz innen", "Gleichmäßig im ganzen Holz"],
      feedback: "In einer dünnen Schicht zwischen Holz und Bast, dem Kambium: Es bildet nach innen Holz und nach außen Bast.",
    },
    predict_correct: 0,
    apply: "Zieh die Linie von außen nach innen und sag zu jeder Schicht, ob sie schützt, leitet oder wächst.",
    sources: [W("Baum"), W("Holz"), W("Jahresring")],
    translations: {
      en: {
        title: "A look inside: a tree trunk",
        goal: "You can name the layers of a tree trunk from the bark to the pith and say where it grows thicker.",
        intro: "From the outside you only see the rough bark. Drag the line to the left and look into the trunk: bast, a thin growing layer, pale sapwood and dark heartwood.",
        note: "Own, simplified drawing of a trunk, cut lengthwise; on top the cut surface with annual rings. Not every tree has a heartwood of a different colour.",
        labels: { ...slider.en, bark: "Bark", bast: "Bast (phloem)", cambium: "Cambium: growing layer", sapwood: "Sapwood", heartwood: "Heartwood", pith: "Pith", rings: "Annual rings" },
        explain: "The bark protects the trunk from heat, UV radiation and damage. Beneath it the bast carries nutrients dissolved in water. Between bast and wood lies the cambium, the growing layer: it forms wood towards the inside and bast towards the outside – that is how the trunk gets thicker. The sapwood carries water and nutrients and stores them; deep inside lie the dead heartwood and the pith. Annual rings form where the cambium pauses every year, for example in winter or in a dry season.",
        predict: {
          question: "Where does a tree trunk grow thicker?",
          options: ["In a thin layer between wood and bark", "In the pith right in the middle", "Evenly throughout the wood"],
          feedback: "In a thin layer between wood and bast, the cambium: it forms wood towards the inside and bast towards the outside.",
        },
        apply: "Move the line from outside in and say for each layer whether it protects, carries or grows.",
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
