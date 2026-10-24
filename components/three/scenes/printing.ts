// How Gutenberg's printing worked: a small workshop. Left, the hand mould: liquid metal runs in, a mirror-image letter
// comes out. Right, the compositor's stick: the letters W-U-N-D-E-R line up and join further lines into a page.
// In the middle, the wooden press: an ink ball inks the type, the paper is laid on, the screw turns and the platen
// presses – and the sheet comes out printed, the right way round.
// labels: 0 printing press, 1 hand mould, 2 liquid metal, 3 mirror-image letter, 4 composing stick, 5 "line by line into
//         a page", 6 "ink ball: ink onto the type", 7 screw, 8 "the platen presses the paper", 9 printed page
// Simplified: one short word, a few lines; the steps that took hours take seconds.
// Units: 1 = 10 cm.
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, rand, type SceneFactory, type Vec3 } from "../types";

const WORD = ["W", "U", "N", "D", "E", "R"];
const CAST = [-4.2, 0, 0], STICK = [4.2, 0, 0];

export const printing: SceneFactory = ({ THREE: T, scene }) => {
  const canvas = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d")!);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
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
  const iron = new T.MeshPhysicalMaterial({ color: 0x3a3c40, metalness: 0.85, roughness: 0.4 });
  const brass = new T.MeshPhysicalMaterial({ color: 0xc9a14a, metalness: 1, roughness: 0.3 });
  const typeMetal = new T.MeshPhysicalMaterial({ color: 0x9a9ca2, metalness: 0.9, roughness: 0.3 });
  const box = (w: number, h: number, d: number, mat: InstanceType<typeof T.Material>, at: Vec3, r = 0.04) => {
    const m = new T.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), mat);
    m.position.set(...at);
    scene.add(m);
    return m;
  };
  // a letter: a small metal block with the mirror-image letter standing out on its top
  const glyph = (ch: string) =>
    canvas(64, 64, (g) => {
      g.fillStyle = "#7d8086";
      g.fillRect(0, 0, 64, 64);
      g.translate(64, 0);
      g.scale(-1, 1); // mirror image: it prints the right way round
      g.fillStyle = "#e9ecef";
      g.font = "bold 52px Georgia, serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(ch, 32, 36);
    });
  const glyphMats = WORD.map((ch) => new T.MeshPhysicalMaterial({ map: glyph(ch), metalness: 0.6, roughness: 0.35 }));
  const letter = (k: number) => {
    const m = new T.Mesh(new T.BoxGeometry(0.22, 0.32, 0.22), [typeMetal, typeMetal, glyphMats[k % 6], typeMetal, typeMetal, typeMetal]);
    scene.add(m);
    return m;
  };

  // ---------- the press ----------
  for (const x of [-1.7, 1.7]) box(0.36, 6.2, 0.4, wood, [x, 3.1, 0]);
  box(4.0, 0.42, 0.5, wood, [0, 5.9, 0]); // crown
  box(4.0, 0.5, 0.5, wood, [0, 4.6, 0]); // head with the nut
  box(4.0, 0.3, 1.9, wood, [0, 1.6, 0]); // the bed rests on this
  box(2.6, 0.18, 1.6, iron, [0, 1.84, 0]); // bed (coffin)
  const spindle = new T.Group();
  spindle.position.set(0, 4.0, 0);
  scene.add(spindle);
  spindle.add(new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 2.2, 20), iron));
  const thread = new T.CatmullRomCurve3(Array.from({ length: 80 }, (_, i) => new T.Vector3(Math.cos(i * 0.6) * 0.15, -0.6 + i * 0.022, Math.sin(i * 0.6) * 0.15)));
  spindle.add(new T.Mesh(new T.TubeGeometry(thread, 200, 0.03, 6), iron));
  const bar = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.8, 10), iron); // the bar the printer pulls
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0.9, 0.1, 0);
  spindle.add(bar);
  const platen = box(1.7, 0.2, 1.25, wood, [0, 2.9, 0]);
  // the forme: lines of type on the bed (the set page)
  const forme = new T.Group();
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 6; c++) {
      const m = new T.Mesh(new T.BoxGeometry(0.22, 0.12, 0.22), [typeMetal, typeMetal, r === 0 ? glyphMats[5 - c] : typeMetal, typeMetal, typeMetal, typeMetal]); // read from the back: mirror image
      m.position.set(-0.6 + c * 0.24, 0, -0.36 + r * 0.24);
      forme.add(m);
    }
  forme.position.set(0, 2.0, 0);
  scene.add(forme);
  const inkMat = new T.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.2, clearcoat: 1, transparent: true, opacity: 0 });
  const ink = new T.Mesh(new T.PlaneGeometry(1.45, 0.95), inkMat);
  ink.rotation.x = -Math.PI / 2;
  ink.position.set(0, 2.065, 0);
  scene.add(ink);
  // the ink ball: leather on a wooden handle
  const ball = new T.Group();
  const pad = new T.Mesh(new T.SphereGeometry(0.28, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshPhysicalMaterial({ color: 0x5a3a24, roughness: 0.7 }));
  pad.rotation.x = Math.PI;
  const handle = new T.Mesh(new T.CylinderGeometry(0.05, 0.06, 0.7, 10), wood);
  handle.position.y = 0.38;
  ball.add(pad, handle);
  scene.add(ball);
  // the sheet of paper: blank, then printed
  const blank = canvas(256, 170, (g) => {
    g.fillStyle = "#f3ead6";
    g.fillRect(0, 0, 256, 170);
  });
  const printed = canvas(256, 170, (g) => {
    g.fillStyle = "#f3ead6";
    g.fillRect(0, 0, 256, 170);
    g.fillStyle = "#1a1714";
    g.font = "bold 40px Georgia, serif";
    g.textAlign = "center";
    g.fillText("WUNDER", 128, 52);
    for (let i = 0; i < 3; i++) g.fillRect(38, 78 + i * 26, 180 - (i === 2 ? 60 : 0), 9); // the other lines
  });
  const paperMat = new T.MeshPhysicalMaterial({ map: blank, roughness: 0.9, side: T.DoubleSide });
  const paper = new T.Mesh(new T.PlaneGeometry(1.5, 1.0), paperMat);
  scene.add(paper);

  // ---------- the hand mould (left) ----------
  box(2.0, 0.2, 1.4, wood, [CAST[0], 1.2, 0]);
  const mould = box(0.36, 0.5, 0.36, iron, [CAST[0], 1.55, 0]);
  for (const s of [-1, 1]) box(0.14, 0.4, 0.5, wood, [CAST[0] + s * 0.27, 1.55, 0], 0.03); // wooden grips
  const ladle = box(0.5, 0.18, 0.4, iron, [CAST[0] + 0.5, 2.5, 0], 0.06);
  const metal = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 1, 10), new T.MeshBasicMaterial({ color: 0xffa040 }));
  scene.add(metal);
  const cast = Array.from({ length: 6 }, (_, k) => letter(k));

  // ---------- the composing stick (right) ----------
  box(2.4, 0.2, 1.4, wood, [STICK[0], 1.2, 0]);
  box(1.8, 0.06, 0.34, iron, [STICK[0], 1.36, 0.3]); // the stick
  box(1.8, 0.3, 0.05, iron, [STICK[0], 1.5, 0.12]);
  const set = Array.from({ length: 6 }, (_, k) => letter(k));
  const lines = Array.from({ length: 3 }, (_, r) => box(1.5, 0.3, 0.22, typeMetal, [STICK[0], 1.45, -0.15 - r * 0.25], 0.02));

  let pressDown = 0;
  return {
    update(step, _p, _t, s) {
      // casting: every 3 s one letter – metal runs in, the letter comes out and joins the others on the table
      const castCount = step === 1 ? Math.min(6, Math.floor(s / 3)) : step > 1 ? 6 : 0;
      const phase = (s % 3) / 3;
      metal.visible = step === 1 && phase < 0.35 && castCount < 6;
      metal.position.set(CAST[0] + 0.25, 2.05, 0);
      metal.scale.y = 0.85;
      ladle.rotation.z = step === 1 && phase < 0.35 ? -0.5 : 0;
      cast.forEach((m, k) => {
        const done = k < castCount, now = step === 1 && k === castCount;
        m.visible = done || (now && phase > 0.35);
        const out = now ? ease(clamp((phase - 0.4) / 0.4)) : 1;
        m.position.set(lerp(CAST[0], CAST[0] - 0.75 + (k % 3) * 0.26, out), lerp(1.75, 1.46, out), lerp(0, -0.3 + Math.floor(k / 3) * 0.3, out));
      });
      // setting: the six letters fly into the stick, then the line joins the others
      set.forEach((m, k) => {
        const at = 0.4 + k * 0.7;
        const go = step === 2 ? ease(clamp((s - at) / 0.6)) : step > 2 ? 1 : 0;
        m.visible = step >= 2;
        m.position.set(lerp(STICK[0] - 1.6, STICK[0] - 0.62 + k * 0.24, go), lerp(2.2, 1.55, go) + Math.sin(go * Math.PI) * 0.3, 0.3);
      });
      lines.forEach((m, r) => (m.visible = step >= 2 && (step > 2 || s > 4.8 + r * 0.5)));
      // printing: ink, lay the paper, press, lift
      const inking = step === 3 ? clamp(s / 2.4) : 0;
      inkMat.opacity = step === 3 ? Math.min(0.85, inking * 1.2) : 0;
      ball.visible = step === 3 && s < 2.6;
      ball.position.set(-0.4 + 0.8 * (0.5 + 0.5 * Math.sin(s * 3)), 2.3 + 0.15 * Math.abs(Math.sin(s * 6)), 0.2 * Math.cos(s * 2));
      const lay = step === 3 ? ease(clamp((s - 2.6) / 0.8)) : 0;
      pressDown = step === 3 ? ease(clamp((s - 3.6) / 1.0)) * (1 - ease(clamp((s - 5.2) / 0.8))) : 0;
      const lift = step === 3 ? ease(clamp((s - 6.2) / 1.0)) : 0;
      paper.visible = step === 3 || step === 0;
      paperMat.map = lift > 0 ? printed : blank;
      if (step === 0) {
        paper.position.set(2.6, 1.31, 0.4);
        paper.rotation.set(-Math.PI / 2, 0, 0.2);
      } else {
        paper.position.set(lerp(2.6, 0, lay), lerp(1.4, 2.1, lay) + lift * 0.9, lerp(0.4, 0, lay) + lift * 0.6);
        paper.rotation.set(-Math.PI / 2 + lift * 1.1, 0, 0);
      }
      platen.position.y = 2.9 - 0.72 * pressDown;
      spindle.position.y = 4.0 - 0.72 * pressDown;
      spindle.rotation.y = -pressDown * 1.6;
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.4)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [4, 5, 14], look: [0, 2.6, 0] },
        { pos: [-2.4, 3.2, 4.6], look: [CAST[0], 1.7, 0] },
        { pos: [5.8, 3.4, 4.4], look: [STICK[0], 1.5, 0] },
        { pos: [2.6, 4.2, 6.8], look: [0, 2.6, 0] },
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step, _p, _t, s) {
      if (step === 0) return [{ at: [0, 6.5, 0] as Vec3, text: 0 }, { at: [CAST[0], 2.2, 0] as Vec3, text: 1 }, { at: [STICK[0], 2.0, 0] as Vec3, text: 4 }];
      if (step === 1) return [{ at: [CAST[0] - 0.6, 1.95, 0.3] as Vec3, text: 1 }, { at: [CAST[0] + 0.9, 2.15, 0.2] as Vec3, text: 2, color: "#ffb060" }, { at: [CAST[0] - 0.5, 1.15, 0.6] as Vec3, text: 3, color: "#e9ecef" }];
      if (step === 2) return [{ at: [STICK[0], 1.9, 0.5] as Vec3, text: 4 }, ...(s > 4.8 ? [{ at: [STICK[0], 1.0, -0.4] as Vec3, text: 5, color: "#ffd24a" }] : [])];
      return [
        ...(s < 2.6 ? [{ at: [0, 2.9, 0.5] as Vec3, text: 6 }] : []),
        { at: [0.35, 4.9, 0.3] as Vec3, text: 7 },
        ...(pressDown > 0.3 ? [{ at: [1.4, 2.5, 0.7] as Vec3, text: 8, color: "#ffd24a" }] : []),
        ...(s > 6.6 ? [{ at: [0, 3.5, 0.9] as Vec3, text: 9, color: "#fff2c8" }] : []),
      ];
    },
    stage: { shadows: true, floor: 0 },
  };
};
