// How a price comes about at the stock exchange: the order book as blocks on a price ladder – buy orders (green) on the
// left, sell orders (red) on the right, each as long as its quantity, sorted by price and, within a price, by time.
// New buy orders arrive; when one meets a sell order at its price, both move together and turn into a trade, and the
// display above shows the new price. In the last step many buy orders arrive and the price climbs.
// labels: 0 buy orders, 1 sell orders, 2 order book, 3 "the buyer will pay at most this much", 4 "the seller wants at
//         least this much", 5 "gap: no trade", 6 "a match – trade!", 7 "more demand: the price rises", 8 price
// Simplified: one share, a handful of orders, whole euros; every new order matches exactly one waiting order.
// The sequence is a pure function of (step, time in step), so jumping between steps always shows the right book.
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { clamp, ease, lerp, type SceneFactory, type Vec3 } from "../types";

const LEVELS = [97, 98, 99, 100, 101, 102, 103, 104];
const GAP = 0.6; // half the width of the price column in the middle
const UNIT = 0.36; // width of one share in a block
const yOf = (price: number) => (price - 100.5) * 0.62;
const BUYS = [{ p: 100, q: 3 }, { p: 99, q: 2 }, { p: 99, q: 2 }, { p: 98, q: 4 }, { p: 97, q: 2 }];
const SELLS = [{ p: 101, q: 2 }, { p: 102, q: 3 }, { p: 102, q: 1 }, { p: 103, q: 2 }, { p: 104, q: 3 }];
// arriving buy orders: in which step, when (seconds into it) – each one meets the sell order with the same index
const INCOMING = [{ step: 2, at: 0.6 }, { step: 3, at: 0.8 }, { step: 3, at: 2.4 }, { step: 3, at: 4.0 }, { step: 3, at: 5.6 }].map((e, i) => ({ ...e, p: SELLS[i].p, q: SELLS[i].q }));
const FLY = 1.0, WAIT = 0.35, MERGE = 0.6;

export const orderbook: SceneFactory = ({ THREE: T, scene }) => {
  const glossy = (color: number) => new T.MeshPhysicalMaterial({ color, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15, emissive: new T.Color(0x000000) });
  const block = (q: number, color: number) => {
    const m = new T.Mesh(new RoundedBoxGeometry(q * UNIT - 0.06, 0.44, 0.8, 3, 0.08), glossy(color));
    scene.add(m);
    return m;
  };
  // the table and the price column with its numbers
  const table = new T.Mesh(new RoundedBoxGeometry(9, 0.2, 3.2, 3, 0.08), new T.MeshPhysicalMaterial({ color: 0x15191d, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.4 }));
  table.position.set(0, yOf(97) - 0.55, -0.3);
  scene.add(table);
  const tag = (text: string, w: number, h: number, bg: string, fg: string, size: number) => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = Math.round((256 * h) / w);
    const g = c.getContext("2d")!;
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(0, 0, c.width, c.height, 24);
    g.fill();
    g.fillStyle = fg;
    g.font = `600 ${size}px system-ui, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, c.width / 2, c.height / 2 + 2);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    return { tex, canvas: c, g };
  };
  for (const p of LEVELS) {
    const plate = new T.Mesh(new T.PlaneGeometry(GAP * 2 - 0.12, 0.42), new T.MeshBasicMaterial({ map: tag(`${p} €`, 1.08, 0.42, "#2b3138", "#e8edf2", 64).tex, transparent: true }));
    plate.position.set(0, yOf(p), 0.42);
    scene.add(plate);
  }
  // the price display above the book
  const display = tag("–", 3, 1, "#0f1317", "#ffd24a", 120);
  const screen = new T.Mesh(new T.PlaneGeometry(2.4, 0.8), new T.MeshBasicMaterial({ map: display.tex }));
  screen.position.set(0, yOf(104) + 1.25, 0);
  scene.add(screen);
  let shown = "";
  const showPrice = (text: string) => {
    if (text === shown) return;
    shown = text;
    const { g, canvas } = display;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = "#0f1317";
    g.beginPath();
    g.roundRect(0, 0, canvas.width, canvas.height, 24);
    g.fill();
    g.fillStyle = "#ffd24a";
    g.font = "700 120px system-ui, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, canvas.width / 2, canvas.height / 2 + 4);
    display.tex.needsUpdate = true;
  };
  // the gap between the best buy and the best sell order
  const gap = new T.Mesh(new T.PlaneGeometry(GAP * 2 + 3.4, yOf(101) - yOf(100) - 0.44), new T.MeshBasicMaterial({ color: 0xff6b5a, transparent: true, opacity: 0 }));
  gap.position.set(0, (yOf(100) + yOf(101)) / 2, 0.05);
  scene.add(gap);

  // resting orders: a level's blocks line up outwards from the price column in the order they came in
  const place = (list: { p: number; q: number }[], side: number) => {
    const used: Record<number, number> = {};
    return list.map((o) => {
      const from = GAP + (used[o.p] ?? 0);
      used[o.p] = (used[o.p] ?? 0) + o.q * UNIT;
      return { ...o, x: side * (from + (o.q * UNIT) / 2), y: yOf(o.p) };
    });
  };
  const buys = place(BUYS, -1).map((o) => ({ ...o, m: block(o.q, 0x2f9e5b) }));
  const sells = place(SELLS, 1).map((o) => ({ ...o, m: block(o.q, 0xd0473c) }));
  const incoming = INCOMING.map((o) => ({ ...o, m: block(o.q, 0x3cc775), x: -(GAP + (o.q * UNIT) / 2), y: yOf(o.p) }));
  const flash = new T.Mesh(new T.SphereGeometry(0.5, 24, 16), new T.MeshBasicMaterial({ color: 0xffe28a, transparent: true, opacity: 0 }));
  scene.add(flash);

  let trading: Vec3 | null = null;
  let rising = false;
  return {
    update(step, _p, t, s) {
      for (const b of buys) {
        b.m.position.set(b.x, b.y, 0);
        (b.m.material as InstanceType<typeof T.MeshPhysicalMaterial>).emissive.setHex(step === 1 && b === buys[0] ? 0x1d5a34 : 0x000000);
      }
      for (const o of sells) (o.m.material as InstanceType<typeof T.MeshPhysicalMaterial>).emissive.setHex(step === 1 && o === sells[0] ? 0x5a1d16 : 0x000000);
      gap.material.opacity = step === 1 ? 0.18 + 0.08 * Math.sin(t * 3) : 0;
      // arriving orders: fly in, wait, then move together with their sell order and turn into a trade
      let price = "–";
      trading = null;
      flash.material.opacity = 0;
      incoming.forEach((o, i) => {
        const sell = sells[i];
        const local = step === o.step ? s - o.at : step > o.step ? 99 : -1;
        const fly = clamp(local / FLY), merge = clamp((local - FLY - WAIT) / MERGE);
        o.m.visible = local >= 0 && merge < 1;
        sell.m.visible = merge < 1;
        o.m.position.set(lerp(-6.5, o.x, ease(fly)) * (1 - ease(merge)), o.y, 0);
        o.m.scale.setScalar(1 - 0.9 * ease(merge));
        sell.m.position.set(sell.x * (1 - ease(merge)), sell.y, 0);
        sell.m.scale.setScalar(1 - 0.9 * ease(merge));
        if (merge > 0 && merge < 1) {
          trading = [0, o.y, 0.5];
          flash.position.set(0, o.y, 0.3);
          flash.material.opacity = Math.sin(merge * Math.PI) * 0.8;
          flash.scale.setScalar(0.4 + merge);
        }
        if (merge >= 1) price = `${o.p} €`;
      });
      showPrice(price);
      rising = step === 3 && price !== "–" && price !== "101 €";
    },
    camera() {
      return { pos: [0, 1.8, 15], look: [0, 0.9, 0] };
    },
    labels(step) {
      const book = [
        { at: [-3.1, yOf(97) - 0.15, 0.6] as Vec3, text: 0, color: "#7fe0a0" },
        { at: [3.1, yOf(104) + 0.05, 0.6] as Vec3, text: 1, color: "#ff8f7a" },
        { at: [0, yOf(97) - 0.85, 1.2] as Vec3, text: 2 },
      ];
      if (step === 0) return book;
      if (step === 1)
        return [
          { at: [-3.2, yOf(100) - 0.75, 0.6] as Vec3, text: 3, color: "#7fe0a0" },
          { at: [3.2, yOf(101) + 0.75, 0.6] as Vec3, text: 4, color: "#ff8f7a" },
          { at: [2.9, (yOf(100) + yOf(101)) / 2, 0.8] as Vec3, text: 5, color: "#ffb3a8" },
        ];
      const price = { at: [0, yOf(104) + 1.95, 0] as Vec3, text: 8 };
      if (step === 2) return [price, ...(trading ? [{ at: [0, trading[1] + 0.75, 0.8] as Vec3, text: 6, color: "#ffd24a" }] : [])];
      return [price, ...(rising ? [{ at: [2.9, yOf(104) + 1.25, 0.4] as Vec3, text: 7, color: "#ffd24a" }] : [])];
    },
    stage: { shadows: true },
  };
};
