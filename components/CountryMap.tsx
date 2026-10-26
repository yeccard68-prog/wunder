"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/store";

type World = { width: number; height: number; paths: Record<string, string>; dots: Record<string, [number, number]> };
let cache: Promise<World | null> | null = null;
/** The map file (public/map/world.json, ~100 KB) is loaded once, the first time a card needs it. */
const loadWorld = () => (cache ??= fetch("/map/world.json").then((r) => (r.ok ? r.json() : null)).catch(() => null));

/**
 * A small world map with the given countries highlighted (ISO codes) – shown on cards about a country once they are
 * answered, so it never gives the answer away. Shapes: Natural Earth (public domain); tiny states are a dot.
 */
export default function CountryMap({ countries }: { countries: string[] }) {
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
    <svg viewBox={`0 0 ${world.width} ${world.height}`} role="img" aria-label={t("Karte: {list}", { list: known.join(", ") })} className="mt-3 w-full rounded-xl bg-surface" data-testid="country-map">
      {Object.entries(world.paths).map(([iso, d]) => (
        <path key={iso} d={d} fill={known.includes(iso) ? "var(--accent)" : "var(--line)"} stroke="var(--surface)" strokeWidth={0.6} />
      ))}
      {known.filter((iso) => world.dots[iso]).map((iso) => (
        <circle key={iso} cx={world.dots[iso][0]} cy={world.dots[iso][1]} r={7} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
      ))}
    </svg>
  );
}
