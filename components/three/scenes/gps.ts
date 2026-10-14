// How GPS finds a position: satellites send their time, the receiver turns travel times into distances,
// three circles meet in one point – and a fourth satellite corrects the receiver's clock.
// labels: 0 satellite, 1 radio signal with the time, 2 receiver, 3 same distance: a circle,
//         4 two circles: two possible points, 5 three circles: one point,
//         6 inaccurate clock: the circles miss, 7 fourth satellite corrects the clock
// Hugely compressed: the satellites fly about 20,000 km up, the map shows a few streets. On the ground
// each distance sphere shows up as a circle (the sphere's cut with the ground).
import { TIMING } from "@/lib/animations";
import { painter } from "../surface";
import { clamp, ease, lerp, mix, type SceneFactory, type Vec3 } from "../types";

const HERE: Vec3 = [1.1, 0, 0.9]; // where the receiver is
const SATS: Vec3[] = [[-2.8, 7.4, -1.6], [3.6, 8.2, -2.4], [-0.6, 7.8, 3.8], [4.6, 6.8, 2.8]];
const COLORS = [0x5fb4ff, 0xffb347, 0x8ee07a, 0xe58cff];
const ERROR = 0.75; // how much too long every distance is with the receiver's inaccurate clock

const radiusOnGround = (s: Vec3, extra = 0) => {
  const d = Math.hypot(s[0] - HERE[0], s[1] - HERE[1], s[2] - HERE[2]) + extra;
  return Math.sqrt(Math.max(0.01, d * d - s[1] * s[1]));
};
// the other point where the first two circles cross (the first is HERE)
const secondCrossing = (): Vec3 => {
  const [a, b] = [SATS[0], SATS[1]];
  const [ra, rb] = [radiusOnGround(a), radiusOnGround(b)];
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const d = Math.hypot(dx, dz);
  const along = (ra * ra - rb * rb + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, ra * ra - along * along));
  const [mx, mz] = [a[0] + (along * dx) / d, a[2] + (along * dz) / d];
  const p1: Vec3 = [mx + (h * dz) / d, 0, mz - (h * dx) / d];
  const p2: Vec3 = [mx - (h * dz) / d, 0, mz + (h * dx) / d];
  return Math.hypot(p1[0] - HERE[0], p1[2] - HERE[2]) > Math.hypot(p2[0] - HERE[0], p2[2] - HERE[2]) ? p1 : p2;
};

export const gps: SceneFactory = ({ THREE: T, scene }) => {
  const surface = painter(T);
  scene.background = surface.paint((c, w, h) => {
    const grad = c.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#050b1c");
    grad.addColorStop(0.65, "#1c3463");
    grad.addColorStop(1, "#5d86b8");
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      c.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * ((i * 37) % 10) / 10})`;
      c.fillRect((i * 73) % w, ((i * 29) % 60) * (h / 128), 1, 1);
    }
  });
  // the map: a town with streets, a river and a park, painted once
  const map = surface.paint((c, w, h) => {
    c.fillStyle = "#e9e4d6";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#b9d7a0";
    c.fillRect(150, 70, 60, 40);
    c.strokeStyle = "#7fb2e0";
    c.lineWidth = 9;
    c.beginPath();
    c.moveTo(0, 30);
    c.bezierCurveTo(80, 10, 120, 70, 256, 50);
    c.stroke();
    c.strokeStyle = "#ffffff";
    c.lineWidth = 4;
    for (let x = 20; x < w; x += 38) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x + 8, h);
      c.stroke();
    }
    for (let y = 14; y < h; y += 30) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y + 4);
      c.stroke();
    }
  });
  const ground = new T.Mesh(new T.BoxGeometry(19, 0.2, 16), [
    new T.MeshStandardMaterial({ color: 0xbdb6a4 }), new T.MeshStandardMaterial({ color: 0xbdb6a4 }),
    new T.MeshStandardMaterial({ map, roughness: 0.95 }), new T.MeshStandardMaterial({ color: 0xbdb6a4 }),
    new T.MeshStandardMaterial({ color: 0xbdb6a4 }), new T.MeshStandardMaterial({ color: 0xbdb6a4 }),
  ]);
  ground.position.set(0.5, -0.1, 0.3);
  ground.receiveShadow = true;
  scene.add(ground);

  // satellites: a gold-wrapped body with two solar wings
  const gold = new T.MeshStandardMaterial({ color: 0xd8a441, metalness: 0.85, roughness: 0.35 });
  const panel = new T.MeshStandardMaterial({ color: 0x1f3f8a, metalness: 0.6, roughness: 0.3, emissive: new T.Color(0x0a1a40) });
  const sats = SATS.map((at) => {
    const g = new T.Group();
    g.add(new T.Mesh(new T.BoxGeometry(0.5, 0.5, 0.5), gold));
    for (const side of [-1, 1]) {
      const wing = new T.Mesh(new T.BoxGeometry(1.1, 0.03, 0.42), panel);
      wing.position.x = side * 0.85;
      g.add(wing);
    }
    const dish = new T.Mesh(new T.ConeGeometry(0.16, 0.2, 16, 1, true), new T.MeshStandardMaterial({ color: 0xe8e8e8, side: T.DoubleSide }));
    dish.position.y = -0.33;
    g.add(dish);
    g.position.set(...at);
    g.lookAt(HERE[0], HERE[1], HERE[2]);
    g.rotateX(-Math.PI / 2); // the dish (underside) points at the ground
    scene.add(g);
    return g;
  });
  // the signal: a sphere growing out of the satellite, again and again
  const pings = SATS.map((_, i) => {
    const mat = new T.MeshBasicMaterial({ color: COLORS[i], transparent: true, opacity: 0.18, depthWrite: false, side: T.DoubleSide });
    const m = new T.Mesh(new T.SphereGeometry(1, 40, 24), mat);
    m.position.set(...SATS[i]);
    m.renderOrder = 3;
    scene.add(m);
    return { m, mat };
  });
  // the circles on the ground
  const rings = SATS.map((s, i) => {
    const m = new T.Mesh(new T.TorusGeometry(1, 0.045, 8, 120), new T.MeshBasicMaterial({ color: COLORS[i] }));
    m.rotation.x = Math.PI / 2;
    m.position.set(s[0], 0.03, s[2]);
    scene.add(m);
    return m;
  });
  // the receiver: a phone lying on the map, and a pin that drops once the position is known
  const phone = new T.Group();
  const body = new T.Mesh(new T.BoxGeometry(0.34, 0.06, 0.62), new T.MeshStandardMaterial({ color: 0x24262b, roughness: 0.4 }));
  const screen = new T.Mesh(new T.BoxGeometry(0.29, 0.01, 0.54), new T.MeshStandardMaterial({ color: 0x0b1d33, emissive: new T.Color(0x3a8fff), emissiveIntensity: 0.6 }));
  screen.position.y = 0.035;
  phone.add(body, screen);
  phone.position.set(HERE[0], 0.04, HERE[2]);
  scene.add(phone);
  const pinMat = new T.MeshStandardMaterial({ color: 0xe0413a, emissive: new T.Color(0xe0413a), emissiveIntensity: 0.3, roughness: 0.4 });
  const pin = new T.Group();
  const head = new T.Mesh(new T.SphereGeometry(0.22, 20, 14), pinMat);
  head.position.y = 0.75;
  const point = new T.Mesh(new T.ConeGeometry(0.13, 0.55, 16), pinMat);
  point.rotation.x = Math.PI;
  point.position.y = 0.36;
  pin.add(head, point);
  pin.position.set(HERE[0], 0, HERE[2]);
  scene.add(pin);
  const markers = [0, 1].map(() => {
    const m = new T.Mesh(new T.SphereGeometry(0.12, 14, 10), new T.MeshBasicMaterial({ color: 0xffffff }));
    scene.add(m);
    return m;
  });
  const other = secondCrossing();
  scene.traverse((o) => {
    if ((o as InstanceType<typeof T.Mesh>).isMesh && o !== ground) o.castShadow = false;
  });

  return {
    update(step, p, t, s) {
      const appear = ease(clamp(s / TIMING.appear));
      // which satellites are in use, and how long their circles are (with the clock error in the last step)
      const used = step === 0 ? 0 : step === 1 ? 1 : step === 2 ? (p < 0.5 ? 2 : 3) : 4;
      const fix = step === 3 ? ease(clamp((p - 0.55) / 0.3)) : 1;
      const extra = step === 3 ? ERROR * (1 - fix) : 0;
      pings.forEach(({ m, mat }, i) => {
        const d = Math.hypot(SATS[i][0] - HERE[0], SATS[i][1] - HERE[1], SATS[i][2] - HERE[2]);
        const u = (t * 0.45 + i * 0.27) % 1;
        // step 0: all send; later: the sphere of the satellite just added grows to the receiver and stays faint
        const active = step === 0 || (i < used && i === used - 1 && (step < 3 || p > 0.38));
        m.visible = active;
        // step 0: waves around each satellite (the real signal spreads out all the way to the ground)
        const r = step === 0 ? 0.4 + u * 4 : Math.min(1, (step === 3 ? (p - 0.38) / 0.17 : s / 1.6)) * d;
        m.scale.setScalar(Math.max(0.01, r));
        mat.opacity = step === 0 ? 0.3 * (1 - u) : 0.09;
      });
      rings.forEach((m, i) => {
        const shown = i < used && !(step === 3 && i === 3) && step > 0;
        m.visible = shown;
        const grow = i === used - 1 && step < 3 ? appear : 1;
        m.scale.setScalar(Math.max(0.01, radiusOnGround(SATS[i], extra) * grow));
      });
      // two crossings with two circles, one with three
      markers[0].visible = step === 2 && p < 0.5 && p > 0.15;
      markers[1].visible = markers[0].visible;
      markers[0].position.set(HERE[0], 0.12, HERE[2]);
      markers[1].position.set(other[0], 0.12, other[2]);
      const known = step === 2 ? clamp((p - 0.6) / 0.15) : step === 3 ? fix : 0;
      pin.visible = known > 0.01;
      pin.position.y = lerp(1.6, 0, ease(known));
      pinMat.emissiveIntensity = 0.3 + 0.3 * Math.sin(t * 4) * known;
      sats.forEach((g, i) => (g.position.y = SATS[i][1] + 0.08 * Math.sin(t * 0.8 + i)));
      screen.material.emissiveIntensity = 0.5 + 0.3 * known;
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.5)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [0.8, 6.8, 21], look: [0.6, 4.2, 0] },
        { pos: [-1.2, 13, 12.5], look: [-1, 0, -0.6] },
        { pos: [0.8, 19, 10], look: [0.8, 0, 0.4] }, // from above, to see the circles cross
        { pos: [1.2, 19.5, 10.5], look: [1, 0, 0.6] },
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step, p) {
      const sat = { at: [SATS[1][0], SATS[1][1] + 0.9, SATS[1][2]] as Vec3, text: 0 };
      const here = { at: [HERE[0] + 0.2, 0.5, HERE[2] + 0.5] as Vec3, text: 2 };
      if (step === 0) return [sat, { at: [-1.6, 4.6, 0.5], text: 1, color: "#bfe2ff" }, here];
      if (step === 1) return [{ at: [SATS[0][0] + radiusOnGround(SATS[0]) * 0.35, 0.3, SATS[0][2] + radiusOnGround(SATS[0]) * 0.94], text: 3, color: "#9fd0ff" }, { ...here, dim: true }];
      if (step === 2) return p < 0.5 ? [{ at: [other[0], 0.6, other[2]], text: 4, color: "#ffffff" }] : [{ at: [HERE[0], 2, HERE[2]], text: 5, color: "#ffffff" }];
      return p < 0.45 ? [{ at: [HERE[0], 1.3, HERE[2]], text: 6, color: "#ffb0a8" }] : [{ at: [SATS[3][0], SATS[3][1] + 0.9, SATS[3][2]], text: 7, color: "#f0b8ff" }];
    },
  };
};
