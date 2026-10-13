// Why there are seasons: the Earth's axis is tilted and keeps pointing the same way all year.
// labels: 0 sun, 1 Earth's axis (tilted 23.4°), 2 equator, 3 June: summer in the north,
//         4 December: winter in the north, 5 March, 6 September
// Sizes and distances are far from to scale (the real Earth would be an invisible dot); the tilt is true.
import { TIMING } from "@/lib/animations";
import { painter } from "../surface";
import { clamp, ease, lerp, mix, rand, type SceneFactory, type Vec3 } from "../types";

const ORBIT = 5;
const TILT = (23.4 * Math.PI) / 180;
/** Position on the orbit; a = π is June, 2π December (counter-clockwise seen from the north). */
const at = (a: number): Vec3 => [ORBIT * Math.cos(a), 0, -ORBIT * Math.sin(a)];

export const seasons: SceneFactory = ({ THREE: T, scene }) => {
  const { earth: earthTexture, sun: sunTexture, halo } = painter(T);
  const stars = new T.BufferGeometry();
  stars.setAttribute("position", new T.Float32BufferAttribute(Array.from({ length: 2700 }, (_, i) => (rand(i, 9) - 0.5) * 150), 3));
  scene.add(new T.Points(stars, new T.PointsMaterial({ color: 0xffffff, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.55 })));

  const sun = new T.Mesh(new T.SphereGeometry(0.75, 48, 32), new T.MeshBasicMaterial({ map: sunTexture() }));
  const glow = new T.Sprite(new T.SpriteMaterial({ map: halo(), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.scale.set(14, 7, 1);
  const light = new T.PointLight(0xfff1d6, 3.4, 0, 0);
  const path = new T.LineLoop(new T.BufferGeometry().setFromPoints(Array.from({ length: 160 }, (_, i) => new T.Vector3(...at((i / 160) * 6.2832)))), new T.LineBasicMaterial({ color: 0xcfc8bb, transparent: true, opacity: 0.6 }));

  // the Earth: a group that keeps its tilt (north pole leaning towards +x), inside it the spinning globe
  const earth = new T.Group();
  earth.rotation.z = -TILT;
  const globe = new T.Mesh(new T.SphereGeometry(0.55, 48, 32), new T.MeshStandardMaterial({ map: earthTexture(), roughness: 0.85 }));
  const axis = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 1.9, 8), new T.MeshBasicMaterial({ color: 0xfff2a8 }));
  const equator = new T.Mesh(new T.TorusGeometry(0.556, 0.008, 6, 64), new T.MeshBasicMaterial({ color: 0xff8f7a }));
  equator.rotation.x = Math.PI / 2;
  earth.add(globe, axis, equator);
  const ray = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(), 1, 0xffd24a, 0.3, 0.2);
  scene.add(sun, glow, light, path, earth, ray);

  const dir = new T.Vector3();
  let pos: Vec3 = at(Math.PI);

  return {
    update(step, p, t) {
      // March → June · June · June → December · on to June again
      const a = step === 0 ? lerp(0.55, 1, ease(p)) * Math.PI : step === 1 ? Math.PI : step === 2 ? lerp(1, 2, ease(clamp(p * 1.15))) * Math.PI : lerp(2, 3, p) * Math.PI;
      pos = at(a);
      earth.position.set(...pos);
      globe.rotation.y = t * 1.8; // a day – many of them pass while the Earth moves on (not to scale)
      sun.rotation.y = t * 0.1;
      // sunlight reaching the Earth
      ray.visible = step === 1 || step === 2;
      dir.set(pos[0], 0, pos[2]).normalize();
      ray.position.set(dir.x * 1.1, 0, dir.z * 1.1);
      ray.setDirection(dir);
      ray.setLength(ORBIT - 1.85, 0.3, 0.2);
    },
    camera(step, _p, _t, s) {
      const near = (q: Vec3, side: number): { pos: Vec3; look: Vec3 } => ({ pos: [q[0] + side * 0.8, 1.3, q[2] + 4.6], look: [q[0] + side * 0.9, 0, q[2]] });
      const wide = { pos: [0, 9, 11.5] as Vec3, look: [0, 0, 0.6] as Vec3 };
      const k = ease(clamp(s / TIMING.camera));
      if (step === 0) return near(pos, 0);
      if (step === 1) return { pos: mix(near(pos, 0).pos, near(pos, 1).pos, k), look: mix(near(pos, 0).look, near(pos, 1).look, k) }; // the sun comes into view on the right
      if (step === 2) return { pos: mix(near(at(Math.PI), 1).pos, wide.pos, k), look: mix(near(at(Math.PI), 1).look, wide.look, k) };
      return wide;
    },
    labels(step, p) {
      const above = (q: Vec3, h: number): Vec3 => [q[0], h, q[2]];
      if (step === 0) return [{ at: [pos[0] + 0.55, 1.15, pos[2]], text: 1, color: "#fff2a8" }, { at: [pos[0] - 0.9, -0.25, pos[2] + 0.4], text: 2, color: "#ff8f7a" }];
      if (step === 1) return [{ at: above(pos, 1.3), text: 3, color: "#ffd24a" }, { at: [0, 1.3, 0], text: 0, color: "#ffd76a", dim: true }];
      const june = { at: above(at(Math.PI), 1.2), text: 3, dim: step === 2 };
      const december = { at: above(at(0), 1.2), text: 4, color: "#9ccbff" };
      if (step === 2) return p > 0.75 ? [june, december] : [june];
      return [june, december, { at: above(at(Math.PI / 2), 1.1), text: 5, dim: true }, { at: above(at(1.5 * Math.PI), 1.1), text: 6, dim: true }];
    },
    stage: { space: true },
  };
};
