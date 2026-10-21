"use client";

import { useId } from "react";
import { BookOpen, Brain, CalendarCheck, Clapperboard, Flame, Globe, Lock, RotateCcw, Sparkles, Star, Swords, TrendingUp, Users } from "lucide-react";
import type { AchievementIcon } from "@/lib/gamification";

const ICONS: Record<AchievementIcon, typeof Star> = {
  spark: Sparkles, brain: Brain, book: BookOpen, star: Star, film: Clapperboard, comeback: RotateCcw,
  flame: Flame, calendar: CalendarCheck, globe: Globe, people: Users, swords: Swords, rise: TrendingUp,
};

// a hexagon with rounded look, pointing up – drawn in a 100×100 box
const HEX = "M50 4 L89 26.5 L89 73.5 L50 96 L11 73.5 L11 26.5 Z";

/**
 * One badge as a medal: a hexagon in the badge's colour with a soft gradient, a light edge and a shine when earned;
 * grey with a progress ring (how far along) when still locked.
 */
export default function Badge({ icon, color, earned, progress = 0, size = 64 }: { icon: AchievementIcon; color: string; earned: boolean; progress?: number; size?: number }) {
  const id = useId().replace(/:/g, "");
  const Icon = ICONS[icon];
  const r = 47;
  const circ = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} data-earned={earned}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden className="absolute inset-0 overflow-visible">
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={color} />
            <stop offset="1" stopColor={`color-mix(in oklab, ${color} 55%, #11100e)`} />
          </linearGradient>
          <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {!earned && (
          <>
            <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="4" />
            {progress > 0 && <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${circ * Math.min(1, progress)} ${circ}`} transform="rotate(-90 50 50)" />}
          </>
        )}
        <g transform={earned ? undefined : "translate(50 50) scale(0.74) translate(-50 -50)"}>
          <path d={HEX} fill={earned ? `url(#g${id})` : "var(--raised)"} stroke={earned ? `color-mix(in oklab, ${color} 70%, #fff)` : "var(--line)"} strokeWidth="3" strokeLinejoin="round" />
          {earned && <path d="M50 4 L89 26.5 L89 50 L11 50 L11 26.5 Z" fill={`url(#s${id})`} />}
          {earned && <path d="M50 14 L80 31.5 L80 68.5 L50 86 L20 68.5 L20 31.5 Z" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.5" strokeLinejoin="round" />}
        </g>
      </svg>
      <span className={`relative ${earned ? "text-white drop-shadow" : "text-muted"}`}>
        {earned ? <Icon size={size * 0.36} strokeWidth={2.2} /> : progress > 0 ? <Icon size={size * 0.28} /> : <Lock size={size * 0.24} />}
      </span>
    </span>
  );
}
