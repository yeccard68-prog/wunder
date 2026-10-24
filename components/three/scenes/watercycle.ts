// The water cycle: evaporation over the sea, condensation into clouds, rain and snow over the
// mountains, and the way back through rivers and the ground.
// labels: 0 evaporation, 1 condensation, 2 precipitation, 3 run-off, 4 groundwater, 5 sea, 6 sun
// A cut through a landscape; drops are enormously enlarged and days to years are squeezed into seconds.
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { TIMING } from "@/lib/animations";
import { painter } from "../surface";
import { clamp, ease, lerp, mix, rand, type SceneFactory, type Vec3 } from "../types";

const D = 4; // depth of the block
const SHORE = -1.2;
// the land, as a profile from the shore up to the peak and down again: [x, height]
const PROFILE: [number, number][] = [[SHORE, 0.05], [0.4, 0.5], [2, 1.2], [3.6, 2.5], [4.6, 3.4], [5.6, 2.6], [7.5, 1.7]];
const groundAt = (x: number) => {
  for (let i = 1; i < PROFILE.length; i++) if (x <= PROFILE[i][0]) return lerp(PROFILE[i - 1][1], PROFILE[i][1], (x - PROFILE[i - 1][0]) / (PROFILE[i][0] - PROFILE[i - 1][0]));
  return PROFILE[PROFILE.length - 1][1];
};

export const watercycle: SceneFactory = ({ THREE: T, scene }) => {
  const surface = painter(T);
  scene.background = surface.paint((c, w, h) => {
    const grad = c.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#2d5f9a");
    grad.addColorStop(0.7, "#8dbbe0");
    grad.addColorStop(1, "#cfe3f0");
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
  });
  // sea, land (cut open at the front) and what lies below
  const sea = new T.Mesh(new T.BoxGeometry(7.2, 1.6, D), new T.MeshPhysicalMaterial({ color: 0x2a6aa8, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08 }));
  sea.position.set(SHORE - 3.6, -0.8, 0);
  const shape = new T.Shape();
  shape.moveTo(SHORE, -1.6);
  for (const [x, y] of PROFILE) shape.lineTo(x, y);
  shape.lineTo(7.5, -1.6);
  shape.closePath();
  // the cut face shows the layers below the ground: dark topsoil, lighter subsoil, grey rock (painted once)
  const strata = document.createElement("canvas");
  strata.width = 64;
  strata.height = 256;
  const c = strata.getContext("2d");
  if (c) {
    const bands: [number, string][] = [[0, "#7a7d80"], [0.45, "#8a6a48"], [0.75, "#6b4a30"], [0.93, "#3f2c1e"]];
    bands.forEach(([from, color], i) => {
      c.fillStyle = color;
      const to = i + 1 < bands.length ? bands[i + 1][0] : 1;
      c.fillRect(0, (1 - to) * 256, 64, (to - from) * 256 + 1);
    });
    for (let i = 0; i < 260; i++) {
      c.fillStyle = `rgba(${rand(i, 31) > 0.5 ? "255,255,255" : "0,0,0"},${0.05 + 0.08 * rand(i, 32)})`;
      c.fillRect(rand(i, 33) * 64, rand(i, 34) * 256, 1 + 3 * rand(i, 35), 1 + 2 * rand(i, 36)); // pebbles and grain
    }
  }
  const strataMap = new T.CanvasTexture(strata);
  strataMap.colorSpace = T.SRGBColorSpace;
  strataMap.wrapS = T.RepeatWrapping;
  strataMap.repeat.set(1 / 1.5, 1 / 5); // the face spans heights −1.6 … 3.4
  strataMap.offset.set(0, 1.6 / 5);
  const cutMat = new T.MeshStandardMaterial({ map: strataMap, roughness: 0.95 });
  const grassMat = new T.MeshStandardMaterial({ color: 0x6f8f55, roughness: 0.95 });
  const land = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false }), [cutMat, grassMat]); // caps: the cut face; sides: the ground
  land.position.z = -D / 2;
  const snow = new T.Mesh(new T.ConeGeometry(0.75, 0.8, 4, 1), new T.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 0.9 }));
  snow.scale.z = 2.6;
  snow.position.set(4.6, 3.15, 0);
  // groundwater: a wet layer seen on the cut face, sloping towards the sea
  const aquifer = new T.Mesh(new T.BoxGeometry(6.6, 0.42, 0.05), new T.MeshStandardMaterial({ color: 0x3f8fd0, transparent: true, opacity: 0.55, roughness: 0.4 }));
  aquifer.position.set(2.1, -0.55, D / 2 + 0.03);
  aquifer.rotation.z = 0.1;
  scene.add(sea, land, snow, aquifer);
  // the river: a band of water down the slope to the shore
  const riverPath: Vec3[] = [[4.1, 2.95, 0.5], [3.4, 2.3, 0.9], [2, 1.23, 0.6], [0.4, 0.53, 1], [SHORE, 0.07, 0.8]];
  for (let i = 0; i < riverPath.length - 1; i++) {
    const [a, b] = [riverPath[i], riverPath[i + 1]];
    const m = new T.Mesh(new T.BoxGeometry(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), 0.03, 0.2), new T.MeshStandardMaterial({ color: 0x4f9fe0, roughness: 0.2 }));
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.02, (a[2] + b[2]) / 2);
    m.lookAt(b[0], b[1] + 0.02, b[2]);
    m.rotateY(Math.PI / 2);
    scene.add(m);
  }
  const sun = new T.Mesh(new T.SphereGeometry(0.7, 32, 24), new T.MeshBasicMaterial({ map: surface.sun() }));
  sun.position.set(-6.2, 6.6, -2);
  const glow = new T.Sprite(new T.SpriteMaterial({ map: surface.halo(), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.position.copy(sun.position);
  glow.scale.set(9, 4.5, 1);
  scene.add(sun, glow);

  // the cloud
  const cloudMat = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 1, sheen: 1, sheenRoughness: 0.85, sheenColor: new T.Color(0xffffff) });
  // lumpy puffs instead of smooth balls
  const lump = mergeVertices(new T.IcosahedronGeometry(1, 3).deleteAttribute("normal").deleteAttribute("uv")); // shared corners: smooth shading
  {
    const p = lump.getAttribute("position") as InstanceType<typeof T.BufferAttribute>;
    const v = new T.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).normalize();
      v.multiplyScalar(1 + 0.12 * Math.sin(v.x * 7.1 + 1.3) * Math.sin(v.y * 6.3 + 0.4) * Math.sin(v.z * 7.7 + 2.1));
      p.setXYZ(i, v.x, v.y, v.z);
    }
    lump.computeVertexNormals();
  }
  const cloud = new T.Group();
  for (let i = 0; i < 11; i++) {
    const m = new T.Mesh(lump, cloudMat);
    m.scale.setScalar(0.55 + 0.3 * rand(i, 2));
    m.rotation.set(rand(i, 6) * 6.28, rand(i, 7) * 6.28, 0);
    m.position.set(-1.3 + i * 0.26 + 0.3 * rand(i, 3), 0.25 * (rand(i, 4) - 0.5) + (i % 3 === 1 ? 0.35 : 0), 0.8 * (rand(i, 5) - 0.5));
    m.scale.y *= 0.75;
    cloud.add(m);
  }
  scene.add(cloud);
  const dot = (r: number, color: number, n: number) => Array.from({ length: n }, () => {
    const m = new T.Mesh(new T.SphereGeometry(r, 8, 6), new T.MeshBasicMaterial({ color }));
    scene.add(m);
    return m;
  });
  const vapour = dot(0.07, 0xdff1ff, 18);
  const rain = dot(0.06, 0x6fb4f0, 22);
  const flow = dot(0.08, 0xbfe2ff, 10);
  const seep = dot(0.07, 0xbfe2ff, 8);
  const white = new T.Color(0xffffff);
  const grey = new T.Color(0x7d8794);
  let cloudX = -4.6;

  return {
    update(step, p, t) {
      // the cloud forms over the sea, drifts to the mountains and rains out there
      const formed = step === 0 ? 0.25 * ease(p) : step === 1 ? lerp(0.25, 1, ease(clamp(p * 1.4))) : step === 2 ? 1 : lerp(1, 0.55, p);
      cloudX = step === 0 ? -4.6 : step === 1 ? lerp(-4.6, 3.6, ease(p)) : 3.6;
      cloud.position.set(cloudX, 5.2, 0);
      cloud.scale.setScalar(Math.max(0.001, formed));
      cloudMat.color.copy(white).lerp(grey, step === 1 ? 0.5 * p : step === 2 ? 0.5 + 0.3 * p : step === 3 ? 0.8 - 0.5 * p : 0);

      vapour.forEach((m, i) => {
        const u = (t * 0.16 + i / vapour.length) % 1;
        m.visible = step <= 1;
        m.position.set(-7.8 + 6 * rand(i, 7) + 0.6 * u, lerp(0.1, 4.8, u), 1.4 * (rand(i, 8) - 0.5));
        m.scale.setScalar(Math.min(1, 6 * u, 4 * (1 - u)) + 0.001); // fades as it turns into cloud droplets
      });
      rain.forEach((m, i) => {
        const u = (t * 0.55 + i / rain.length) % 1;
        const x = cloudX - 1.2 + 2.6 * rand(i, 9);
        m.visible = step === 2 || (step === 3 && p < 0.4);
        m.position.set(x - 0.2 * u, lerp(4.7, groundAt(x) + 0.1, u), 1.6 * (rand(i, 10) - 0.5));
      });
      const path = (pts: Vec3[], u: number): Vec3 => {
        const k = Math.min(pts.length - 1.001, u * (pts.length - 1));
        return mix(pts[Math.floor(k)], pts[Math.floor(k) + 1], k - Math.floor(k));
      };
      flow.forEach((m, i) => {
        m.visible = step === 3 || (step === 2 && p > 0.5);
        const q = path(riverPath, (t * 0.18 + i / flow.length) % 1);
        m.position.set(q[0], q[1] + 0.07, q[2]);
      });
      seep.forEach((m, i) => {
        const u = (t * 0.06 + i / seep.length) % 1;
        m.visible = step === 3;
        m.position.set(lerp(5.2, -1, u), lerp(-0.23, -0.86, u), D / 2 + 0.08);
      });
      glow.scale.set(9 * (1 + 0.03 * Math.sin(t * 2)), 4.5 * (1 + 0.03 * Math.sin(t * 2)), 1);
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.5)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [-3.4, 3.6, 17], look: [-3, 2.6, 0] }, // the sea
        { pos: [-0.6, 4, 19.5], look: [-0.4, 2.7, 0] },
        { pos: [2.6, 3.8, 17], look: [2.8, 2.6, 0] }, // the mountains
        { pos: [0, 3.4, 20.5], look: [0, 2.2, 0] },
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step, p) {
      if (step === 0) return [{ at: [-5.4, 6.6, -2], text: 6, color: "#ffd76a" }, { at: [-4.4, 2.2, 0.8], text: 0, color: "#ffffff" }, { at: [-4.6, -0.5, D / 2], text: 5 }];
      if (step === 1) return [{ at: [cloudX, 6.5, 0], text: 1, color: "#ffffff" }];
      if (step === 2) return [{ at: [cloudX + 2.3, 3.9, 0.8], text: 2, color: "#ffffff" }];
      return [{ at: [1.9, 2.1, 0.9], text: 3, color: "#ffffff" }, ...(p > 0.3 ? [{ at: [2.4, -1.15, D / 2] as Vec3, text: 4, color: "#bfe2ff" }] : []), { at: [-4.6, -0.5, D / 2], text: 5, dim: true }];
    },
    stage: { shadows: true },
  };
};
