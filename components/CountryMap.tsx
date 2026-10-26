"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/store";

export type World = { width: number; height: number; paths: Record<string, string>; dots: Record<string, [number, number]> };
let cache: Promise<World | null> | null = null;
/** The map file (public/map/world.json, ~100 KB) is loaded once, the first time a card needs it. */
export const loadWorld = () => (cache ??= fetch("/map/world.json").then((r) => (r.ok ? r.json() : null)).catch(() => null));

/** The box around a country's shape (or dot), widened to show its surroundings – at least 1/min of the map's width. */
export function around(world: World, isos: string[], min = 4): string {
  const xs: number[] = [], ys: number[] = [];
  for (const iso of isos) {
    for (const m of (world.paths[iso] ?? "").matchAll(/(-?[\d.]+),(-?[\d.]+)/g)) { xs.push(+m[1]); ys.push(+m[2]); }
    if (world.dots[iso]) { xs.push(world.dots[iso][0]); ys.push(world.dots[iso][1]); }
  }
  if (!xs.length) return `0 0 ${world.width} ${world.height}`;
  const ratio = world.width / world.height;
  let w = Math.max(Math.max(...xs) - Math.min(...xs), world.width / min) * 1.6, h = w / ratio;
  const hy = (Math.max(...ys) - Math.min(...ys)) * 1.6;
  if (hy > h) { h = hy; w = h * ratio; }
  w = Math.min(w, world.width); h = Math.min(h, world.height);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const x0 = Math.min(Math.max(0, cx - w / 2), world.width - w), y0 = Math.min(Math.max(0, cy - h / 2), world.height - h);
  return `${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
}

/**
 * A small world map with the given countries highlighted (ISO codes) – shown on cards about a country once they are
 * answered, so it never gives the answer away. Shapes: Natural Earth (public domain); tiny states are a dot.
 * zoom: the map quiz – the view is cut to the country and its surroundings, and the label names no country.
 */
export default function CountryMap({ countries, zoom = false }: { countries: string[]; zoom?: boolean }) {
  const t = useT();
  const [world, setWorld] = useState<World | null>(null);
  useEffect(() => {
    let live = true;
    loadWorld().then((w) => live && setWorld(w));
    return () => {
      live = false;
    };
  }, []);
  if (!world) return null;
  const known = countries.filter((c) => world.paths[c] || world.dots[c]);
  if (!known.length) return null;
  return (
    <svg viewBox={zoom ? around(world, known) : `0 0 ${world.width} ${world.height}`} role="img" aria-label={zoom ? t("Karte") : t("Karte: {list}", { list: known.join(", ") })} className="mt-3 w-full rounded-xl bg-surface" data-testid="country-map">
      {Object.entries(world.paths).map(([iso, d]) => (
        <path key={iso} d={d} fill={known.includes(iso) ? "var(--accent)" : "var(--line)"} stroke="var(--surface)" strokeWidth={0.6} />
      ))}
      {known.filter((iso) => world.dots[iso]).map((iso) => (
        <circle key={iso} cx={world.dots[iso][0]} cy={world.dots[iso][1]} r={7} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
      ))}
    </svg>
  );
}
