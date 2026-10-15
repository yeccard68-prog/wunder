// Content batch (15.10.2026): a new 3D animation – how sound travels – with its check question. AI-checked.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-animations-3d-8.mjs   → the question
//   node content/_batches/2026-10-animations-3d-8.mjs                                   → the animation (idempotent)
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-15";
export const verification = "ai_checked";

export const questions = [
  ["qa-schall", "science", 2, 13, null, "Warum gibt es im Weltall keinen Schall?", ["Weil dort keine Teilchen sind, die schwingen und sich anstoßen können", "Weil es dort zu kalt ist", "Weil die Schwerkraft fehlt", "Weil Schall nur bei Tageslicht entsteht"], 0, "Schall ist eine Schwingung, die Teilchen an ihre Nachbarn weitergeben. Im fast leeren Weltraum fehlen diese Teilchen – Explosionen im All wären in Wirklichkeit lautlos.", "Schall", "Why is there no sound in space?", ["Because there are no particles there that can vibrate and push each other", "Because it is too cold there", "Because there is no gravity", "Because sound only arises in daylight"], "Sound is a vibration that particles pass on to their neighbours. In almost empty space these particles are missing – explosions in space would in reality be silent.", ["Physik", "Akustik"]],
];

const animations = [
  {
    id: "a-schall", scene: "sound", category: "science", timing: [0.7, 1.3], sources: [wiki("Schall"), wiki("Schallgeschwindigkeit"), wiki("Hörfläche")], quiz: "qa-schall", predict: [2, 0],
    de: {
      title: "Wie Schall zu deinem Ohr kommt", summary: "Ein Lautsprecher schubst die Luft an – und eine Welle aus Verdichtungen wandert bis zum Trommelfell.",
      goal: "Du kannst erklären, wie sich Schall durch die Luft ausbreitet und was Tonhöhe und Lautstärke mit der Schwingung zu tun haben.",
      labels: ["Membran", "hell: Verdichtung", "blau: Verdünnung", "dieses Teilchen schwingt nur hin und her", "die Welle wandert → in Luft rund 343 m/s", "doppelte Frequenz: höherer Ton", "größere Auslenkung: lauter", "Trommelfell"],
      steps: [["Ein Lautsprecher hat eine Membran, die schnell vor- und zurückschwingt. Schiebt sie nach vorn, drückt sie die Luftteilchen davor zusammen – eine Verdichtung. Zieht sie zurück, entsteht eine Verdünnung.", 9], ["Die Teilchen selbst wandern nicht mit: Jedes schwingt nur ein wenig hin und her und stößt dabei seine Nachbarn an. Weitergegeben wird nur der Stoß – die Welle. In Luft ist sie bei 20 Grad rund 343 Meter pro Sekunde schnell.", 9], ["Schwingt die Membran schneller, folgen die Verdichtungen dichter aufeinander: Die Frequenz steigt, die Wellenlänge wird kürzer, und wir hören einen höheren Ton. Junge Menschen hören etwa 20 bis 20.000 Schwingungen pro Sekunde.", 9], ["Schwingt die Membran weiter aus, werden Verdichtungen und Verdünnungen stärker: Der Ton wird lauter. Am Ende bringt die Welle das Trommelfell im Ohr zum Schwingen, und das Gehirn macht daraus ein Geräusch. Im luftleeren Raum gibt es keinen Schall – es fehlen die Teilchen.", 10]],
      predict: ["Gleich schwingt die Membran doppelt so schnell. Was hörst du dann?", "Einen höheren Ton", "Einen lauteren Ton", "Den Ton früher als vorher"],
    },
    en: {
      title: "How sound reaches your ear", summary: "A loudspeaker gives the air a push – and a wave of compressions travels all the way to the eardrum.",
      goal: "You can explain how sound travels through the air and what pitch and loudness have to do with the vibration.",
      labels: ["Membrane", "light: compression", "blue: rarefaction", "this particle only swings back and forth", "the wave travels → in air about 343 m/s", "twice the frequency: higher tone", "larger swing: louder", "Eardrum"],
      steps: ["A loudspeaker has a membrane that swings back and forth quickly. When it pushes forward, it squeezes the air particles in front of it together – a compression. When it pulls back, a rarefaction forms.", "The particles themselves don't travel along: each one only swings back and forth a little and nudges its neighbours. Only the push is passed on – the wave. In air at 20 degrees it travels at about 343 metres per second.", "If the membrane vibrates faster, the compressions follow each other more closely: the frequency rises, the wavelength gets shorter, and we hear a higher tone. Young people hear roughly 20 to 20,000 vibrations per second.", "If the membrane swings further, compressions and rarefactions get stronger: the sound gets louder. In the end the wave makes the eardrum vibrate, and the brain turns this into a sound. In a vacuum there is no sound – there are no particles."],
      predict: ["In a moment the membrane vibrates twice as fast. What do you hear then?", "A higher tone", "A louder tone", "The tone earlier than before"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
