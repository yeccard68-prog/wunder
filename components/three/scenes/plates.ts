// Plate tectonics as a block cut out of the Earth: plates drifting on the mantle, a mid-ocean ridge
// (apart), a subduction zone with volcano and mountains (together), a transform fault (past each other).
// labels: 0 plate, 1 mantle, 2 magma, 3 mid-ocean ridge, 4 volcano, 5 earthquake, 6 ocean
// Heights are exaggerated and millions of years are squeezed into seconds; plates move a few centimetres a year.
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, type SceneFactory, type Vec3 } from "../types";

const W = 4.9; // width of one plate
const D = 4; // depth of the block
const TOP = 0; // surface of the oceanic plates
const THICK = 0.6;
const MANTLE = 1.7;

export const plates: SceneFactory = ({ THREE: T, scene }) => {
  const basalt = new T.MeshStandardMaterial({ color: 0x4b4f57, roughness: 0.9 });
  const stripeMat = new T.MeshStandardMaterial({ color: 0x33363c, roughness: 0.9 });
  const granite = new T.MeshStandardMaterial({ color: 0x8c7860, roughness: 0.95 });
  const land = new T.MeshStandardMaterial({ color: 0x6f8f55, roughness: 1 });
  const rock = new T.MeshStandardMaterial({ color: 0x77695a, roughness: 1 });
  const hot = new T.MeshBasicMaterial({ color: 0xffa23a });
  const box = (w: number, h: number, d: number, mat: InstanceType<typeof T.Material>, at: Vec3, parent: InstanceType<typeof T.Object3D> = scene) => {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    m.position.set(...at);
    parent.add(m);
    return m;
  };

  // the mantle: hot, slowly flowing rock – glowing from within
  box(2 * W + 0.2, MANTLE, D, new T.MeshStandardMaterial({ color: 0xb8431c, emissive: 0x8a2408, emissiveIntensity: 0.9, roughness: 0.85 }), [0, TOP - THICK - MANTLE / 2, 0]);
  box(2 * W + 0.2, 0.5, D, new T.MeshStandardMaterial({ color: 0xe8792a, emissive: 0xc24a10, emissiveIntensity: 1, roughness: 0.8 }), [0, TOP - THICK - MANTLE - 0.25, 0]);
  const cells = Array.from({ length: 18 }, () => box(0.12, 0.12, 0.04, hot, [0, 0, D / 2 + 0.03])); // rock circulating in the mantle

  // an oceanic plate: dark basalt with stripes on the sea floor, so its movement can be seen
  const oceanic = (side: number) => {
    const g = new T.Group();
    box(W, THICK, D, basalt, [0, -THICK / 2, 0], g);
    const stripes = new T.Group();
    for (let i = 0; i < 9; i++) box(0.16, 0.012, D, stripeMat, [-W / 2 + 0.3 + i * 0.55, 0.006, 0], stripes);
    g.add(stripes);
    g.position.x = side * (W / 2);
    scene.add(g);
    return g;
  };
  // a continental plate: thicker and lighter rock, land on top, a path across it
  const continental = (side: number) => {
    const g = new T.Group();
    box(W, THICK + 0.3, D, granite, [0, 0.3 - (THICK + 0.3) / 2, 0], g);
    box(W, 0.05, D, land, [0, 0.325, 0], g);
    box(W, 0.02, 0.16, new T.MeshStandardMaterial({ color: 0xd9c9a3, roughness: 1 }), [0, 0.36, 0], g); // a road: shows the offset at the fault
    g.position.x = side * (W / 2);
    scene.add(g);
    return g;
  };
  const leftSea = oceanic(-1);
  const rightSea = oceanic(1);
  const leftLand = continental(-1);
  const rightLand = continental(1);
  const ocean = box(1, 0.34, D, new T.MeshStandardMaterial({ color: 0x3f8fd0, transparent: true, opacity: 0.42, roughness: 0.15, metalness: 0.1, depthWrite: false }), [0, TOP + 0.17, 0]);
  ocean.renderOrder = 3;

  // mid-ocean ridge: magma wells up in the gap and builds a ridge
  const upwelling = box(1, THICK + 0.25, D, new T.MeshBasicMaterial({ color: 0xff7a1a }), [0, TOP - THICK / 2 + 0.1, 0]);
  const ridge = [-1, 1].map((side) => {
    const m = box(0.34, 0.2, D, basalt, [0, 0, 0]);
    return { m, side };
  });
  const rising = Array.from({ length: 8 }, () => box(0.13, 0.13, 0.05, hot, [0, 0, D / 2 + 0.03]));

  // subduction: the heavier oceanic plate bends down and dives under the continent
  const slab = new T.Group();
  slab.position.set(-0.05, TOP - THICK / 2, 0);
  box(3.4, THICK, D + 0.06, basalt, [1.7, 0, 0], slab); // a little deeper than the block, so it shows on the cut face
  scene.add(slab);
  const volcano = new T.Group();
  const cone = new T.Mesh(new T.ConeGeometry(0.75, 1.05, 32, 1, true), rock);
  cone.position.y = 0.52;
  const crater = new T.Mesh(new T.SphereGeometry(0.13, 16, 12), new T.MeshBasicMaterial({ color: 0xffb040 }));
  crater.position.y = 1.02;
  const lavaLight = new T.PointLight(0xff7a30, 0, 5, 1.5);
  lavaLight.position.y = 1.3;
  volcano.add(cone, crater, lavaLight);
  volcano.position.set(2.5, 0.35, 0.3);
  const mountains = Array.from({ length: 6 }, (_, i) => {
    const height = 0.9 + 0.25 * ((i * 7) % 3);
    const geometry = new T.ConeGeometry(0.42 + 0.12 * (i % 3), height, 5);
    geometry.translate(0, height / 2, 0); // grows upwards from the ground
    const m = new T.Mesh(geometry, rock);
    m.position.set(0.75 + 0.28 * (i % 2), 0.35, -1.45 + i * 0.55);
    scene.add(m);
    return m;
  });
  scene.add(volcano);
  const melt = Array.from({ length: 6 }, () => box(0.12, 0.12, 0.12, hot, [0, 0, 0]));

  // transform fault: waves of an earthquake spreading from where the plates slip
  const rings = [0, 1, 2].map(() => {
    const m = new T.Mesh(new T.RingGeometry(0.9, 1, 48), new T.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.45;
    scene.add(m);
    return m;
  });
  const show = (o: { visible: boolean }, v: boolean) => (o.visible = v);
  const side = { pos: [4, 3.6, 14.8] as Vec3, look: [0, -0.95, 0] as Vec3 };
  const above = { pos: [0, 14.2, 4.4] as Vec3, look: [0, 0, 0.15] as Vec3 };
  let gap = 0;
  let quake = 0;

  return {
    update(step, p, t) {
      const sea = step <= 1;
      show(leftSea, step <= 2);
      show(rightSea, sea);
      show(rightLand, step >= 2);
      show(leftLand, step === 3);
      show(ocean, step <= 2);
      show(upwelling, step === 1);
      ridge.forEach(({ m }) => show(m, sea));
      show(slab, step === 2);
      show(volcano, step === 2);
      mountains.forEach((m) => show(m, step === 2));

      // drifting apart (0, 1): the sea-floor stripes travel away from the middle
      gap = step === 1 ? 0.75 * ease(p) : 0;
      const drift = (t * 0.22) % 0.55;
      leftSea.position.set(-W / 2 - gap / 2, 0, 0);
      rightSea.position.set(W / 2 + gap / 2, 0, 0);
      const stripesL = leftSea.children[1];
      const stripesR = rightSea.children[1];
      stripesL.position.x = step === 2 ? drift : -drift; // towards the trench when it dives, else away from the ridge
      stripesR.position.x = drift - 0.3;
      ocean.scale.x = step === 2 ? W - 0.1 : 2 * W + gap;
      ocean.position.x = step === 2 ? -W / 2 - 0.05 : 0;
      upwelling.scale.x = Math.max(0.01, gap);
      ridge.forEach(({ m, side: s }) => m.position.set(s * (gap / 2 + 0.2), TOP + 0.1, 0));
      rising.forEach((m, i) => {
        const u = (t * 0.3 + i / rising.length) % 1;
        show(m, step === 1);
        m.position.set((i % 2 ? 1 : -1) * 0.06 * i * u * 0.3, lerp(TOP - THICK - 1.2, TOP - 0.1, u), D / 2 + 0.03);
      });
      // rock circulating in the mantle: rises in the middle, sinks at the edges
      cells.forEach((m, i) => {
        const cell = i % 2 ? 1 : -1;
        const a = cell * (t * 0.35 + (i * 0.7));
        show(m, step <= 1);
        m.position.set(cell * 2.5 + 2 * Math.cos(a), TOP - THICK - MANTLE / 2 + 0.55 * Math.sin(a), D / 2 + 0.03);
      });

      // colliding (2)
      const dive = step === 2 ? ease(clamp(p * 1.1)) : 0;
      slab.rotation.z = -0.6 * dive;
      slab.scale.x = Math.max(0.02, dive);
      const built = step === 2 ? ease(clamp(p * 1.5 - 0.35)) : 0;
      volcano.scale.setScalar(Math.max(0.001, built));
      lavaLight.intensity = 6 * built * (0.8 + 0.2 * Math.sin(t * 9));
      mountains.forEach((m, i) => m.scale.set(1, Math.max(0.001, built * (0.8 + 0.2 * (i % 2))), 1));
      melt.forEach((m, i) => {
        const u = (t * 0.28 + i / melt.length) % 1;
        show(m, step === 2 && built > 0.2);
        m.position.set(lerp(1.9, 2.5, u), lerp(-1.45, 0.3, u), 0.3);
      });

      // sliding past each other (3): stuck for a long time, then a sudden jerk
      const slip = step === 3 ? 0.55 * ease(clamp((p - 0.5) * 9)) : 0;
      const strain = step === 3 ? 0.12 * clamp(p / 0.5) * (1 - ease(clamp((p - 0.5) * 9))) : 0; // the edges are dragged along before they let go
      quake = step === 3 ? clamp((p - 0.52) * 2.6) : 0;
      const shake = quake > 0 && quake < 1 ? 0.05 * (1 - quake) * Math.sin(t * 55) : 0;
      leftLand.position.set(-W / 2 + shake, 0, -(slip + strain) / 2);
      rightLand.position.set(W / 2 - shake, 0, (slip + strain) / 2);
      rings.forEach((m, i) => {
        const u = clamp(quake * 1.6 - i * 0.22);
        show(m, step === 3 && u > 0 && u < 1);
        m.scale.setScalar(0.3 + 3.2 * u);
        (m.material as InstanceType<typeof T.MeshBasicMaterial>).opacity = 0.85 * (1 - u);
      });
    },
    camera(step, _p, _t, s) {
      if (step < 3) return side;
      const k = ease(clamp(s / (TIMING.camera * 1.6)));
      return { pos: mix(side.pos, above.pos, k), look: mix(side.look, above.look, k) };
    },
    labels(step, p) {
      if (step === 0) return [{ at: [-2.6, 0.75, 0], text: 6, color: "#9ccbff" }, { at: [2.6, -0.3, D / 2], text: 0 }, { at: [0, -1.5, D / 2], text: 1, color: "#ffb37a" }];
      if (step === 1) return [{ at: [0, 0.95, 0], text: 3, color: "#ffd24a" }, { at: [0, -1.2, D / 2], text: 2, color: "#ffb37a" }];
      if (step === 2) return p > 0.5 ? [{ at: [2.5, 2, 0.3], text: 4, color: "#ffd24a" }, { at: [1.6, -1.2, D / 2], text: 2, color: "#ffb37a" }, { at: [-2.8, 0.75, 0], text: 6, dim: true }] : [{ at: [-2.8, 0.75, 0], text: 6, color: "#9ccbff" }, { at: [2.6, 0.95, 0], text: 0 }];
      return quake > 0.05 ? [{ at: [0, 0.6, -1.3], text: 5, color: "#ffd24a" }] : [{ at: [-2.5, 0.6, 1.2], text: 0 }, { at: [2.5, 0.6, -1.2], text: 0 }];
    },
    stage: { shadows: true },
  };
};
