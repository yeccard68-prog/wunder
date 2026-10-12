"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import type { Scene3D } from "./types";

const BACKGROUND = 0x0f0e0d;
const MAX_PIXEL_RATIO = 2; // sharper than that costs frames on phones and is not visible
const MAX_YAW = 1.1; // how far the learner can turn the scene with a horizontal drag (radians)

interface Runtime {
  T: typeof THREE;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  api: Scene3D;
}

/**
 * The 3D stage: loads Three.js only when a 3D animation is actually shown, builds the requested scene
 * and draws exactly one frame per change of (step, p, t) – there is no render loop of its own, so a
 * paused or off-screen animation costs nothing. Labels are HTML on top of the canvas (sharp at any size).
 * If WebGL is not available or the context is lost, onUnavailable() lets the player fall back.
 */
export default function Stage3D({ scene, step, p, t, labels, title, compact, onUnavailable }: { scene: string; step: number; p: number; t: number; labels: string[]; title: string; compact?: boolean; onUnavailable: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLParagraphElement>(null);
  const rt = useRef<Runtime | null>(null);
  const yaw = useRef(0);
  const frame = useRef({ step, p, t });
  const [ready, setReady] = useState(false);
  frame.current = { step, p, t };

  const draw = () => {
    const r = rt.current;
    const el = layer.current;
    if (!r || !el) return;
    const { step, p, t } = frame.current;
    r.api.update(step, p, t);
    const view = r.api.camera(step, p, t);
    // the learner's drag turns the camera around the point it looks at
    const dx = view.pos[0] - view.look[0];
    const dz = view.pos[2] - view.look[2];
    const c = Math.cos(yaw.current);
    const s = Math.sin(yaw.current);
    r.camera.position.set(view.look[0] + dx * c - dz * s, view.pos[1], view.look[2] + dx * s + dz * c);
    r.camera.lookAt(view.look[0], view.look[1], view.look[2]);
    r.renderer.render(r.scene, r.camera);

    // labels: project their 3D anchor onto the canvas
    const list = r.api.labels?.(step, p, t) ?? [];
    const w = el.clientWidth;
    const h = el.clientHeight;
    const v = new r.T.Vector3();
    while (el.children.length < list.length) {
      const d = document.createElement("span");
      d.className = "absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight";
      el.appendChild(d);
    }
    for (let i = 0; i < el.children.length; i++) {
      const d = el.children[i] as HTMLElement;
      const l = list[i];
      if (!l) {
        d.style.display = "none";
        continue;
      }
      v.set(l.at[0], l.at[1], l.at[2]).project(r.camera);
      const visible = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      d.style.display = visible ? "" : "none";
      d.style.top = `${((1 - v.y) / 2) * h}px`;
      d.style.color = l.color ?? "#f4f1ea";
      d.style.background = "rgba(15,14,13,0.62)";
      d.style.opacity = l.dim ? "0.55" : "1";
      if (d.textContent !== labels[l.text]) d.textContent = labels[l.text] ?? "";
      const half = d.offsetWidth / 2 + 4; // keep the whole label inside the picture
      d.style.left = `${Math.min(w - half, Math.max(half, ((v.x + 1) / 2) * w))}px`;
    }
    const head = r.api.heading?.(step);
    if (heading.current) heading.current.textContent = head == null ? "" : (labels[head] ?? "");
  };

  // build once per scene
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    (async () => {
      try {
        const [T, { RoomEnvironment }, { SCENES_3D }] = await Promise.all([import("three"), import("three/examples/jsm/environments/RoomEnvironment.js"), import("./scenes")]);
        const el = host.current;
        const cv = canvas.current;
        const factory = SCENES_3D[scene];
        if (cancelled || !el || !cv) return;
        if (!factory) throw new Error("unknown 3D scene " + scene);
        const renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.outputColorSpace = T.SRGBColorSpace;
        const world = new T.Scene();
        world.background = new T.Color(BACKGROUND);
        // soft studio light from a generated environment: gives metal and glossy surfaces something to reflect
        const pmrem = new T.PMREMGenerator(renderer);
        const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        world.environment = env;
        world.environmentIntensity = 0.55;
        const key = new T.DirectionalLight(0xffffff, 1.6);
        key.position.set(4, 7, 6);
        world.add(key, new T.HemisphereLight(0xdfe8ff, 0x2a241c, 0.5));
        const camera = new T.PerspectiveCamera(36, 1, 0.1, 200);
        const api = factory({ THREE: T, scene: world });
        const resize = () => {
          const w = el.clientWidth;
          const h = el.clientHeight;
          if (!w || !h) return;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          draw();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(el);
        const lost = (e: Event) => {
          e.preventDefault();
          onUnavailable();
        };
        cv.addEventListener("webglcontextlost", lost);
        rt.current = { T, renderer, scene: world, camera, api };
        resize();
        setReady(true);
        cleanup = () => {
          observer.disconnect();
          cv.removeEventListener("webglcontextlost", lost);
          world.traverse((o) => {
            const m = o as THREE.Mesh;
            m.geometry?.dispose();
            const mat = m.material as THREE.Material | THREE.Material[] | undefined;
            (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
          });
          env.dispose();
          pmrem.dispose();
          renderer.dispose();
          rt.current = null;
        };
        if (cancelled) cleanup();
      } catch {
        if (!cancelled) onUnavailable(); // no WebGL, blocked GPU, failed download …
      }
    })();
    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // one frame per change
  useEffect(() => {
    if (ready) draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, step, p, t, labels]);
  useEffect(() => {
    yaw.current = 0; // every step starts from its intended view
  }, [step]);

  // horizontal drag turns the scene; vertical movement stays with the page (feed scrolling)
  const drag = useRef<{ x: number; yaw: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, yaw: yaw.current };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    yaw.current = Math.max(-MAX_YAW, Math.min(MAX_YAW, drag.current.yaw - (e.clientX - drag.current.x) * 0.008));
    draw();
  };
  const onUp = () => {
    drag.current = null;
  };

  return (
    <div ref={host} data-testid="stage-3d" data-ready={ready} className="relative w-full select-none" style={{ aspectRatio: "9 / 10", maxHeight: compact ? "38dvh" : undefined, touchAction: "pan-y" }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onPointerCancel={onUp}>
      <canvas ref={canvas} role="img" aria-label={title} className="absolute inset-0 block h-full w-full" />
      <div ref={layer} className="pointer-events-none absolute inset-0 overflow-hidden" />
      <p ref={heading} className="pointer-events-none absolute inset-x-0 top-2.5 text-center font-display text-lg font-semibold drop-shadow" />
      {!ready && <div role="status" aria-label="3D" className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-[3px] border-white/25 border-t-white" />}
    </div>
  );
}
