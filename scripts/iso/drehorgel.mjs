// Builds the barrel organ ("Drehorgel") explainer figure: node scripts/iso/drehorgel.mjs
// Drawn with the isometric kit from github.com/wheresryan22/anatomy (MIT, scripts/iso/kit/LICENSE, commit 1482e84).
// Output: components/anim/iso/drehorgel.json – the static layers as SVG strings plus everything the scene
// (components/anim/Drehorgel.tsx) needs to draw the moving parts: projection, pin layout, part positions.
//
// What is true (de.wikipedia "Drehorgel", "Stiftwalze"): the crank works the leather-covered feeder bellows via a
// connecting rod; the wind is stored in a reservoir bellows and brought to constant pressure by springs; the wind
// chest holds the valves, one tone per valve, with the pipes standing on it; the crank also moves the pinned barrel,
// whose pins fix which tone sounds when. Simplified: five pipes, one key per pipe resting directly on the barrel,
// the eccentric drawn as a crank pin on the axle.
import { readFileSync, writeFileSync } from "node:fs";
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";

const WIDTH = 360, HEIGHT = 400;

// ---- melody: the opening of "Ode an die Freude" exactly as stored for the listening card mk98
const listen = JSON.parse(readFileSync("content/listen.json", "utf8"));
const mk98 = (listen.snippets ?? listen).find((s) => s.id === "mk98");
const PITCHES = [67, 69, 71, 72, 74]; // G4 A4 B4 C5 D5 – one pipe each
let beat = 0;
const NOTES = mk98.notes.map((n) => { const out = { key: PITCHES.indexOf(n.midi[0]), at: beat, len: n.beats }; beat += n.beats; return out; });
const TURN = beat; // one barrel turn = the whole phrase
if (NOTES.some((n) => n.key < 0) || TURN !== 16) throw new Error("melody does not fit the five pipes");

// ---- geometry (world units; +x and +y come toward the viewer, z is up)
const FLOOR = { x: -72, y: -62, w: 196, d: 104, r: 6 };
const KEY_X = [-44, -22, 0, 22, 44];
const BAR = { y: 18, z: 34, r: 15, x0: -58, x1: 58 }; // pinned barrel, axis along x
const CHEST = { x: -56, y: -50, w: 152, d: 26, r: 2 }; // wind chest
const CHEST_Z = 50, CHEST_H = 14, CHEST_TOP = CHEST_Z + CHEST_H;
const PIPE_Y = -37;
const PIPE_H = PITCHES.map((m) => Math.round(118 * Math.pow(2, -(m - 67) / 12))); // open pipe: length ~ 1 / frequency
const KEY_Z = BAR.z + BAR.r + 2.5; // keys rest on the pins
const CRANK_X = 116, CRANK_R = 30;
const ECC_X = 87, ECC_R = 4; // crank pin on the axle, right above the feeder bellows
const FEED = { x: 70, y: -2, w: 34, d: 40, r: 2 }; // feeder bellows
const FEED_Z = 6, FEED_LOW = 16, FEED_HIGH = 24, FEED_FRAMES = 9;
const RES = { x: 66, y: -56, w: 40, d: 34, r: 2 }; // reservoir bellows
const RES_Z = 6, RES_TOP = 26, SPRING_TOP = 42;
const TRUNK = [100, -30];
const LIFT = 3; // how far a pin lifts its key

const P = k.fitProjection(
  [...k.boxCorners(FLOOR, -6, 0), [-44, PIPE_Y, CHEST_TOP + PIPE_H[0] + 4], [CRANK_X + 18, BAR.y + CRANK_R + 4, BAR.z + CRANK_R + 4], [CRANK_X + 18, BAR.y - CRANK_R - 4, BAR.z - CRANK_R]],
  WIDTH, 338, { pad: 12, headroom: 30, azimuth: 38 },
);
const at = (p) => k.iso(p, P).map((v) => Math.round(v * 10) / 10);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const fx = G.frameOf([BAR.x0, BAR.y, BAR.z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);

const floor = () => `<path class="iso-halo" d="${k.haloOf(FLOOR, -6, 6, P)}"/>` + S(k.slabOf(FLOOR, -6, 6, P, 6, 1.2), { tone: "mid" }) + L(k.planOutline(k.insetPlan(FLOOR, 5), 0, P), { tone: "faint" });

// vertical spring (the kit coil only lies along x or y): the half facing us is drawn bright, the half behind faint
function vcoil(cx, cy, z0, z1, r, turns) {
  const back = [], front = [], n = turns * 24;
  for (let i = 0; i < n; i++) {
    const a0 = (i / 24) * Math.PI * 2, a1 = ((i + 1) / 24) * Math.PI * 2;
    const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0), z0 + ((z1 - z0) * i) / n];
    const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1), z0 + ((z1 - z0) * (i + 1)) / n];
    (k.depthOf([Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2), 0], P) > 0 ? front : back).push(k.segment(p0, p1, P));
  }
  return { back: back.join(""), front: front.join("") };
}

function reservoir() {
  const out = [];
  out.push(S(k.slabOf(RES, RES_Z - 2, 2, P, 3), { tone: "mid" }));
  out.push(S(k.slabOf(k.insetPlan(RES, 2.5), RES_Z, RES_TOP - RES_Z - 2, P, 3), { tone: "lo", crease: "faint" }));
  for (const z of [11, 16, 21]) out.push(L(k.sideSeam(k.insetPlan(RES, 2.5), z, P, 3), { tone: "faint" })); // leather folds
  out.push(S(k.slabOf(RES, RES_TOP - 2, 2, P, 3, 0.5), { tone: "hi" }));
  const bar = { x: RES.x - 2, y: RES.y + RES.d / 2 - 3, w: RES.w + 4, d: 6, r: 1 };
  for (const x of [RES.x + 1, RES.x + RES.w - 3]) out.push(S(k.slabOf({ x, y: bar.y + 1, w: 2, d: 4, r: 0.5 }, RES_Z, SPRING_TOP - RES_Z, P, 2), { tone: "mid", crease: "none" }));
  for (const x of [RES.x + 10, RES.x + RES.w - 16]) {
    const c = vcoil(x, bar.y + 3, RES_TOP, SPRING_TOP, 4, 5);
    out.push(L(c.back, { tone: "faint" }), L(c.front, { tone: "lit" }));
  }
  out.push(S(k.slabOf(bar, SPRING_TOP, 3, P, 2, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(TRUNK[0], TRUNK[1], 3.5, RES_TOP - 6, CHEST_Z - RES_TOP + 6, P, 24), { tone: "mid", crease: "none" })); // wind trunk
  return out.join("");
}

function chest() {
  const out = [];
  for (const x of [CHEST.x + 4, 58]) out.push(S(k.slabOf({ x, y: CHEST.y + 8, w: 4, d: 10, r: 1 }, 0, CHEST_Z, P, 2), { tone: "lo" }));
  out.push(S(k.slabOf(CHEST, CHEST_Z, CHEST_H, P, 3, 0.6), { tone: "mid" }));
  out.push(L(k.sideSeam(CHEST, CHEST_Z + 5, P, 3), { tone: "faint" }));
  return out.join("");
}

function pipe(i) {
  const x = KEY_X[i], h = PIPE_H[i], r = 6.5, mz = CHEST_TOP + 14;
  return [
    S(k.cylinder(x, PIPE_Y, 3, CHEST_TOP, 7, P, 20), { tone: "mid", crease: "none" }),
    S(k.cylinder(x, PIPE_Y, r, CHEST_TOP + 6, h, P, 36, 0.5), { tone: "hi", crease: "lo" }),
    L(k.ring(x, PIPE_Y, r - 1.4, CHEST_TOP + 6 + h, P, 28), { tone: "lo" }),
    L(k.segment([x - 3, PIPE_Y + r, mz], [x + 3, PIPE_Y + r, mz], P) + k.segment([x - 3, PIPE_Y + r, mz], [x, PIPE_Y + r, mz + 5], P) + k.segment([x + 3, PIPE_Y + r, mz], [x, PIPE_Y + r, mz + 5], P), { tone: "lo" }), // mouth
  ].join("");
}
// the "breath" above an open pipe: three short strokes
const breath = (i) => [-4, 0, 4].map((dx) => k.segment([KEY_X[i] + dx, PIPE_Y, CHEST_TOP + 10 + PIPE_H[i]], [KEY_X[i] + dx * 1.6, PIPE_Y, CHEST_TOP + 20 + PIPE_H[i]], P)).join("");

function key(i) {
  const x = KEY_X[i];
  const lever = { x: x - 2.5, y: CHEST.y + CHEST.d - 2, w: 5, d: BAR.y + 4 - (CHEST.y + CHEST.d - 2), r: 1 };
  return S(k.slabOf(lever, KEY_Z, 2.4, P, 2, 0.3), { tone: "mid" }) + S(k.slabOf({ x: x - 2.5, y: BAR.y - 1, w: 5, d: 4, r: 0.8 }, KEY_Z - 2.5, 2.5, P, 2), { tone: "lit", lit: true });
}

function barrel() {
  return [
    S(G.disc(-8, 0, 2.6, fx, P), { tone: "mid" }),
    S(G.disc(0, BAR.x1 - BAR.x0, BAR.r, fx, P), { tone: "hi", crease: "lo" }),
    L(G.arcOf(fx, 3, BAR.r, P) + G.arcOf(fx, BAR.x1 - BAR.x0 - 3, BAR.r, P), { tone: "faint" }),
  ].join("");
}
const supports = () => [BAR.x0 - 12, BAR.x1 + 4].map((x) => S(k.slabOf({ x, y: BAR.y - 5, w: 6, d: 10, r: 1 }, 0, BAR.z + 4, P, 2, 0.4), { tone: "mid" })).join("");
const axle = () => S(G.disc(BAR.x1 - BAR.x0, CRANK_X - BAR.x0, 2.6, fx, P), { tone: "mid" });

// the feeder bellows at a few heights (the scene picks the nearest; rebuilding solids every frame would be wasteful)
const feeder = (top) => [
  S(k.slabOf(FEED, FEED_Z - 2, 2, P, 3), { tone: "mid" }),
  S(k.slabOf(k.insetPlan(FEED, 2.5), FEED_Z, top - FEED_Z - 2, P, 3), { tone: "lo", crease: "faint" }),
  S(k.slabOf(FEED, top - 2, 2, P, 3, 0.5), { tone: "hi" }),
].join("");

const lift = at([0, 0, LIFT]), zero = at([0, 0, 0]);
const out = {
  note: "Generated by scripts/iso/drehorgel.mjs – do not edit by hand.",
  css: k.ISO_CSS,
  P,
  notes: NOTES, turn: TURN, pitches: PITCHES, bpm: mk98.bpm, source: mk98.url,
  keyX: KEY_X, bar: BAR, crank: { x: CRANK_X, r: CRANK_R }, ecc: { x: ECC_X, r: ECC_R }, feed: { low: FEED_LOW, high: FEED_HIGH },
  keyLift: [Math.round((lift[0] - zero[0]) * 100) / 100, Math.round((lift[1] - zero[1]) * 100) / 100],
  hub: at([CRANK_X, BAR.y, BAR.z]),
  layers: {
    base: floor(),
    bellows: reservoir(),
    chest: chest(),
    pipes: KEY_X.map((_, i) => pipe(i)),
    breath: KEY_X.map((_, i) => breath(i)),
    supports: supports(),
    barrel: barrel(),
    keys: KEY_X.map((_, i) => key(i)),
    axle: axle(),
    feeder: Array.from({ length: FEED_FRAMES }, (_, i) => feeder(FEED_LOW + ((FEED_HIGH - FEED_LOW) * i) / (FEED_FRAMES - 1))),
  },
  // where the labels point (screen units of the 360 × 400 scene)
  anchors: {
    barrel: at([BAR.x0 + 6, BAR.y + BAR.r, BAR.z - 4]),
    feeder: at([FEED.x + FEED.w, FEED.y + FEED.d, FEED_Z + 6]),
    reservoir: at([RES.x + RES.w, RES.y + 6, SPRING_TOP]),
    chest: at([CHEST.x, CHEST.y + CHEST.d, CHEST_Z + 8]),
    pipes: at([KEY_X[0] - 7, PIPE_Y, CHEST_TOP + PIPE_H[0] * 0.75]),
  },
};
writeFileSync("components/anim/iso/drehorgel.json", JSON.stringify(out) + "\n");
console.log("wrote components/anim/iso/drehorgel.json", Math.round(JSON.stringify(out).length / 1024), "KB");
