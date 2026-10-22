// The people of the "Persönlichkeiten" clips (Lebenslinie.tsx). Every station is quoted word for word from the
// German Wikipedia article in the clip's content batch (content/_batches/2026-10-people-1.mjs, checked by
// scripts/content/verify-evidence.mjs). Only people who died long ago and are known for what they did.
import type { Person } from "./clips/Lebenslinie";

export const PEOPLE: Person[] = [
  {
    id: "v-person-curie",
    color: "#41c7b4",
    name: "Marie Curie",
    lived: { de: "1867–1934", en: "1867–1934" },
    role: { de: "Physikerin und Chemikerin", en: "physicist and chemist" },
    topic: { de: "Persönlichkeiten", en: "People" },
    stations: [
      { year: 1867, de: "Geboren in Warschau", en: "Born in Warsaw" },
      { year: 1891, de: "Studium an der Sorbonne in Paris", en: "Studies at the Sorbonne in Paris" },
      { year: 1903, de: "Nobelpreis für Physik (geteilt)", en: "Nobel Prize in Physics (shared)" },
      { year: 1911, de: "Nobelpreis für Chemie – ihr zweiter", en: "Nobel Prize in Chemistry – her second" },
    ],
  },
  {
    id: "v-person-gutenberg",
    color: "#e2ab4f",
    name: "Johannes Gutenberg",
    lived: { de: "um 1400–1468", en: "c. 1400–1468" },
    role: { de: "Erfinder des Buchdrucks", en: "inventor of printing" },
    topic: { de: "Persönlichkeiten", en: "People" },
    stations: [
      { year: 1400, approx: true, de: "Geboren in Mainz", en: "Born in Mainz" },
      { year: 1450, de: "Ab jetzt: Druck mit beweglichen Lettern", en: "From now on: printing with movable type" },
      { year: 1452, de: "Die Gutenberg-Bibel entsteht (bis 1454)", en: "The Gutenberg Bible is made (until 1454)" },
      { year: 1997, de: "„Time“: Erfindung des Jahrtausends", en: "Time: invention of the millennium" },
    ],
  },
  {
    id: "v-person-lovelace",
    color: "#9794ff",
    name: "Ada Lovelace",
    lived: { de: "1815–1852", en: "1815–1852" },
    role: { de: "Mathematikerin", en: "mathematician" },
    topic: { de: "Persönlichkeiten", en: "People" },
    stations: [
      { year: 1815, de: "Geboren in London, Tochter von Lord Byron", en: "Born in London, daughter of Lord Byron" },
      { year: 1833, de: "Lernt Charles Babbage und seine Rechenmaschine kennen", en: "Meets Charles Babbage and his calculating engine" },
      { year: 1843, de: "Veröffentlicht ein Programm für Babbages Maschine", en: "Publishes a program for Babbage's engine" },
      { year: 1852, de: "Stirbt mit nur 36 Jahren", en: "Dies aged only 36" },
    ],
  },
];
