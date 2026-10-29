// How Gutenberg's printing worked: a small workshop. Left, the hand mould on its bench: liquid metal runs in, a
// mirror-image letter comes out. Right, the compositor's bench: the letters W-U-N-D-E-R line up in the composing stick,
// and set lines gather on the galley into a page. In the middle, the wooden press: an ink ball inks the forme, the sheet
// is laid on, the screw turns and the platen presses – and the sheet comes out printed, the right way round.
// labels: 0 printing press, 1 hand mould, 2 liquid metal, 3 mirror-image letter, 4 composing stick, 5 "line by line into
//         a page", 6 "ink ball: ink onto the type", 7 screw, 8 "the platen presses the paper", 9 printed page
// Everything to one scale (hint #29, 29.10.2026 – letters, page and benches used to be out of proportion with the press):
// units: 1 = 30 cm. Press about 1.9 m high, bed and benches at about 85 cm, one page about 30 × 42 cm. A letter is
// 2.4 cm high with a body of 7.5 mm (Gutenberg's type was about this size), so the close-ups bring the camera close.
// Simplified: one short word, a page of evenly set lines; the steps that took hours take seconds.
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, rand, type SceneFactory, type Vec3 } from "../types";

const WORD = ["W", "U", "N", "D", "E", "R"];
const CAST = [-4.2, 0, 0], STICK = [4.2, 0, 0], SHEETS = [2.6, 0, 0];
const BENCH = 2.86; // top of the benches (86 cm)
const BED = 2.93; // top of the press bed
const TYPE = { body: 0.025, height: 0.08 }; // one letter: 7.5 mm body, 2.4 cm high
const FORME = { w: 0.65, d: 0.97 }; // the set page on the bed: two columns of lines
const PAGE = { w: 1.0, d: 1.4 }; // the sheet
const LINE = 0.3; // one set line: the width of a column

export const printing: SceneFactory = ({ THREE: T, scene }) => {
  const canvas = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d")!);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  // oak with a grain
  const grain = canvas(256, 64, (g) => {
    g.fillStyle = "#8a5a32";
    g.fillRect(0, 0, 256, 64);
    for (let i = 0; i < 60; i++) {
      g.strokeStyle = `rgba(${rand(i, 1) > 0.5 ? "70,40,18" : "170,120,70"},${0.2 + 0.3 * rand(i, 2)})`;
      g.lineWidth = 0.6 + 2 * rand(i, 3);
      const y = rand(i, 4) * 64;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= 256; x += 32) g.lineTo(x, y + Math.sin(x * 0.03 + i) * 2.2);
      g.stroke();
    }
  });
  grain.wrapS = grain.wrapT = T.RepeatWrapping;
  const wood = new T.MeshPhysicalMaterial({ map: grain, roughness: 0.65, clearcoat: 0.2 });
  const worn = new T.MeshPhysicalMaterial({ map: grain, roughness: 0.85 }); // bench tops: no shine in the close-ups
  const iron = new T.MeshPhysicalMaterial({ color: 0x3a3c40, metalness: 0.85, roughness: 0.4 });
  const typeMetal = new T.MeshPhysicalMaterial({ color: 0x9a9ca2, metalness: 0.9, roughness: 0.3 });
  const box = (w: number, h: number, d: number, mat: InstanceType<typeof T.Material> | InstanceType<typeof T.Material>[], at: Vec3, r = 0.04) => {
    const m = new T.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2)), mat);
    m.position.set(...at);
    scene.add(m);
    return m;
  };
  const bench = (x: number, w: number, d: number, top: number) => {
    box(w, 0.12, d, worn, [x, top - 0.06, 0], 0.03);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.12, top - 0.12, 0.12, wood, [x + sx * (w / 2 - 0.12), (top - 0.12) / 2, sz * (d / 2 - 0.12)], 0.02);
  };

  // A page of type: the first line of the left column says WUNDER, the other lines are drawn as words. The forme on the
  // bed shows it mirrored (light metal faces), the printed sheet the right way round (black on paper). Canvas top = back.
  const page = (mirror: boolean, w: number, h: number, margin: { x: number; top: number }) =>
    canvas(w, h, (g) => {
      g.fillStyle = mirror ? "#6f7278" : "#f3ead6";
      g.fillRect(0, 0, w, h);
      if (mirror) {
        g.translate(w, 0);
        g.scale(-1, 1);
      }
      const ink = mirror ? "#dfe2e6" : "#1f1b17";
      const area = { x: margin.x, y: margin.top, w: w - 2 * margin.x, h: (h * FORME.d) / (mirror ? FORME.d : PAGE.d) };
      const lines = Math.floor(FORME.d / TYPE.body);
      const lh = area.h / lines, gap = area.w * 0.06, col = (area.w - gap) / 2;
      g.fillStyle = ink;
      for (let c = 0; c < 2; c++)
        for (let l = 0; l < lines; l++) {
          const x0 = area.x + c * (col + gap), y0 = area.y + l * lh;
          if (c === 0 && l === 0) {
            g.font = `bold ${lh * 1.05}px Georgia, serif`;
            g.textBaseline = "top";
            g.fillText("WUNDER", x0, y0 - lh * 0.05);
            continue;
          }
          const end = l % 9 === 8 ? col * (0.35 + 0.4 * rand(l, c + 7)) : col; // a paragraph ends early now and then
          for (let x = x0, k = 0; x < x0 + end - lh; k++) {
            const word = lh * (1.2 + 4 * rand(l * 31 + k, c + 3));
            g.fillRect(x, y0 + lh * 0.3, Math.min(word, x0 + end - x), lh * 0.4);
            x += word + lh * 0.45;
          }
        }
    });

  // a letter: a small metal block with the mirror-image letter standing out on its top
  const glyph = (ch: string) =>
    canvas(64, 64, (g) => {
      g.fillStyle = "#7d8086";
      g.fillRect(0, 0, 64, 64);
      g.translate(64, 0);
      g.scale(-1, 1); // mirror image: it prints the right way round
      g.fillStyle = "#e9ecef";
      g.font = "bold 50px Georgia, serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(ch, 32, 36);
    });
  const glyphMats = WORD.map((ch) => new T.MeshPhysicalMaterial({ map: glyph(ch), metalness: 0.6, roughness: 0.35 }));
  const letterGeo = new T.BoxGeometry(TYPE.body * 1.15, TYPE.height, TYPE.body);
  const letter = (k: number) => {
    const m = new T.Mesh(letterGeo, [typeMetal, typeMetal, glyphMats[k % 6], typeMetal, typeMetal, typeMetal]);
    scene.add(m);
    return m;
  };

  // ---------- the press ----------
  for (const x of [-1.7, 1.7]) box(0.36, 6.2, 0.4, wood, [x, 3.1, 0]);
  box(4.0, 0.42, 0.5, wood, [0, 5.9, 0]); // crown
  box(4.0, 0.5, 0.5, wood, [0, 4.6, 0]); // head with the nut
  box(4.0, 0.3, 1.9, wood, [0, 2.6, 0]); // the bed rests on this
  box(4.0, 0.25, 0.5, wood, [0, 0.45, 0]); // a stretcher near the floor
  // the rails run out to the front, where the printer inks the type and lays on the sheet; a leg holds their end
  for (const x of [-0.9, 0.9]) {
    box(0.12, 0.1, 3.6, wood, [x, BED - 0.23, 0.85], 0.02);
    box(0.12, BED - 0.28, 0.12, wood, [x, (BED - 0.28) / 2, 2.55], 0.02);
  }
  // the carriage: bed, forme and ink roll out from under the platen and back in
  const carriage = new T.Group();
  scene.add(carriage);
  const add = <M extends InstanceType<typeof T.Object3D>>(m: M) => (scene.remove(m), carriage.add(m), m);
  add(box(2.6, 0.18, 1.6, iron, [0, BED - 0.09, 0])); // bed (coffin)
  const spindle = new T.Group();
  spindle.position.set(0, 4.5, 0);
  scene.add(spindle);
  spindle.add(new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 2.2, 20), iron));
  const thread = new T.CatmullRomCurve3(Array.from({ length: 80 }, (_, i) => new T.Vector3(Math.cos(i * 0.6) * 0.15, -0.3 + i * 0.016, Math.sin(i * 0.6) * 0.15)));
  spindle.add(new T.Mesh(new T.TubeGeometry(thread, 200, 0.03, 6), iron));
  const bar = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.8, 10), iron); // the bar the printer pulls, below the head
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0.9, -0.55, 0);
  spindle.add(bar);
  const PLATEN_UP = 3.5, TRAVEL = 0.37; // pressed down, the platen's underside meets the sheet on the type
  const platen = box(1.15, 0.2, 1.5, wood, [0, PLATEN_UP, 0]);
  // the forme: the set page, locked in an iron frame on the bed
  add(box(FORME.w + 0.12, 0.06, FORME.d + 0.12, iron, [0, BED + 0.03, 0], 0.01));
  const forme = new T.Mesh(new T.BoxGeometry(FORME.w, TYPE.height, FORME.d), [typeMetal, typeMetal, new T.MeshPhysicalMaterial({ map: page(true, 340, 508, { x: 0, top: 0 }), metalness: 0.6, roughness: 0.35 }), typeMetal, typeMetal, typeMetal]);
  forme.position.set(0, BED + TYPE.height / 2, 0);
  carriage.add(forme);
  const FACE = BED + TYPE.height; // the printing surface
  const inkMat = new T.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.2, clearcoat: 1, transparent: true, opacity: 0 });
  const ink = new T.Mesh(new T.PlaneGeometry(FORME.w, FORME.d), inkMat);
  ink.rotation.x = -Math.PI / 2;
  ink.position.set(0, FACE + 0.003, 0);
  carriage.add(ink);
  const OUT = 1.5; // how far the carriage rolls out
  // the ink ball: leather stuffed with wool on a wooden handle, about 18 cm across
  const ball = new T.Group();
  const pad = new T.Mesh(new T.SphereGeometry(0.3, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshPhysicalMaterial({ color: 0x5a3a24, roughness: 0.7 }));
  pad.rotation.x = Math.PI;
  pad.scale.y = 0.55;
  const handle = new T.Mesh(new T.CylinderGeometry(0.05, 0.06, 0.7, 10), wood);
  handle.position.y = 0.38;
  ball.add(pad, handle);
  scene.add(ball);
  // the sheet: blank on a small table beside the press, then printed
  bench(SHEETS[0], 1.15, 1.6, 2.5);
  for (let i = 0; i < 6; i++) box(PAGE.w, 0.006, PAGE.d, new T.MeshPhysicalMaterial({ color: 0xece2cc, roughness: 0.95 }), [SHEETS[0] + (rand(i, 5) - 0.5) * 0.04, 2.503 + i * 0.006, (rand(i, 6) - 0.5) * 0.04], 0.002);
  const blank = canvas(64, 90, (g) => {
    g.fillStyle = "#f3ead6";
    g.fillRect(0, 0, 64, 90);
  });
  const printed = page(false, 512, 717, { x: (512 * (PAGE.w - FORME.w)) / 2 / PAGE.w, top: 717 * 0.11 });
  const paperMat = new T.MeshPhysicalMaterial({ map: blank, roughness: 0.9, side: T.DoubleSide });
  const paper = new T.Mesh(new T.PlaneGeometry(PAGE.w, PAGE.d), paperMat);
  scene.add(paper);
  const ON_TABLE = 2.545, ON_TYPE = FACE + 0.006;

  // ---------- the hand mould (left bench) ----------
  bench(CAST[0], 1.8, 1.1, BENCH);
  box(0.16, 0.2, 0.14, iron, [CAST[0], BENCH + 0.1, 0], 0.012); // the mould: two iron halves around the matrix
  for (const s of [-1, 1]) box(0.07, 0.18, 0.2, wood, [CAST[0] + s * 0.115, BENCH + 0.1, 0], 0.015); // wooden casing to hold it
  box(0.05, 0.02, 0.05, iron, [CAST[0], BENCH + 0.21, 0], 0.006); // the mouth the metal is poured into
  const ladle = new T.Group();
  ladle.position.set(CAST[0] + 0.06, BENCH + 0.36, 0);
  scene.add(ladle);
  const bowl = new T.Mesh(new T.SphereGeometry(0.06, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), iron);
  const melt = new T.Mesh(new T.CircleGeometry(0.055, 16), new T.MeshBasicMaterial({ color: 0xffa040 }));
  melt.rotation.x = -Math.PI / 2;
  melt.position.y = -0.008;
  const stem = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 0.5, 8), iron);
  stem.rotation.z = Math.PI / 2;
  stem.position.x = 0.3;
  ladle.add(bowl, melt, stem);
  const metal = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, 1, 8), new T.MeshBasicMaterial({ color: 0xffa040 }));
  scene.add(metal);
  const cast = Array.from({ length: 6 }, (_, k) => letter(k));

  // ---------- the composing stick and the galley (right bench) ----------
  bench(STICK[0], 1.8, 1.1, BENCH);
  const stickLeft = STICK[0] - 0.45;
  box(0.9, 0.012, 0.11, iron, [STICK[0], BENCH + 0.006, 0.05], 0.004); // floor of the stick
  box(0.9, 0.05, 0.01, iron, [STICK[0], BENCH + 0.025, -0.005], 0.003); // its back wall
  box(0.01, 0.05, 0.11, iron, [stickLeft + 0.005, BENCH + 0.025, 0.05], 0.003); // fixed end
  box(0.012, 0.06, 0.11, iron, [stickLeft + 0.015 + LINE, BENCH + 0.03, 0.05], 0.003); // the knee, set to the width of a column
  box(0.55, 0.012, 0.42, wood, [STICK[0] + 0.1, BENCH + 0.006, -0.32], 0.004); // the galley, a tray for the set lines
  const lineTop = canvas(256, 24, (g) => {
    g.fillStyle = "#6f7278";
    g.fillRect(0, 0, 256, 24);
    g.fillStyle = "#dfe2e6";
    for (let x = 4, k = 0; x < 250; k++) {
      const w = 10 + 30 * rand(k, 9);
      g.fillRect(x, 6, Math.min(w, 252 - x), 12);
      x += w + 6;
    }
  });
  const lineMat = new T.MeshPhysicalMaterial({ map: lineTop, metalness: 0.6, roughness: 0.35 });
  const set = Array.from({ length: 6 }, (_, k) => letter(k));
  const lines = Array.from({ length: 12 }, (_, r) => {
    const m = new T.Mesh(new T.BoxGeometry(LINE, TYPE.height, TYPE.body), [typeMetal, typeMetal, lineMat, typeMetal, typeMetal, typeMetal]);
    m.position.set(STICK[0] + 0.1, BENCH + 0.012 + TYPE.height / 2, -0.16 - r * TYPE.body);
    scene.add(m);
    return m;
  });

  let pressDown = 0;
  return {
    update(step, _p, _t, s) {
      // The steps play at TIMING.pace (about 7 s each), so everything below fits into that.
      // casting: every 1.1 s one letter – metal runs in, the letter comes out and joins the others on the bench
      const castCount = step === 1 ? Math.min(6, Math.floor(s / 1.1)) : step > 1 ? 6 : 0;
      const phase = (s % 1.1) / 1.1;
      const pouring = step === 1 && phase < 0.35 && castCount < 6;
      ladle.rotation.z = pouring ? 0.55 : 0; // the handle rises, the lip over the mould dips
      metal.visible = pouring;
      metal.position.set(CAST[0], BENCH + 0.27, 0);
      metal.scale.y = 0.12;
      cast.forEach((m, k) => {
        const done = k < castCount, now = step === 1 && k === castCount;
        m.visible = done || (now && phase > 0.4);
        const out = now ? ease(clamp((phase - 0.45) / 0.4)) : 1;
        const lift = Math.sin(out * Math.PI) * 0.12;
        m.position.set(lerp(CAST[0], CAST[0] - 0.36 + k * 0.034, out), lerp(BENCH + 0.12, BENCH + TYPE.height / 2, out) + lift, lerp(0, 0.16, out));
      });
      // setting: the six letters go into the stick one by one (mirror image: the word runs from right to left),
      // then finished lines gather on the galley into a page
      set.forEach((m, k) => {
        const at = 0.3 + k * 0.55;
        const go = step === 2 ? ease(clamp((s - at) / 0.5)) : step > 2 ? 1 : 0;
        m.visible = step >= 2;
        m.position.set(lerp(STICK[0] - 0.75, stickLeft + 0.012 + LINE - (k + 0.6) * TYPE.body * 1.17, go), lerp(BENCH + 0.15, BENCH + 0.012 + TYPE.height / 2, go) + Math.sin(go * Math.PI) * 0.08, lerp(0.25, 0.012 + TYPE.body / 2, go));
      });
      lines.forEach((m, r) => (m.visible = step >= 2 && (step > 2 || s > 3.9 + r * 0.22)));
      // printing: the carriage rolls out, the ink ball inks the type, the sheet is laid on; the carriage rolls in under the
      // platen, the screw presses; it rolls out again and the printer lifts the sheet and turns it to the viewer
      const p3 = step === 3;
      carriage.position.z = p3 ? OUT * (ease(clamp(s / 0.6)) * (1 - ease(clamp((s - 3.0) / 0.6))) + ease(clamp((s - 4.7) / 0.6))) : 0;
      inkMat.opacity = p3 ? Math.min(0.85, clamp((s - 0.6) / 1.3) * 1.2) : 0;
      ball.visible = p3 && s > 0.6 && s < 2.0;
      ball.position.set(-0.22 + 0.44 * (0.5 + 0.5 * Math.sin(s * 3)), FACE + 0.17 + 0.12 * Math.abs(Math.sin(s * 6)), OUT + 0.3 * Math.cos(s * 2));
      const lay = p3 ? clamp((s - 2.0) / 1.0) : 0;
      pressDown = p3 ? ease(clamp((s - 3.6) / 0.5)) * (1 - ease(clamp((s - 4.2) / 0.45))) : 0;
      const lift = p3 ? ease(clamp((s - 5.3) / 0.9)) : 0;
      paper.visible = p3 || step === 0;
      paperMat.map = lift > 0 ? printed : blank;
      paper.rotation.set(-Math.PI / 2 + 1.25 * lift, 0, 0);
      if (!p3 || lay === 0) paper.position.set(SHEETS[0], ON_TABLE, 0);
      else if (lay < 1) {
        // up and forward off the table, then left in front of the press onto the type
        const fwd = ease(clamp(lay / 0.4)), left = ease(clamp((lay - 0.4) / 0.45)), down = ease(clamp((lay - 0.85) / 0.15));
        paper.position.set(lerp(SHEETS[0], 0, left), lerp(ON_TABLE, ON_TYPE + 0.25, fwd) - 0.25 * down, OUT * fwd);
      } else paper.position.set(0, ON_TYPE + 0.75 * lift, carriage.position.z + 0.25 * lift);
      platen.position.y = PLATEN_UP - TRAVEL * pressDown;
      spindle.position.y = 4.5 - TRAVEL * pressDown;
      spindle.rotation.y = -pressDown * 1.6;
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.4)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [2.6, 6.2, 15.5], look: [0, 3.2, 0.3] },
        { pos: [CAST[0] + 0.25, BENCH + 0.75, 0.95], look: [CAST[0] - 0.12, BENCH + 0.1, 0.05] },
        { pos: [STICK[0] + 0.1, BENCH + 1.0, 0.72], look: [STICK[0] - 0.08, BENCH, -0.16] },
        { pos: [2.6, 5.0, 6.6], look: [0, 3.1, 0.9] },
      ];
      const from = views[Math.max(0, step - 1)];
      const view = { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
      if (step !== 3) return view;
      // at the end, close to the printed sheet: WUNDER reads the right way round
      const near = ease(clamp((s - 5.9) / 1.3));
      return { pos: mix(view.pos, [0.05, 4.6, 3.05], near), look: mix(view.look, [-0.08, 4.12, 1.65], near) };
    },
    labels(step, _p, _t, s) {
      if (step === 0) return [{ at: [0, 6.5, 0] as Vec3, text: 0 }, { at: [CAST[0], BENCH + 0.5, 0] as Vec3, text: 1 }, { at: [STICK[0], BENCH + 0.4, 0] as Vec3, text: 4 }];
      if (step === 1) return [{ at: [CAST[0] + 0.02, BENCH + 0.25, 0.12] as Vec3, text: 1 }, { at: [CAST[0] + 0.12, BENCH + 0.3, 0.06] as Vec3, text: 2, color: "#ffb060" }, { at: [CAST[0] - 0.28, BENCH + 0.02, 0.24] as Vec3, text: 3, color: "#e9ecef" }];
      if (step === 2) return [{ at: [STICK[0] - 0.3, BENCH + 0.1, 0.16] as Vec3, text: 4 }, ...(s > 3.9 ? [{ at: [STICK[0] + 0.1, BENCH + 0.14, -0.42] as Vec3, text: 5, color: "#ffd24a" }] : [])];
      return [
        ...(s > 0.6 && s < 2.0 ? [{ at: [0, FACE + 0.75, OUT] as Vec3, text: 6 }] : []),
        ...(s < 5.9 ? [{ at: [0.35, 5.0, 0.3] as Vec3, text: 7 }] : []),
        ...(pressDown > 0.3 ? [{ at: [0.95, PLATEN_UP - 0.2, 0.8] as Vec3, text: 8, color: "#ffd24a" }] : []),
        ...(s > 6.2 ? [{ at: [0.3, 4.15, 1.9] as Vec3, text: 9, color: "#fff2c8" }] : []),
      ];
    },
    stage: { shadows: true, floor: 0 },
  };
};
