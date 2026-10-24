"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import { TEXTURE_LOADED } from "./types";
import type { Scene3D } from "./types";
import { useT } from "@/lib/store";

const BACKGROUND = 0x0f0e0d;
const MAX_PIXEL_RATIO = 2; // sharper than that costs frames on phones and is not visible
const LOW_PIXEL_RATIO = 1.25; // devices with little memory or few cores, and any device that turns out to be slow
const SLOW_FRAME_MS = 24; // average cost of a frame above which the picture is rendered at lower resolution

/** Little memory or few processor cores: start with the cheaper picture (no smoothing of edges, lower resolution). */
const weakDevice = () => {
  const n = navigator as Navigator & { deviceMemory?: number };
  return (n.deviceMemory ?? 8) <= 4 || (n.hardwareConcurrency ?? 8) <= 4;
};
const ENVIRONMENT = "/env/studio_small_09_1k.hdr";

/**
 * A fine, irregular surface (as a normal map and a roughness map) for materials a scene left plain, so
 * metal, plastic and paint do not look like perfectly smooth computer shapes. Only for meshes with texture
 * coordinates; scenes that bring their own textures or models keep theirs.
 */
function surfaceDetail(T: typeof THREE) {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) return null;
  const height = new Float32Array(size * size);
  for (let i = 0; i < height.length; i++) height[i] = Math.random();
  // blur a little, so it reads as a fine grain rather than as noise on single pixels
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  const smooth = height.map((_, i) => {
    const x = i % size, y = Math.floor(i / size);
    return (at(x, y) * 4 + at(x + 1, y) + at(x - 1, y) + at(x, y + 1) + at(x, y - 1)) / 8;
  });
  const normal = g.createImageData(size, size);
  const rough = g.createImageData(size, size);
  const h = (x: number, y: number) => smooth[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      normal.data[i] = 128 + (h(x - 1, y) - h(x + 1, y)) * 160;
      normal.data[i + 1] = 128 + (h(x, y - 1) - h(x, y + 1)) * 160;
      normal.data[i + 2] = 255;
      normal.data[i + 3] = 255;
      const r = 215 + h(x, y) * 40;
      rough.data[i] = rough.data[i + 1] = rough.data[i + 2] = r;
      rough.data[i + 3] = 255;
    }
  const tex = (img: ImageData) => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    cv.getContext("2d")!.putImageData(img, 0, 0);
    const t = new T.CanvasTexture(cv);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(3, 3);
    return t;
  };
  return { normalMap: tex(normal), roughnessMap: tex(rough) };
}
const MAX_YAW = 1.1; // how far the learner can turn the scene with a horizontal drag (radians)
const ZOOM = { min: 0.55, max: 1.6 }; // factor on the camera distance: smaller = closer

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
export default function Stage3D({ scene, step, p, t, into, labels, title, compact, mounted = true, onUnavailable }: { scene: string; step: number; p: number; t: number; into: number; labels: string[]; title: string; compact?: boolean; mounted?: boolean; onUnavailable: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLParagraphElement>(null);
  const rt = useRef<Runtime | null>(null);
  const yaw = useRef(0);
  const zoom = useRef(1);
  const [zoomShown, setZoomShown] = useState(1); // for the buttons (disabled at the limits) and tests
  const tr = useT();
  const frame = useRef({ step, p, t, into });
  const [ready, setReady] = useState(false);
  const cost = useRef({ frames: 0, ms: 0, lowered: false });
  const widths = useRef<number[]>([]); // label widths, measured only when a text changes
  const point = useRef<THREE.Vector3 | null>(null);
  frame.current = { step, p, t, into };

  const draw = () => {
    const r = rt.current;
    const el = layer.current;
    if (!r || !el) return;
    const { step, p, t, into } = frame.current;
    const began = performance.now();
    r.api.update(step, p, t, into);
    const view = r.api.camera(step, p, t, into);
    // the learner's drag turns the camera around the point it looks at
    const dx = view.pos[0] - view.look[0];
    const dz = view.pos[2] - view.look[2];
    const c = Math.cos(yaw.current);
    const s = Math.sin(yaw.current);
    const z = zoom.current;
    r.camera.position.set(view.look[0] + (dx * c - dz * s) * z, view.look[1] + (view.pos[1] - view.look[1]) * z, view.look[2] + (dx * s + dz * c) * z);
    r.camera.lookAt(view.look[0], view.look[1], view.look[2]);
    r.renderer.render(r.scene, r.camera);
    // a device that needs too long per frame gets a lower resolution – once, after a short measurement
    const m = cost.current;
    if (!m.lowered && ++m.frames > 10) {
      m.ms += performance.now() - began;
      if (m.frames === 50) {
        m.lowered = true;
        if (m.ms / 40 > SLOW_FRAME_MS && r.renderer.getPixelRatio() > 1) {
          r.renderer.setPixelRatio(1);
          r.renderer.setSize(el.clientWidth, el.clientHeight, false);
        }
      }
    }

    // labels: project their 3D anchor onto the canvas
    const list = r.api.labels?.(step, p, t, into) ?? [];
    const w = el.clientWidth;
    const h = el.clientHeight;
    const v = (point.current ??= new r.T.Vector3());
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
      if (d.textContent !== labels[l.text]) {
        d.textContent = labels[l.text] ?? "";
        widths.current[i] = 0;
      }
      const half = (widths.current[i] ||= d.offsetWidth) / 2 + 4; // keep the whole label inside the picture
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
        if (cancelled || !el || !cv || !mounted) return;
        if (!factory) throw new Error("unknown 3D scene " + scene);
        const weak = weakDevice();
        const renderer = new T.WebGLRenderer({ canvas: cv, antialias: !weak, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, weak ? LOW_PIXEL_RATIO : MAX_PIXEL_RATIO));
        cost.current = { frames: 0, ms: 0, lowered: false };
        widths.current = [];
        renderer.localClippingEnabled = true; // scenes may cut a model open (material.clippingPlanes)
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.outputColorSpace = T.SRGBColorSpace;
        const world = new T.Scene();
        // backdrop: a soft pool of light behind the object instead of a flat colour
        const backdrop = document.createElement("canvas");
        backdrop.width = backdrop.height = 256;
        const g2 = backdrop.getContext("2d");
        let backdropTexture: THREE.CanvasTexture | null = null;
        if (g2) {
          const grad = g2.createRadialGradient(128, 118, 10, 128, 128, 190);
          grad.addColorStop(0, "#26231f");
          grad.addColorStop(0.55, "#161412");
          grad.addColorStop(1, "#0b0a09");
          g2.fillStyle = grad;
          g2.fillRect(0, 0, 256, 256);
          backdropTexture = new T.CanvasTexture(backdrop);
          backdropTexture.colorSpace = T.SRGBColorSpace;
          world.background = backdropTexture;
        } else world.background = new T.Color(BACKGROUND);
        // light from a photographed studio (public/env, Poly Haven, CC0): gives metal, glass and glossy surfaces
        // a real surrounding to reflect. If it cannot be loaded, a generated studio takes its place.
        const pmrem = new T.PMREMGenerator(renderer);
        let env: THREE.Texture;
        try {
          const { RGBELoader } = await import("three/examples/jsm/loaders/RGBELoader.js");
          const hdr = await new RGBELoader().loadAsync(ENVIRONMENT);
          env = pmrem.fromEquirectangular(hdr).texture;
          hdr.dispose();
        } catch {
          env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        }
        world.environment = env;
        world.environmentIntensity = 0.7;
        const key = new T.DirectionalLight(0xffffff, 1.6);
        key.position.set(4, 7, 6);
        // a cool light from behind lifts the edges off the dark background
        const rim = new T.DirectionalLight(0xbcd2ff, 0.7);
        rim.position.set(-5, 3, -6);
        world.add(key, rim, new T.HemisphereLight(0xdfe8ff, 0x2a241c, 0.5));
        const camera = new T.PerspectiveCamera(36, 1, 0.1, 200);
        const load = async (file: string) => {
          const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
          return (await new GLTFLoader().loadAsync(`/models/${file}`)).scene;
        };
        const api = await factory({ THREE: T, scene: world, load });
        if (cancelled) {
          renderer.dispose();
          renderer.forceContextLoss();
          return;
        }
        if (api.stage?.space) {
          world.background = new T.Color(0x020308);
          world.environmentIntensity = 0;
          world.remove(key, rim);
          world.traverse((o) => (o as THREE.HemisphereLight).isHemisphereLight && ((o as THREE.HemisphereLight).intensity = 0.22)); // a little light, so the night side is dim rather than invisible
        }
        // fine surface grain for plain materials – not in space (planets and stars bring their own look), not on weak devices
        const detail = api.stage?.space || weak ? null : surfaceDetail(T);
        if (detail)
          world.traverse((o) => {
            const m = o as THREE.Mesh;
            const mat = m.material as THREE.MeshStandardMaterial | undefined;
            if (!m.isMesh || !mat || Array.isArray(mat) || !mat.isMeshStandardMaterial || mat.transparent || mat.map || mat.normalMap || mat.roughnessMap || !m.geometry.getAttribute("uv")) return;
            mat.normalMap = detail.normalMap;
            mat.normalScale.set(0.18, 0.18);
            mat.roughnessMap = detail.roughnessMap;
            mat.needsUpdate = true;
          });
        // soft shadows where the scene asks for them – not on weak devices
        if (api.stage?.shadows && !weak) {
          const box = new T.Box3().setFromObject(world);
          const centre = box.getCenter(new T.Vector3());
          const reach = Math.min(14, box.getSize(new T.Vector3()).length() / 2);
          world.traverse((o) => {
            const m = o as THREE.Mesh;
            const mat = m.material as THREE.Material | undefined;
            if (!m.isMesh || !mat || Array.isArray(mat)) return;
            // glass lets light through: it receives no shadow and throws none
            const solid = !mat.transparent && (mat as THREE.MeshStandardMaterial).isMeshStandardMaterial && !((mat as THREE.MeshPhysicalMaterial).transmission > 0);
            m.castShadow = solid;
            m.receiveShadow = solid;
          });
          if (api.stage.floor != null) {
            const floor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.ShadowMaterial({ opacity: 0.42 }));
            floor.rotation.x = -Math.PI / 2;
            floor.position.set(centre.x, api.stage.floor, centre.z);
            floor.receiveShadow = true;
            world.add(floor);
          }
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = T.PCFSoftShadowMap;
          key.castShadow = true;
          key.position.copy(centre).add(new T.Vector3(4, 7, 6).normalize().multiplyScalar(reach * 2.5));
          key.target.position.copy(centre);
          world.add(key.target);
          const cam = key.shadow.camera;
          cam.left = cam.bottom = -reach * 1.15;
          cam.right = cam.top = reach * 1.15;
          cam.near = 0.5;
          cam.far = reach * 5.5;
          cam.updateProjectionMatrix();
          key.shadow.mapSize.set(2048, 2048);
          key.shadow.bias = -0.0005;
          key.shadow.normalBias = 0.03;
          key.shadow.radius = 4;
        }
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
          if (rt.current) onUnavailable(); // not when we gave the context back ourselves
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
            (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
              (x as THREE.MeshStandardMaterial).map?.dispose();
              x.dispose();
            });
          });
          env.dispose();
          detail?.normalMap.dispose();
          detail?.roughnessMap.dispose();
          backdropTexture?.dispose();
          key.shadow.map?.dispose();
          pmrem.dispose();
          renderer.dispose();
          renderer.forceContextLoss(); // browsers allow only a handful of WebGL contexts per page – give this one back now
          rt.current = null;
          setReady(false);
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
  }, [scene, mounted]);

  // one frame per change
  useEffect(() => {
    if (ready) draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, step, p, t, labels]);
  // a photograph that arrives after the scene was built (Earth, Moon) shows up even while paused
  useEffect(() => {
    const again = () => ready && draw();
    window.addEventListener(TEXTURE_LOADED, again);
    return () => window.removeEventListener(TEXTURE_LOADED, again);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  useEffect(() => {
    yaw.current = 0; // every step starts from its intended view
  }, [step]);

  // horizontal drag turns the scene; vertical movement stays with the page (feed scrolling).
  // Two fingers pinch to zoom; on a computer: the buttons, or pinching on the trackpad (ctrl + wheel).
  const setZoom = (value: number) => {
    zoom.current = Math.max(ZOOM.min, Math.min(ZOOM.max, value));
    setZoomShown(Math.round(zoom.current * 100) / 100);
    draw();
  };
  const drag = useRef<{ x: number; yaw: number } | null>(null);
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const spread = () => {
    const [a, b] = [...touches.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const onDown = (e: React.PointerEvent) => {
    touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.current.size === 2) {
      drag.current = null;
      pinch.current = { distance: spread(), zoom: zoom.current };
    } else drag.current = { x: e.clientX, yaw: yaw.current };
  };
  const onMove = (e: React.PointerEvent) => {
    if (touches.current.has(e.pointerId)) touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && touches.current.size === 2) return setZoom((pinch.current.zoom * pinch.current.distance) / Math.max(1, spread()));
    if (!drag.current) return;
    yaw.current = Math.max(-MAX_YAW, Math.min(MAX_YAW, drag.current.yaw - (e.clientX - drag.current.x) * 0.008));
    draw();
  };
  const onUp = (e: React.PointerEvent) => {
    touches.current.delete(e.pointerId);
    if (touches.current.size < 2) pinch.current = null;
    drag.current = null;
  };
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return; // a plain wheel keeps scrolling the page
      e.preventDefault();
      setZoom(zoom.current * Math.exp(e.deltaY * 0.01));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={host} data-testid="stage-3d" data-ready={ready} className="relative w-full select-none" style={{ aspectRatio: "9 / 10", maxHeight: compact ? "38dvh" : undefined, touchAction: "pan-y" }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onPointerCancel={onUp}>
      <canvas ref={canvas} role="img" aria-label={title} className="absolute inset-0 block h-full w-full" />
      <div ref={layer} className="pointer-events-none absolute inset-0 overflow-hidden" />
      <p ref={heading} className="pointer-events-none absolute inset-x-0 top-2.5 text-center font-display text-lg font-semibold drop-shadow" />
      {ready && (
        <div className="absolute right-2 top-2 flex flex-col gap-1.5" data-zoom={zoomShown}>
          <button onClick={() => setZoom(zoom.current / 1.25)} disabled={zoomShown <= ZOOM.min} aria-label={tr("Näher heran")} className="press flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-lg font-bold text-white backdrop-blur disabled:opacity-30">+</button>
          <button onClick={() => setZoom(zoom.current * 1.25)} disabled={zoomShown >= ZOOM.max} aria-label={tr("Weiter weg")} className="press flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-lg font-bold text-white backdrop-blur disabled:opacity-30">−</button>
        </div>
      )}
      {!ready && <div role="status" aria-label="3D" className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-[3px] border-white/25 border-t-white" />}
    </div>
  );
}
