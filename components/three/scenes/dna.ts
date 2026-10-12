// DNA: the double helix, base pairing and how the molecule copies itself.
// labels: 0 backbone, 1 base pair, 2 A, 3 T, 4 G, 5 C, 6 helicase opens the helix, 7 new strand, 8 old strand
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, type SceneFactory, type Vec3, type View3D } from "../types";

const N = 20; // base pairs shown
const RISE = 0.33; // height per base pair
const TWIST = 0.628; // 36° per pair → ten pairs per turn, as in real B-DNA
const RAD = 1;
const SPLIT = 1.55; // how far the two halves move apart when the helix is opened
const SEQUENCE = "ATGCCGTAAGCTTGCATCGG";
const PARTNER: Record<string, string> = { A: "T", T: "A", G: "C", C: "G" };
const COLOR: Record<string, number> = { A: 0x4fbf7a, T: 0xe8605a, G: 0x4f8fe8, C: 0xf0c64a };
const LABEL: Record<string, number> = { A: 2, T: 3, G: 4, C: 5 };

export const dna: SceneFactory = ({ THREE: T, scene }) => {
  const up = new T.Vector3(0, 1, 0);
  const a = new T.Vector3();
  const b = new T.Vector3();
  /** Stretches a unit cylinder (axis y, height 1) from one point to another. */
  const between = (m: InstanceType<typeof T.Mesh>, from: Vec3, to: Vec3) => {
    a.set(...from);
    b.set(...to);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    b.sub(a);
    m.scale.y = Math.max(0.0001, b.length());
    m.quaternion.setFromUnitVectors(up, b.normalize());
  };
  const sphere = new T.SphereGeometry(0.17, 18, 14);
  const stick = new T.CylinderGeometry(0.085, 0.085, 1, 12);
  const link = new T.CylinderGeometry(0.06, 0.06, 1, 10);
  const oldBackbone = new T.MeshStandardMaterial({ color: 0xe6e0d2, roughness: 0.4, metalness: 0.1 });
  const newBackbone = new T.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.4, metalness: 0.1 });
  const baseMat = Object.fromEntries(Object.entries(COLOR).map(([k, c]) => [k, new T.MeshStandardMaterial({ color: c, roughness: 0.45 })]));
  const mesh = (g: InstanceType<typeof T.SphereGeometry> | InstanceType<typeof T.CylinderGeometry>, m: InstanceType<typeof T.MeshStandardMaterial>) => {
    const x = new T.Mesh(g, m);
    scene.add(x);
    return x;
  };

  // per base pair and side: the old nucleotide, and the new one that is added during copying
  const pairs = Array.from({ length: N }, (_, i) =>
    [0, 1].map((s) => {
      const letter = s === 0 ? SEQUENCE[i] : PARTNER[SEQUENCE[i]];
      return {
        letter,
        ball: mesh(sphere, oldBackbone), base: mesh(stick, baseMat[letter]), chain: i ? mesh(link, oldBackbone) : null,
        newBall: mesh(sphere, newBackbone), newBase: mesh(stick, baseMat[PARTNER[letter]]), newChain: i ? mesh(link, newBackbone) : null,
      };
    }),
  );

  const y = (i: number) => (i - (N - 1) / 2) * RISE;
  let opening: number[] = Array(N).fill(0);
  let spin = 0;
  /** Centre of the (half) helix strand s belongs to, and the position of its backbone or of its partner's. */
  const centre = (i: number, s: number): Vec3 => [(s ? 1 : -1) * SPLIT * opening[i], y(i), 0];
  const at = (i: number, s: number, partner = false, r = RAD): Vec3 => {
    const ang = i * TWIST + spin + (s !== (partner ? 1 : 0) ? Math.PI : 0);
    const c = centre(i, s);
    return [c[0] + r * Math.cos(ang), c[1], r * Math.sin(ang)];
  };
  let fork = N;

  return {
    update(step, p, t) {
      spin = t * 0.45;
      fork = step < 2 ? N + 4 : step === 2 ? lerp(N + 1, N * 0.42, ease(p)) : N * 0.42;
      opening = opening.map((_, i) => ease(clamp((i - fork) / 4)));
      for (let i = 0; i < N; i++)
        for (let s = 0; s < 2; s++) {
          const n = pairs[i][s];
          const here = at(i, s);
          n.ball.position.set(...here);
          between(n.base, at(i, s, false, RAD - 0.12), mix(here, centre(i, s), 0.97));
          if (n.chain) between(n.chain, at(i - 1, s), here);
          // new nucleotides are added from the open end towards the fork
          const grow = step === 3 && opening[i] > 0.5 ? clamp(p * (N - fork + 2) * 1.15 - (N - 1 - i)) : 0;
          const there = at(i, s, true);
          n.newBall.visible = n.newBase.visible = grow > 0;
          n.newBall.position.set(...there);
          n.newBall.scale.setScalar(grow);
          between(n.newBase, mix(there, centre(i, s), 0.12), mix(there, centre(i, s), 0.12 + 0.85 * grow));
          if (n.newChain) {
            n.newChain.visible = grow >= 1 && pairs[i - 1][s].newBall.visible;
            between(n.newChain, at(i - 1, s, true), there);
          }
        }
    },
    camera(step, _p, _t, s) {
      const views: View3D[] = [
        { pos: [0, 0.6, 14.5], look: [0, 0, 0] },
        { pos: [0, 0.2, 5.4], look: [0, 0, 0] },
        { pos: [0, 2.2, 15.5], look: [0, 0.5, 0] },
        { pos: [0, 2.6, 15], look: [0, 0.9, 0] },
      ];
      const from = views[Math.max(0, step - 1)];
      const k = ease(clamp(s / TIMING.camera));
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step, p) {
      if (step === 0) return [{ at: at(3, 0, false, RAD + 0.5), text: 0 }, { at: [0, y(14), 0], text: 1 }];
      if (step === 1)
        return [8, 9].flatMap((i) => [0, 1].map((s) => ({ at: at(i, s, false, RAD * 0.5), text: LABEL[pairs[i][s].letter], color: "#ffffff" })));
      if (step === 2) return [{ at: [0, y(Math.min(N - 1, Math.round(fork))) - 0.2, 0] as Vec3, text: 6, color: "#ffd24a" }];
      return p > 0.25 ? [{ at: at(N - 2, 0, true, RAD + 0.7), text: 7, color: "#9fd8ff" }, { at: at(N - 4, 1, false, RAD + 0.7), text: 8 }] : [];
    },
  };
};
