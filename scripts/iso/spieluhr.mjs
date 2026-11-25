// Builds the music box ("Spieluhr") explainer figure: node scripts/iso/spieluhr.mjs
// Drawn with the isometric kit from github.com/wheresryan22/anatomy (MIT, scripts/iso/kit/LICENSE, commit 1482e84).
// Output: components/anim/iso/spieluhr.json – the static layers as SVG strings plus everything the scene
// (components/anim/Spieluhr.tsx) needs to draw the moving parts: projection, pins, tines, part positions.
//
// What is true (de.wikipedia "Spieldose", "Stiftwalze"): a spring drive turns the pinned cylinder; its steel pins lift
// the tines of a spring-steel comb with graded lengths and let them go, so they vibrate; the comb usually has several
// tines of the same note side by side, so that a pin never meets a tine that is still vibrating; lead weights under
// the bass tines keep them short; a fly governor (Windfang) brakes the drive by air resistance, turned fast through
// gearing. Simplified: ten tines, the spring barrel sits on the cylinder's axle, the worm drives the fly directly.
import { readFileSync, writeFileSync } from "node:fs";
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";

const WIDTH = 360;

// ---- melody: Brahms' lullaby exactly as stored for the listening card mk105, one octave up (where a music box sings)
const listen = JSON.parse(readFileSync("content/listen.json", "utf8"));
const mk105 = (listen.snippets ?? listen).find((s) => s.id === "mk105");
const UP = 12;
// the comb, low to high; repeated notes get two tines side by side (F, G and C come twice in quick succession)
const COMB = [65, 65, 67, 67, 68, 70, 72, 72, 74, 75].map((m) => m + UP);
const REST = 3; // beats of silence before the tune starts again
let beat = 0;
const NOTES = [];
for (const n of mk105.notes) {
  for (const m of n.midi) NOTES.push({ at: beat, midi: m + UP });
  beat += n.beats;
}
const TURN = beat + REST; // one cylinder turn = the tune and a short pause
if (NOTES.some((n) => !COMB.includes(n.midi)) || TURN !== 24) throw new Error("the tune does not fit the comb");
// which tine each pin plucks: of the tines for that note, the one that has rested longest
{
  const last = COMB.map(() => -Infinity);
  for (const n of NOTES) {
    const free = COMB.map((m, i) => i).filter((i) => COMB[i] === n.midi);
    n.tine = free.reduce((a, b) => (last[b] < last[a] ? b : a));
    last[n.tine] = n.at;
  }
}

// ---- geometry (world units; +x and +y come toward the viewer, z is up)
const FLOOR = { x: -66, y: -27, w: 154, d: 76, r: 6 };
const PITCH = 8.4, TINE_W = 6, TINE_T = 1.4;
// the bass at the right-hand end (nearest the viewer), so the lead weights under it can be seen
const TINE_X = COMB.map((_, i) => Math.round(((COMB.length - 1) / 2 - i) * PITCH * 10) / 10);
const TIP_Y = 2.5; // the tine tips line up along the cylinder
const TINE_Z = 21; // underside of the comb
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
// a tine is a little cantilever: its pitch goes with 1 / length², so length ∝ 1 / √frequency
const LEN = COMB.map((m) => Math.round(29.4 * Math.sqrt(hz(COMB[0]) / hz(m)) * 10) / 10);
const BACK_Y = TIP_Y + LEN[0] + 10;
const BAR = { y: -10, z: 24, r: 12, x0: -46, x1: 46 }; // pinned cylinder, axis along x
const PIN = 2; // how far a pin stands out
// where a pin meets a tine tip: angle from the top of the cylinder towards the comb
const PLUCK = Math.atan2(TIP_Y - BAR.y, TINE_Z + TINE_T / 2 - BAR.z);
const WHEEL = { s0: -4, s1: -1, r: 13.5, teeth: 30 }; // worm wheel on the cylinder's left end (s = x - BAR.x0)
const WORM = { x: -48.5, y: BAR.y + WHEEL.r + 3, r: 3, z0: 17, z1: 31, top: 58 }; // vertical worm, meshing at the front
const FLY = { z0: 46, z1: 57, r0: 1.5, r1: 12 }; // the two vanes of the fly
const DRUM = { s0: 98, s1: 112, r: 14 }; // spring barrel on the axle, right of the cylinder
const KEY = { s0: 121, s1: 129, r: 8 }; // the key's wing: from s0 to s1 along the axis, r either side of it

const P = k.fitProjection(
  [...k.boxCorners(FLOOR, -6, 0), [WORM.x, WORM.y, FLY.z1 + 4], [WORM.x + FLY.r1, WORM.y, FLY.z1], ...[-1, 1].flatMap((sy) => [-1, 1].map((sz) => [BAR.x0 + KEY.s1, BAR.y + sy * KEY.r, BAR.z + sz * KEY.r]))],
  WIDTH, 338, { pad: 12, headroom: 34, azimuth: 38 },
);
const at = (p) => k.iso(p, P).map((v) => Math.round(v * 10) / 10);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const fx = G.frameOf([BAR.x0, BAR.y, BAR.z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);

const floor = () => `<path class="iso-halo" d="${k.haloOf(FLOOR, -6, 6, P)}"/>` + S(k.slabOf(FLOOR, -6, 6, P, 6, 1.2), { tone: "mid" }) + L(k.planOutline(k.insetPlan(FLOOR, 5), 0, P), { tone: "faint" });

const support = (x, w) => S(k.slabOf({ x, y: BAR.y - 6, w, d: 12, r: 1 }, 0, BAR.z + 5, P, 2, 0.4), { tone: "mid" });
const supports = { left: support(-61, 5) + S(G.disc(-15, WHEEL.s0, 2.2, fx, P), { tone: "mid" }), middle: support(47, 4) };

const wheel = () => S(G.disc(WHEEL.s0, WHEEL.s1, WHEEL.r, fx, P), { tone: "mid", crease: "lo" });
const barrel = () => [
  S(G.disc(WHEEL.s1, 0, 2.6, fx, P), { tone: "mid" }),
  S(G.disc(0, BAR.x1 - BAR.x0, BAR.r, fx, P), { tone: "hi", crease: "lo" }),
  L(G.arcOf(fx, 3, BAR.r, P) + G.arcOf(fx, BAR.x1 - BAR.x0 - 3, BAR.r, P), { tone: "faint" }),
].join("");
const drum = () => [
  S(G.disc(BAR.x1 - BAR.x0, DRUM.s0, 2.4, fx, P), { tone: "mid" }),
  S(G.disc(DRUM.s0, DRUM.s1, DRUM.r, fx, P), { tone: "mid", crease: "lo" }),
  L(G.arcOf(fx, DRUM.s1 - 2, DRUM.r, P), { tone: "faint" }),
].join("");
const arbor = () => S(G.disc(DRUM.s1, KEY.s0, 1.8, fx, P), { tone: "mid" });

// the comb: one steel plate, its back screwed onto a block, the tines cut free in front of it
function comb() {
  const half = PITCH / 2, x0 = TINE_X[TINE_X.length - 1] - half, x1 = TINE_X[0] + half;
  const ring = [[x0, BACK_Y], [x1, BACK_Y]];
  for (let i = 0; i < TINE_X.length; i++) ring.push([TINE_X[i] + half, TIP_Y + LEN[i]], [TINE_X[i] - half, TIP_Y + LEN[i]]);
  const block = { x: x0, y: TIP_Y + LEN[0] + 2, w: x1 - x0, d: BACK_Y - (TIP_Y + LEN[0] + 2), r: 1 };
  return {
    block: S(k.slabOf(block, 0, TINE_Z, P, 2, 0.4), { tone: "lo" }),
    plate: S(k.extrude(ring, TINE_Z, TINE_T, P, { convex: false }), { tone: "hi", crease: "faint", lit: true })
      + [-28, 0, 28].map((x) => S(k.cylinder(x, BACK_Y - 5, 2, TINE_Z + TINE_T, 0.8, P, 16), { tone: "mid", crease: "none" })).join(""),
  };
}
const tinePlan = (i) => ({ x: TINE_X[i] - TINE_W / 2, y: TIP_Y, w: TINE_W, d: LEN[i] + 0.6, r: 0.8 });
const tine = (i) => S(k.slabOf(tinePlan(i), TINE_Z, TINE_T, P, 2), { tone: "hi", crease: "faint", lit: true });
const tineTop = (i) => k.planOutline(tinePlan(i), TINE_Z + TINE_T, P, 2);
// lead weights soldered under the two lowest tines
const WEIGHTED = [0, 1];
const weight = (i) => S(k.slabOf({ x: TINE_X[i] - 2.5, y: TIP_Y + 2.5, w: 5, d: 9, r: 1 }, TINE_Z - 4, 4, P, 2), { tone: "mid" });
// the worm's bearing post and arbor
const wormPost = () => S(k.slabOf({ x: WORM.x - 3, y: WORM.y - 3, w: 6, d: 6, r: 1 }, 0, 8, P, 2, 0.3), { tone: "mid" }) + S(k.cylinder(WORM.x, WORM.y, 0.9, 8, WORM.top - 8, P, 12), { tone: "mid", crease: "none" })
  + S(k.cylinder(WORM.x, WORM.y, WORM.r - 0.9, WORM.z0, WORM.z1 - WORM.z0, P, 24), { tone: "mid", crease: "none" });

const c = comb();
const r1 = (v) => Math.round(v * 1000) / 1000;
const out = {
  note: "Generated by scripts/iso/spieluhr.mjs – do not edit by hand.",
  css: k.ISO_CSS,
  P,
  notes: NOTES, turn: TURN, comb: COMB, bpm: mk105.bpm, source: mk105.url, up: UP,
  pitches: [...new Set(COMB)],
  tineX: TINE_X, len: LEN, tipY: TIP_Y, tineZ: TINE_Z + TINE_T, pluck: r1(PLUCK), pin: PIN,
  bar: BAR, wheel: WHEEL, worm: WORM, fly: FLY, drum: DRUM, key: KEY, weighted: WEIGHTED,
  keyHub: at([BAR.x0 + KEY.s0, BAR.y, BAR.z]),
  layers: {
    base: floor(),
    supportLeft: supports.left,
    supportMiddle: supports.middle,
    wheel: wheel(),
    barrel: barrel(),
    drum: drum(),
    arbor: arbor(),
    block: c.block,
    weights: WEIGHTED.map((i) => weight(i)),
    plate: c.plate,
    tines: COMB.map((_, i) => tine(i)),
    tineTops: COMB.map((_, i) => tineTop(i)),
    wormPost: wormPost(),
  },
  // where the labels point (screen units of the 360 × 400 scene)
  anchors: {
    key: at([BAR.x0 + KEY.s1, BAR.y, BAR.z + KEY.r]),
    spring: at([BAR.x0 + DRUM.s1, BAR.y - 5, BAR.z + 5]), // on the spiral, up and away from the axle
    barrel: at([-24, BAR.y, BAR.z + BAR.r]),
    comb: at([TINE_X[5], BACK_Y - 4, TINE_Z + TINE_T]),
    weights: at([TINE_X[0] + 2.5, TIP_Y + 7, TINE_Z - 2]),
    pair: at([(TINE_X[2] + TINE_X[3]) / 2, TIP_Y + 10, TINE_Z + TINE_T]),
    fly: at([WORM.x, WORM.y, FLY.z1]),
  },
};
writeFileSync("components/anim/iso/spieluhr.json", JSON.stringify(out) + "\n");
console.log("wrote components/anim/iso/spieluhr.json", Math.round(JSON.stringify(out).length / 1024), "KB", { TURN, notes: NOTES.length, pluck: r1(PLUCK), len: LEN });
