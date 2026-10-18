// Solar and lunar eclipses – and why they do not happen every month.
// labels: 0 sunlight, 1 Earth, 2 Moon, 3 Moon's orbit: tilted by 5° (exaggerated here),
//         4 solar eclipse, 5 Moon's shadow, 6 lunar eclipse, 7 Earth's shadow,
//         8 usually the Moon passes above or below the shadow
// Not to scale: distances are greatly shortened and the tilt of the orbit is drawn about three
// times too steep, so it can be seen at all.
import { TIMING } from "@/lib/animations";
import { painter } from "../surface";
import { clamp, ease, lerp, mix, rand, type SceneFactory, type Vec3 } from "../types";

const DIST = 3.6;
const TILT = 0.95; // how far the tilted orbit rises above the line Sun–Earth

export const eclipse: SceneFactory = ({ THREE: T, scene }) => {
  const surface = painter(T);
  const stars = new T.BufferGeometry();
  stars.setAttribute("position", new T.Float32BufferAttribute(Array.from({ length: 2700 }, (_, i) => (rand(i, 19) - 0.5) * 150), 3));
  scene.add(new T.Points(stars, new T.PointsMaterial({ color: 0xffffff, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.55 })));

  const sunlight = new T.DirectionalLight(0xfff4e0, 3.2); // the Sun is far away on the left
  sunlight.position.set(-20, 0, 0);
  const earth = new T.Mesh(new T.SphereGeometry(1, 56, 40), new T.MeshStandardMaterial({ map: surface.earth(), roughness: 0.85 }));
  earth.rotation.z = -0.41;
  const moonMat = new T.MeshStandardMaterial({ map: surface.moon(), roughness: 0.95, emissive: 0xb0401c, emissiveIntensity: 0 });
  const ball = new T.Mesh(new T.SphereGeometry(0.27, 48, 32), moonMat);
  const pathGeometry = new T.BufferGeometry();
  const pathPoints = new T.Float32BufferAttribute(new Float32Array(161 * 3), 3);
  pathGeometry.setAttribute("position", pathPoints);
  const path = new T.Line(pathGeometry, new T.LineBasicMaterial({ color: 0xcfc8bb, transparent: true, opacity: 0.5 }));
  path.frustumCulled = false;
  const line = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-9, 0, 0), new T.Vector3(9, 0, 0)]), new T.LineDashedMaterial({ color: 0xffd24a, dashSize: 0.2, gapSize: 0.16, transparent: true, opacity: 0.55 }));
  line.computeLineDistances();
  const rays = [-2.4, 0, 2.4].map((z) => new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(-6.4, 0, z), 1.3, 0xffd24a, 0.32, 0.22));

  // shadows drawn as what they are: cones of missing light
  const shade = (opacity: number) => new T.MeshBasicMaterial({ color: 0x232c3d, transparent: true, opacity, depthWrite: false });
  const earthShadow = new T.Mesh(new T.CylinderGeometry(1, 0.72, 6.5, 40, 1, true), shade(0.5));
  earthShadow.rotation.z = Math.PI / 2;
  earthShadow.position.x = 3.25;
  const moonShadow = new T.Mesh(new T.CylinderGeometry(0.27, 0.06, DIST - 1, 24, 1, true), shade(0.6));
  moonShadow.rotation.z = Math.PI / 2;
  moonShadow.position.x = -(DIST + 1) / 2;
  const spot = new T.Mesh(new T.CircleGeometry(0.1, 24), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.85, depthWrite: false })); // where the Moon's shadow touches the Earth
  spot.rotation.y = -Math.PI / 2;
  spot.position.x = -1.01;
  // sunlight as faint parallel lines: they stop where Moon or Earth block them – the gap behind is the shadow
  const beamMat = new T.LineBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.32 });
  const beams = Array.from({ length: 17 }, () => {
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(new Float32Array(6), 3));
    const l = new T.Line(g, beamMat);
    l.frustumCulled = false;
    scene.add(l);
    return l;
  });
  scene.add(sunlight, earth, ball, path, line, earthShadow, moonShadow, spot, ...rays);

  let pos: Vec3 = [0, 0, 0];
  let hidden = 0; // how deep the Moon is in the Earth's shadow
  const at = (m: number, node: number): Vec3 => [DIST * Math.cos(m), TILT * Math.sin(m - node), -DIST * Math.sin(m)];
  const wide = { pos: [-0.6, 5.2, 12.4] as Vec3, look: [-0.4, 0, 0] as Vec3 };
  const sunSide = { pos: [-1.5, 1.5, 9.2] as Vec3, look: [-1.25, 0, 0] as Vec3 }; // Moon and Earth both in the picture
  const nightSide = { pos: [1.5, 1.5, 9.2] as Vec3, look: [1.25, 0, 0] as Vec3 };

  return {
    update(step, p, t, s) {
      // where the tilted orbit crosses the line Sun–Earth. Only if that happens at new or full moon is there an eclipse.
      const aligned = step === 0 ? 0 : step === 3 ? 1 - ease(clamp(s / TIMING.camera)) : step === 1 ? ease(clamp(s / TIMING.camera)) : 1;
      const node = lerp(Math.PI / 2, Math.PI, aligned);
      const m = (step === 0 ? lerp(0.45, 1.15, p) : step === 1 ? lerp(0.9, 1, ease(clamp(p * 1.4))) : step === 2 ? lerp(1, 2, ease(clamp(p * 1.25))) : lerp(2, 2.9, p)) * Math.PI;
      pos = at(m, node);
      ball.position.set(...pos);
      ball.rotation.y = m;
      earth.rotation.y = t * 0.9;
      for (let i = 0; i <= 160; i++) pathPoints.setXYZ(i, ...at((i / 160) * 6.2832, node));
      pathPoints.needsUpdate = true;

      // solar eclipse: the Moon exactly between Sun and Earth
      const between = pos[0] < 0 ? clamp(1 - Math.hypot(pos[1], pos[2]) / 0.35) : 0;
      (moonShadow.material as InstanceType<typeof T.MeshBasicMaterial>).opacity = 0.6 * between;
      (spot.material as InstanceType<typeof T.MeshBasicMaterial>).opacity = 0.85 * between;
      // lunar eclipse: the Moon inside the Earth's shadow – it does not vanish but glows dull red,
      // lit by the light the Earth's atmosphere bends into the shadow
      hidden = pos[0] > 0 ? clamp(1.25 - Math.hypot(pos[1], pos[2]) / 0.8) : 0;
      moonMat.emissiveIntensity = 0.55 * hidden;
      moonMat.color.setScalar(1 - 0.82 * hidden);
      (earthShadow.material as InstanceType<typeof T.MeshBasicMaterial>).opacity = step >= 2 ? 0.5 : 0.22;
      rays.forEach((r) => (r.visible = step === 0 || step === 3));
      beams.forEach((l, i) => {
        l.visible = step === 1 || step === 2;
        const y = (step === 1 ? pos[1] : 0) + (i - 8) * (step === 1 ? 0.07 : 0.16);
        const z = step === 1 ? pos[2] : 0;
        let end = 7;
        if (step === 1 && Math.abs(y - pos[1]) < 0.27) end = pos[0] - Math.sqrt(0.27 ** 2 - (y - pos[1]) ** 2);
        else if (Math.abs(y) < 1 && Math.abs(z) < 1) end = -Math.sqrt(1 - y * y);
        const a = l.geometry.attributes.position as InstanceType<typeof T.BufferAttribute>;
        a.setXYZ(0, -8, y, z);
        a.setXYZ(1, end, y, z);
        a.needsUpdate = true;
      });
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.5)));
      const views = [wide, sunSide, nightSide, wide];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step, p) {
      const over = (h: number): Vec3 => [pos[0], pos[1] + h, pos[2]];
      if (step === 0) return [{ at: [-5.7, 0.5, -1.2], text: 0, color: "#ffd24a" }, { at: [0, 1.45, 0], text: 1 }, { at: over(0.55), text: 2 }, { at: [1.2, 1.5, -3.4], text: 3, dim: true }];
      if (step === 1) return p > 0.5 ? [{ at: [-2.3, 1.15, 0], text: 4, color: "#ffd24a" }, { at: [-2.3, -0.6, 0], text: 5 }] : [{ at: over(0.55), text: 2 }];
      if (step === 2) return hidden > 0.5 ? [{ at: over(0.6), text: 6, color: "#ff9a7a" }, { at: [2.1, -1.25, 0], text: 7 }] : [{ at: [2.3, -1.25, 0], text: 7 }, { at: over(0.55), text: 2 }];
      return [{ at: [0.8, 2.1, 0], text: 8, color: "#ffd24a" }, { at: over(0.55), text: 2, dim: true }];
    },
    stage: { space: true },
  };
};
