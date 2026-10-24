// Contract between the 3D stage (Stage3D.tsx) and a 3D scene (scenes/*.ts).
// A scene builds its objects once and is then a pure function of the learning step: the stage calls
// update() with the current step, the progress p (0–1) inside that step and the running time t (seconds),
// asks where the camera should be, and draws the labels the scene wants to show at that moment.
import type * as THREE from "three";

export type Vec3 = [number, number, number];

export interface Label3D {
  at: Vec3; // point in the scene the label belongs to
  text: number; // index into the animation's `labels` (texts live in content/animations.json)
  color?: string;
  dim?: boolean; // present but not the subject of this step
}

export interface View3D {
  pos: Vec3;
  look: Vec3;
}

export interface Scene3D {
  /** s = seconds since the current step began – use it for moves that should take a fixed time (camera, fade-in). */
  update(step: number, p: number, t: number, s: number): void;
  camera(step: number, p: number, t: number, s: number): View3D;
  labels?(step: number, p: number, t: number, s: number): Label3D[];
  /** Index of the label shown as a heading above the scene, if any. */
  heading?(step: number): number | null;
  /**
   * How the stage presents the scene. shadows: objects throw soft shadows on each other (solid
   * things in a workshop – not planets in space). floor: height of an invisible ground that only
   * shows the shadow falling on it, so the object does not float.
   * space: outer space – black background and no light from the surroundings, so the side of a
   * planet facing away from the sun is dark.
   */
  stage?: { shadows?: boolean; floor?: number; space?: boolean };
}

export interface SceneContext {
  THREE: typeof THREE;
  scene: THREE.Scene;
  /** Loads a model from public/models (glTF binary) – for scenes built on real 3D models instead of shapes made in code. */
  load(file: string): Promise<THREE.Group>;
}

/** A scene that loads a model is built asynchronously; the stage shows its spinner until it is ready. */
export type SceneFactory = (ctx: SceneContext) => Scene3D | Promise<Scene3D>;

/** Sent on window when a texture changed after the scene was built (Stage3D draws again). */
export const TEXTURE_LOADED = "wunder:texture-loaded";

// small helpers every scene needs
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const ease = (p: number) => p * p * (3 - 2 * p);
export const mix = (a: Vec3, b: Vec3, p: number): Vec3 => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
/** Deterministic pseudo-random number in [0, 1) – scenes must look the same on every run. */
export const rand = (i: number, k = 1) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
