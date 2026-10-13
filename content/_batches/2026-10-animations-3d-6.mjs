// Content batch (13.10.2026): three new 3D animations – pulleys, electric circuit, water cycle – with their check questions. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-3d-6.mjs   → the questions
//   node content/_batches/2026-10-animations-3d-6.mjs                                   → the animations (idempotent)
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-13";
export const verification = "ai_checked";

export const questions = [
  ["qa-flaschenzug", "science", 2, 10, null, "Eine Last hängt an einem Flaschenzug mit vier tragenden Seilstücken. Wie viel Seil muss man ziehen, um sie einen Meter zu heben?", ["1 Meter", "2 Meter", "4 Meter", "8 Meter"], 2, "Vier Seilstücke müssen je einen Meter kürzer werden – zusammen vier Meter. Dafür braucht man nur ein Viertel der Kraft. Was man an Kraft spart, zahlt man an Weg.", "Flaschenzug", "A load hangs on a block and tackle with four carrying pieces of rope. How much rope has to be pulled to lift it one metre?", ["1 metre", "2 metres", "4 metres", "8 metres"], "Four pieces of rope each have to get one metre shorter – four metres in total. In return only a quarter of the force is needed. What is saved in force is paid for in distance.", ["Mechanik"]],
  ["qa-stromkreis", "technology", 2, 10, null, "Zwei gleiche Lampen hängen hintereinander – in Reihe – an einer Batterie. Wie leuchten sie im Vergleich zu einer einzelnen Lampe?", ["Dunkler", "Heller", "Genauso hell", "Nur die erste leuchtet"], 0, "In der Reihenschaltung teilen sich die Lampen die Spannung der Batterie, und es fließt weniger Strom. In der Parallelschaltung bekommt jede Lampe die volle Spannung.", "Reihenschaltung", "Two identical lamps are connected one after the other – in series – to a battery. How do they shine compared with a single lamp?", ["Dimmer", "Brighter", "Just as bright", "Only the first one shines"], "In a series circuit the lamps share the voltage of the battery, and less current flows. In a parallel circuit each lamp gets the full voltage.", ["Elektrizität"]],
  ["qa-wasserkreislauf", "earth", 1, 10, null, "Was treibt den Wasserkreislauf der Erde an?", ["Der Mond", "Die Drehung der Erde", "Der Wind", "Die Sonne"], 3, "Die Wärme der Sonne lässt Wasser verdunsten. Der Wasserdampf steigt auf, kühlt ab, bildet Wolken und fällt als Regen oder Schnee zurück – die Schwerkraft bringt das Wasser dann wieder zum Meer.", "Wasserkreislauf", "What drives the Earth's water cycle?", ["The Moon", "The rotation of the Earth", "The wind", "The Sun"], "The Sun's heat makes water evaporate. The water vapour rises, cools, forms clouds and falls back as rain or snow – gravity then takes the water back to the sea.", ["Wasser", "Klima"]],
];

const animations = [
  {
    id: "a-flaschenzug", scene: "pulley", category: "science", timing: [0.68, 1.4], sources: [wiki("Flaschenzug"), wiki("Goldene_Regel_der_Mechanik")], quiz: "qa-flaschenzug", predict: [1, 0],
    de: {
      title: "Wie ein Flaschenzug Kraft spart", summary: "Mit Seil und Rollen hebt man Lasten, für die die eigene Kraft nicht reicht – aber das Seil wird länger.",
      goal: "Du kannst erklären, was eine feste und eine lose Rolle bewirken und warum weniger Kraft immer mehr Seilweg bedeutet.",
      labels: ["feste Rolle", "lose Rolle", "Last", "Kraft", "gleiche Kraft – nur die Richtung ändert sich", "2 Seile tragen: halbe Kraft", "doppelt so viel Seil", "4 Seile tragen: ein Viertel der Kraft"],
      steps: [["Eine feste Rolle hängt an der Decke. Sie spart keine Kraft, lenkt sie aber um: Man zieht nach unten, und die Last geht nach oben.", 7], ["Bei einer losen Rolle hängt die Last an der Rolle selbst. Zwei Seilstücke tragen sie gemeinsam – an jedem zieht nur die halbe Last. Man braucht also nur halb so viel Kraft.", 9], ["Dafür muss man doppelt so viel Seil ziehen: Soll die Last einen Meter steigen, müssen beide Seilstücke einen Meter kürzer werden.", 8], ["Ein Flaschenzug verbindet feste und lose Rollen. Tragen vier Seilstücke die Last, reicht ein Viertel der Kraft – bei vierfachem Seilweg. Das ist die Goldene Regel der Mechanik: Was man an Kraft spart, muss man an Weg zusetzen.", 10]],
      predict: ["Jetzt hängt die Last an einer losen Rolle, zwei Seilstücke tragen sie. Wie viel Kraft braucht man zum Heben?", "Die Hälfte", "Genauso viel wie vorher", "Doppelt so viel"],
    },
    en: {
      title: "How a block and tackle saves force", summary: "With rope and pulleys you can lift loads your own strength is not enough for – but the rope gets longer.",
      goal: "You can explain what a fixed and a movable pulley do, and why less force always means more rope to pull.",
      labels: ["Fixed pulley", "Movable pulley", "Load", "Force", "same force – only the direction changes", "2 ropes carry: half the force", "twice as much rope", "4 ropes carry: a quarter of the force"],
      steps: ["A fixed pulley hangs from the ceiling. It saves no force but redirects it: you pull down and the load goes up.", "With a movable pulley the load hangs on the pulley itself. Two pieces of rope carry it together – each bears only half the load. So you need only half as much force.", "In return you have to pull twice as much rope: for the load to rise one metre, both pieces of rope have to get one metre shorter.", "A block and tackle combines fixed and movable pulleys. If four pieces of rope carry the load, a quarter of the force is enough – with four times the rope. This is the golden rule of mechanics: what you save in force you have to add in distance."],
      predict: ["Now the load hangs on a movable pulley and two pieces of rope carry it. How much force is needed to lift it?", "Half", "The same as before", "Twice as much"],
    },
  },
  {
    id: "a-stromkreis", scene: "circuit", category: "technology", timing: [0.7, 1.3], sources: [wiki("Stromkreis"), wiki("Reihenschaltung"), wiki("Parallelschaltung")], quiz: "qa-stromkreis", predict: [2, 0],
    de: {
      title: "Wie ein Stromkreis funktioniert", summary: "Strom fließt nur im geschlossenen Kreis – und es macht einen Unterschied, wie man Lampen anschließt.",
      goal: "Du kannst erklären, warum ein Stromkreis geschlossen sein muss, und Reihen- und Parallelschaltung unterscheiden.",
      labels: ["Batterie", "Schalter", "Lampe", "offen: kein Strom", "geschlossen: Elektronen fließen", "in Reihe: beide dunkler", "parallel: beide hell"],
      steps: [["Ein Stromkreis besteht aus einer Stromquelle, Leitungen und einem Verbraucher – hier Batterie, Kupferdraht und Lampe. Ist der Schalter offen, ist der Kreis unterbrochen: Es fließt kein Strom.", 8], ["Wird der Schalter geschlossen, drückt die Batterie Elektronen durch den Draht – vom Minuspol einmal im Kreis zum Pluspol. In der Lampe geben sie Energie ab: Sie leuchtet.", 8], ["Kommt eine zweite Lampe in denselben Kreis, liegen beide in Reihe. Sie teilen sich die Spannung der Batterie, es fließt weniger Strom – beide leuchten dunkler. Fällt eine aus, ist der Kreis unterbrochen.", 10], ["Bei der Parallelschaltung hat jede Lampe ihren eigenen Zweig und die volle Spannung: Beide leuchten hell, und fällt eine aus, brennt die andere weiter. So sind die Steckdosen im Haus geschaltet. Die Batterie ist allerdings schneller leer.", 10]],
      predict: ["Eine zweite Lampe kommt in denselben Stromkreis – hintereinander geschaltet. Was passiert?", "Beide leuchten dunkler", "Beide leuchten so hell wie die eine zuvor", "Nur die erste leuchtet"],
    },
    en: {
      title: "How an electric circuit works", summary: "Current only flows in a closed loop – and it makes a difference how lamps are connected.",
      goal: "You can explain why a circuit has to be closed, and tell series from parallel connection.",
      labels: ["Battery", "Switch", "Lamp", "open: no current", "closed: electrons flow", "in series: both dimmer", "in parallel: both bright"],
      steps: ["A circuit consists of a source, wires and a consumer – here a battery, copper wire and a lamp. If the switch is open, the loop is interrupted: no current flows.", "When the switch is closed, the battery pushes electrons through the wire – from the negative terminal once round to the positive terminal. In the lamp they give off energy: it lights up.", "If a second lamp is added to the same loop, the two are in series. They share the battery's voltage and less current flows – both shine more dimly. If one fails, the loop is interrupted.", "In a parallel circuit each lamp has its own branch and the full voltage: both shine brightly, and if one fails the other stays on. This is how the sockets in a house are wired. The battery does run down faster, though."],
      predict: ["A second lamp is added to the same circuit – connected one after the other. What happens?", "Both shine more dimly", "Both shine as brightly as the single one did", "Only the first one shines"],
    },
  },
  {
    id: "a-wasserkreislauf", scene: "watercycle", category: "earth", timing: [0.7, 1.3], sources: [wiki("Wasserkreislauf"), wiki("Verdunstung")], quiz: "qa-wasserkreislauf", predict: [2, 1],
    de: {
      title: "Wie der Wasserkreislauf funktioniert", summary: "Dasselbe Wasser ist seit Jahrmilliarden unterwegs: vom Meer in die Wolken, als Regen aufs Land und zurück.",
      goal: "Du kannst die vier Stationen des Wasserkreislaufs nennen und erklären, was Sonne und Schwerkraft dabei tun.",
      labels: ["Verdunstung", "Kondensation", "Niederschlag", "Abfluss", "Grundwasser", "Meer", "Sonne"],
      steps: [["Die Sonne erwärmt das Meer. Wasser verdunstet: Es wird zu unsichtbarem Wasserdampf und steigt mit der warmen Luft auf. Das Salz bleibt im Meer zurück.", 8], ["In der Höhe kühlt die Luft ab. Der Wasserdampf kondensiert zu winzigen Tröpfchen – eine Wolke entsteht. Der Wind treibt sie über das Land.", 8], ["Am Gebirge muss die Luft weiter aufsteigen und kühlt noch mehr ab. Die Tröpfchen wachsen, bis sie zu schwer werden: Es regnet oder schneit.", 8], ["Das Wasser fließt in Bächen und Flüssen bergab oder versickert und wandert als Grundwasser langsam weiter. Am Ende erreicht es wieder das Meer – der Kreislauf beginnt von vorn.", 9]],
      predict: ["Die Wolke zieht gegen das Gebirge. Die Luft muss aufsteigen und kühlt weiter ab. Was passiert?", "Die Wolke löst sich auf", "Es regnet oder schneit", "Die Wolke steigt immer höher und verschwindet"],
    },
    en: {
      title: "How the water cycle works", summary: "The same water has been on the move for billions of years: from the sea into the clouds, onto the land as rain, and back.",
      goal: "You can name the four stages of the water cycle and explain what the Sun and gravity do in it.",
      labels: ["Evaporation", "Condensation", "Precipitation", "Run-off", "Groundwater", "Sea", "Sun"],
      steps: ["The Sun warms the sea. Water evaporates: it becomes invisible water vapour and rises with the warm air. The salt stays behind in the sea.", "Higher up the air cools. The water vapour condenses into tiny droplets – a cloud forms. The wind drives it over the land.", "At the mountains the air has to rise further and cools even more. The droplets grow until they become too heavy: it rains or snows.", "The water flows downhill in streams and rivers, or seeps away and slowly moves on as groundwater. In the end it reaches the sea again – and the cycle starts anew."],
      predict: ["The cloud drifts against the mountains. The air has to rise and cools further. What happens?", "The cloud dissolves", "It rains or snows", "The cloud keeps rising and disappears"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
