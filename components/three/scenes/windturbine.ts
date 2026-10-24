// A wind turbine: wind turns the rotor, a gearbox speeds the rotation up, the generator turns it into
// current – and twice the wind speed carries eight times the power.
// labels: 0 rotor blade, 1 nacelle, 2 tower, 3 wind, 4 gearbox, 5 generator, 6 slow shaft, 7 fast shaft,
//         8 magnet turns in coils: current, 9 twice the wind: 8 × the power, 10 to the grid
// Not to scale: the rotor turns faster than a real one (10–15 turns a minute) and the gearbox ratio is
// shown as 6 : 1 instead of about 100 : 1, so that both shafts can be seen turning.
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { TIMING } from "@/lib/animations";
import { painter } from "../surface";
import { clamp, ease, lerp, mix, rand, type SceneFactory, type Vec3 } from "../types";

const HUB: Vec3 = [0, 6.6, 1.3];
const SLOW = 0.55; // rotor speed in radians per second at the first wind speed
const RATIO = 6; // gearbox, for the picture
const RAMP = 2.2; // seconds until the stronger wind has the rotor at full speed

export const windturbine: SceneFactory = ({ THREE: T, scene }) => {
  const surface = painter(T);
  scene.background = surface.paint((c, w, h) => {
    const grad = c.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#3d74b4");
    grad.addColorStop(0.75, "#a9cbe8");
    grad.addColorStop(1, "#dcebf4");
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
  });
  const white = new T.MeshStandardMaterial({ color: 0xf2f4f6, roughness: 0.45, metalness: 0.1 });
  const steel = new T.MeshStandardMaterial({ color: 0xb9bdc4, metalness: 0.9, roughness: 0.3 });
  const copper = new T.MeshStandardMaterial({ color: 0xc8793a, metalness: 0.9, roughness: 0.3 });
  const dark = new T.MeshStandardMaterial({ color: 0x3a3d43, metalness: 0.7, roughness: 0.45 });

  // grass, tower (slightly tapered), nacelle
  const ground = new T.Mesh(new T.CircleGeometry(16, 48), new T.MeshStandardMaterial({ color: 0x6f9a52, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  const tower = new T.Mesh(new T.CylinderGeometry(0.2, 0.42, 6.4, 32), white);
  tower.position.y = 3.2;
  const shellMat = new T.MeshStandardMaterial({ color: 0xf2f4f6, roughness: 0.4, metalness: 0.1, transparent: true, opacity: 1 });
  const shell = new T.Mesh(new RoundedBoxGeometry(1.15, 1.1, 2.9, 5, 0.3), shellMat); // the nacelle: a box with rounded edges
  shell.position.set(0, 6.6, -0.35);
  scene.add(ground, tower, shell);
  // flanges where the tower sections are bolted together
  for (const y of [2.15, 4.3]) {
    const flange = new T.Mesh(new T.TorusGeometry(0.42 - (y / 6.4) * 0.22 + 0.01, 0.025, 8, 40), white);
    flange.rotation.x = Math.PI / 2;
    flange.position.y = y;
    scene.add(flange);
  }

  // inside the nacelle: slow shaft → gearbox → fast shaft → generator
  const inside = new T.Group();
  const shaft = (r: number, length: number, z: number, mat: InstanceType<typeof T.Material>) => {
    const m = new T.Mesh(new T.CylinderGeometry(r, r, length, 20), mat);
    m.rotation.x = Math.PI / 2;
    m.position.set(0, 6.6, z);
    inside.add(m);
    return m;
  };
  const slowShaft = shaft(0.14, 1.4, 0.6, steel);
  const gearbox = new T.Mesh(new RoundedBoxGeometry(0.75, 0.75, 0.55, 4, 0.1), dark);
  gearbox.position.set(0, 6.6, -0.35);
  inside.add(gearbox);
  for (let k = -2; k <= 2; k++) {
    const rib = new T.Mesh(new RoundedBoxGeometry(0.82, 0.05, 0.5, 2, 0.02), dark); // cooling ribs
    rib.position.set(0, 6.6 + k * 0.14, -0.35);
    inside.add(rib);
  }
  const fastShaft = shaft(0.06, 0.55, -0.85, steel);
  // generator: copper coils around a ring, a magnet turning inside
  const stator = new T.Group();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const coil = new T.Mesh(new RoundedBoxGeometry(0.16, 0.13, 0.5, 3, 0.05), copper);
    coil.position.set(0.36 * Math.cos(a), 0.36 * Math.sin(a), 0);
    coil.rotation.z = a;
    stator.add(coil);
  }
  const yoke = new T.Mesh(new T.TorusGeometry(0.47, 0.05, 10, 48), dark); // the iron ring the coils sit on
  stator.add(yoke);
  stator.position.set(0, 6.6, -1.35);
  const magnet = new T.Group();
  // a round magnet: north half (red) and south half (green), turning about the shaft
  const halfMagnet = (color: number, start: number) => {
    const m = new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 0.46, 32, 1, false, start, Math.PI), new T.MeshPhysicalMaterial({ color, roughness: 0.35, clearcoat: 0.7 }));
    m.rotation.x = Math.PI / 2;
    return m;
  };
  const north = halfMagnet(0xc8443a, -Math.PI / 2);
  const south = halfMagnet(0x3a8f5c, Math.PI / 2);
  magnet.add(north, south);
  magnet.position.set(0, 6.6, -1.35);
  inside.add(stator, magnet);
  scene.add(inside);

  // rotor: spinner and three blades with a wing-like outline, pitched into the wind
  const rotor = new T.Group();
  rotor.position.set(...HUB);
  const spinner = new T.Mesh(new T.SphereGeometry(0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), white);
  spinner.rotation.x = Math.PI / 2;
  rotor.add(spinner);
  // a blade: wing sections (a thick, rounded front edge and a thin back edge) along the span – round at the
  // root, widest just outside it, narrowing towards the tip and twisted, flatter towards the tip
  const bladeGeo = (() => {
    const SPAN = 26, AROUND = 24, ROOT = 0.2, TIP = 4.1;
    const pos: number[] = [], idx: number[] = [];
    for (let j = 0; j <= SPAN; j++) {
      const t = j / SPAN, y = ROOT + (TIP - ROOT) * t;
      const chord = t < 0.12 ? lerp(0.22, 0.58, t / 0.12) : lerp(0.58, 0.1, (t - 0.12) / 0.88);
      const round = clamp(1 - t / 0.1); // round (a tube) at the root
      const thick = lerp(0.12, 1, round);
      const twist = (lerp(22, 2, Math.pow(t, 0.7)) * Math.PI) / 180;
      for (let i = 0; i < AROUND; i++) {
        const a = (i / AROUND) * Math.PI * 2;
        // a simple wing section: x from the front edge (−) to the back edge (+), z the thickness
        const x = (Math.cos(a) * 0.5) * chord;
        const k = (1 - Math.cos(a)) / 2; // 0 at the back edge, 1 at the front edge
        const z = Math.sin(a) * chord * thick * (0.35 + 0.65 * Math.sqrt(k)) * 0.5;
        pos.push(x * Math.cos(twist) - z * Math.sin(twist) - 0.05, y, x * Math.sin(twist) + z * Math.cos(twist));
      }
    }
    for (let j = 0; j < SPAN; j++)
      for (let i = 0; i < AROUND; i++) {
        const a = j * AROUND + i, b = j * AROUND + ((i + 1) % AROUND), c = a + AROUND, d = b + AROUND;
        idx.push(a, c, b, b, c, d);
      }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  })();
  for (let i = 0; i < 3; i++) {
    const arm = new T.Group();
    arm.rotation.z = (i / 3) * Math.PI * 2;
    const blade = new T.Mesh(bladeGeo, white);
    blade.rotation.y = 0.12; // pitch (the twist is part of the blade)
    arm.add(blade);
    rotor.add(arm);
  }
  scene.add(rotor);
  scene.traverse((o) => {
    if ((o as InstanceType<typeof T.Mesh>).isMesh && o !== ground) o.castShadow = true;
  });

  // wind: thin streaks flying towards the rotor and past it
  const windMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false });
  const streaks = Array.from({ length: 34 }, (_, i) => {
    const m = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 1.3, 6), windMat);
    m.rotation.x = Math.PI / 2;
    m.userData = { x: -4.6 + 9.2 * rand(i, 3), y: 2.4 + 8 * rand(i, 4) };
    scene.add(m);
    return m;
  });
  // current: dots from the generator down the tower to the grid
  const cablePath: Vec3[] = [[0, 6.3, -1.35], [0, 6.05, -0.3], [0, 5.9, 0.36], [0, 0.35, 0.5], [2.6, 0.2, 0.5]];
  const grid = new T.Mesh(new T.BoxGeometry(0.8, 0.7, 0.6), new T.MeshStandardMaterial({ color: 0x8a948c, roughness: 0.7 })); // transformer station
  grid.position.set(2.9, 0.35, 0.5);
  scene.add(grid);
  const sparks = Array.from({ length: 16 }, () => {
    const m = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), new T.MeshBasicMaterial({ color: 0xffd84a }));
    scene.add(m);
    return m;
  });
  const along = (path: Vec3[], u: number): Vec3 => {
    const lengths = path.slice(1).map((q, i) => Math.hypot(q[0] - path[i][0], q[1] - path[i][1], q[2] - path[i][2]));
    let d = u * lengths.reduce((a, b) => a + b, 0);
    for (let i = 0; i < lengths.length; i++) {
      if (d <= lengths[i]) return mix(path[i], path[i + 1], d / lengths[i]);
      d -= lengths[i];
    }
    return path[path.length - 1];
  };
  // power meter: eight blocks; one lit at the first wind speed, all eight at twice the speed
  const meter = new T.Group();
  scene.add(meter);
  const blocks = Array.from({ length: 8 }, (_, i) => {
    const mat = new T.MeshStandardMaterial({ color: 0x2b2f36, emissive: new T.Color(0xffc23a), emissiveIntensity: 0, roughness: 0.5 });
    const m = new T.Mesh(new T.BoxGeometry(0.7, 0.42, 0.3), mat);
    m.position.set(-3.4, 0.35 + i * 0.5, 0.8);
    meter.add(m);
    return mat;
  });

  return {
    update(step, _p, t, s) {
      // twice the wind in the last step; the rotor speeds up over RAMP seconds (angle = integral of speed)
      const stronger = step === 3 ? clamp(s / RAMP) : 0;
      const extra = step === 3 ? (s < RAMP ? (s * s) / (2 * RAMP) : s - RAMP / 2) : 0;
      const angle = SLOW * t + SLOW * extra;
      rotor.rotation.z = -angle;
      slowShaft.rotation.y = -angle;
      fastShaft.rotation.y = -angle * RATIO;
      magnet.rotation.z = -angle * RATIO;
      // look inside the nacelle in steps 1 and 2
      const open = step === 1 || step === 2 ? ease(clamp(s / TIMING.appear)) : 0;
      shellMat.opacity = lerp(1, 0.18, open);
      shellMat.depthWrite = open < 0.5;
      inside.visible = open > 0.02;
      const windSpeed = 4.2 * (1 + stronger);
      streaks.forEach((m, i) => {
        const z = 9 - ((t * windSpeed + i * 0.83) % 16);
        m.position.set(m.userData.x, m.userData.y, z);
      });
      sparks.forEach((m, i) => {
        m.visible = step >= 2;
        m.position.set(...along(cablePath, (t * 0.12 * (1 + stronger) + i / sparks.length) % 1));
      });
      // 8 × the power at twice the wind: v³
      const lit = step < 3 ? 1 : 1 + 7 * Math.pow(stronger, 3);
      blocks.forEach((mat, i) => (mat.emissiveIntensity = clamp(lit - i) * 1.6));
      meter.visible = step === 3;
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.5)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [9, 5.8, 16.5], look: [0, 5.6, 0] },
        { pos: [3.6, 7.5, -1.9], look: [0, 6.6, -0.45] }, // the nacelle, from the side and behind the rotor
        { pos: [2.9, 7.3, -3.2], look: [0, 6.6, -1.3] }, // the generator, from behind
        { pos: [8.4, 5.6, 17.5], look: [-0.9, 5.3, 0] },
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step, _p, t) {
      // the blade label rides along on one blade
      const a = SLOW * t;
      const blade: Vec3 = [HUB[0] + 2.6 * Math.sin(a), HUB[1] + 2.6 * Math.cos(a), HUB[2] + 0.2];
      if (step === 0) return [{ at: blade, text: 0 }, { at: [0, 7.5, -1.4], text: 1 }, { at: [0.6, 2.6, 0.4], text: 2 }, { at: [-3.8, 9.6, 4.5], text: 3, color: "#ffffff" }];
      if (step === 1) return [{ at: [0.2, 7.05, 0.75], text: 6 }, { at: [0, 5.95, -0.35], text: 4 }, { at: [0, 7.05, -0.9], text: 7 }, { at: [0, 5.95, -1.45], text: 5, dim: true }];
      if (step === 2) return [{ at: [0, 7.2, -1.4], text: 8, color: "#ffd84a" }, { at: [2.9, 1.05, 0.5], text: 10 }];
      return [{ at: [-3.4, 4.6, 0.8], text: 9, color: "#ffc23a" }, { at: [-3.8, 9.6, 4.5], text: 3, color: "#ffffff", dim: true }];
    },
    stage: { shadows: true },
  };
};
