import type { Item } from "./types";
import { hash } from "./gamification";

// DEMO COMMUNITY – fictional profiles so the social features can be explored
// without a backend. Replaced by real profiles once Supabase is connected.

export interface Person {
  id: string;
  name: string;
  handle: string;
  bio: string;
  color: string;
  xp: number;
  weekBase: number; // XP this person reaches by the end of a week
  streak: number;
  accuracy: number; // 0..1
  interests: string[];
}

export const PEOPLE: Person[] = [
  { id: "p1", name: "Mara Köhler", handle: "mara.k", bio: "Biologin. Sammelt nutzloses Wissen über Tintenfische.", color: "#0E8F7E", xp: 2140, weekBase: 410, streak: 46, accuracy: 0.86, interests: ["science", "history"] },
  { id: "p2", name: "Jonas Brandt", handle: "jonasb", bio: "Entwickler. Erklärt gern, warum es eigentlich kein Bug ist.", color: "#5552D0", xp: 1620, weekBase: 350, streak: 12, accuracy: 0.78, interests: ["technology"] },
  { id: "p3", name: "Elif Yıldız", handle: "elif", bio: "Geschichtsstudentin, 4. Semester. Team Spätantike.", color: "#A8690F", xp: 980, weekBase: 290, streak: 21, accuracy: 0.81, interests: ["history", "science"] },
  { id: "p4", name: "Tobias Wendt", handle: "tobi.w", bio: "Lernt jeden Morgen fünf Minuten in der S-Bahn.", color: "#B4462F", xp: 430, weekBase: 180, streak: 5, accuracy: 0.64, interests: ["technology", "history"] },
  { id: "p5", name: "Lena Hoffmann", handle: "lenah", bio: "Physiklehrerin. Ja, ich korrigiere auch hier.", color: "#2F6FB4", xp: 3050, weekBase: 520, streak: 88, accuracy: 0.92, interests: ["science", "technology"] },
  { id: "p6", name: "Noah Schmitt", handle: "noah", bio: "Neu hier. Will endlich beim Pubquiz gewinnen.", color: "#7A5AA8", xp: 160, weekBase: 120, streak: 3, accuracy: 0.58, interests: ["history"] },
  { id: "p7", name: "Sofia Marino", handle: "sofia.m", bio: "Data Scientist. KI-News, bevor sie im Feed landen.", color: "#C0507A", xp: 1210, weekBase: 260, streak: 9, accuracy: 0.74, interests: ["technology", "science"] },
  { id: "p8", name: "Ben Albrecht", handle: "ben", bio: "Rentner, Hobbyastronom, Frühaufsteher.", color: "#4F7A3A", xp: 760, weekBase: 230, streak: 30, accuracy: 0.7, interests: ["science", "history"] },
];

export const personById = (id: string) => PEOPLE.find((p) => p.id === id);

/** Demo XP grows through the week so the leaderboard feels alive (resets Monday). */
export function weekXpOf(p: Person): number {
  const d = new Date();
  const progress = ((d.getDay() + 6) % 7) + d.getHours() / 24;
  return Math.round((p.weekBase * (progress + 0.4)) / 7.4);
}

/** Deterministic demo opponent: harder questions are missed more often. */
export function challengeScore(p: Person, items: Item[], date: string): number {
  return items.filter((i) => (hash(p.id + i.id + date) % 100) / 100 < p.accuracy - (i.difficulty - 2) * 0.12).length;
}

export interface Activity {
  id: string;
  userId: string;
  type: "daily" | "level" | "streak" | "like" | "badge";
  text: string;
  itemId?: string;
  hoursAgo: number;
}

export const ACTIVITIES: Activity[] = [
  { id: "a1", userId: "p5", type: "daily", text: "hat die Daily Challenge mit 5/5 abgeschlossen", hoursAgo: 1 },
  { id: "a2", userId: "p1", type: "like", text: "gefällt eine Karte", itemId: "sf1", hoursAgo: 2 },
  { id: "a3", userId: "p2", type: "like", text: "gefällt eine Karte", itemId: "t6", hoursAgo: 3 },
  { id: "a4", userId: "p3", type: "streak", text: "lernt seit 21 Tagen am Stück", hoursAgo: 5 },
  { id: "a5", userId: "p7", type: "like", text: "gefällt eine Karte", itemId: "tf3", hoursAgo: 6 },
  { id: "a6", userId: "p8", type: "like", text: "gefällt eine Karte", itemId: "sf2", hoursAgo: 8 },
  { id: "a7", userId: "p1", type: "level", text: "hat Level 8 erreicht", hoursAgo: 11 },
  { id: "a8", userId: "p3", type: "like", text: "gefällt eine Karte", itemId: "hf1", hoursAgo: 14 },
  { id: "a9", userId: "p4", type: "badge", text: "hat das Abzeichen „Dranbleiber“ erhalten", hoursAgo: 19 },
  { id: "a10", userId: "p5", type: "like", text: "gefällt eine Karte", itemId: "s8", hoursAgo: 22 },
  { id: "a11", userId: "p6", type: "daily", text: "hat die Daily Challenge mit 3/5 abgeschlossen", hoursAgo: 26 },
  { id: "a12", userId: "p2", type: "like", text: "gefällt eine Karte", itemId: "tf1", hoursAgo: 30 },
  { id: "a13", userId: "p8", type: "like", text: "gefällt eine Karte", itemId: "hf2", hoursAgo: 33 },
  { id: "a14", userId: "p7", type: "like", text: "gefällt eine Karte", itemId: "t5", hoursAgo: 40 },
];
