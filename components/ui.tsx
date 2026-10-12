"use client";

import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useT } from "@/lib/store";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-semibold italic tracking-tight ${className}`}>
      {BRAND.name}<span className="text-accent">.</span>
    </span>
  );
}

type Variant = "primary" | "secondary" | "ghost" | "accent";
const variants: Record<Variant, string> = {
  primary: "bg-ink text-bg",
  accent: "bg-accent text-white",
  secondary: "bg-raised text-ink",
  ghost: "text-muted",
};
export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button {...props} className={`press inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold disabled:opacity-40 ${variants[variant]} ${className}`} />;
}

export function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {initials}
    </span>
  );
}

export function Ring({ value, size = 56, stroke = 5, color = "var(--accent)", children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--raised)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))} style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </span>
  );
}

export function Bar({ value, color = "var(--accent)" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-raised">
      <div className="h-full rounded-full" style={{ width: `${Math.min(1, value) * 100}%`, background: color, transition: "width .5s cubic-bezier(.2,.8,.2,1)" }} />
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="flex rounded-full bg-raised p-1">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={o.value === value} onClick={() => onChange(o.value)} className={`press h-9 flex-1 rounded-full px-3 text-sm font-semibold ${o.value === value ? "bg-surface text-ink shadow-sm" : "text-muted"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: ReactNode; color?: string }) {
  return (
    <button onClick={onClick} aria-pressed={active} className={`press h-10 rounded-full border px-4 text-sm font-semibold ${active ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink"}`}>
      {color && <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-good" : "bg-raised"}`}>
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

/** Bottom sheet for menus, profiles and settings. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal aria-label={title}>
      <button aria-label={t("Schließen")} className="fade absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="sheet relative max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-[1.75rem] bg-surface px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <button onClick={onClose} aria-label={t("Schließen")} className="press -mr-2 flex h-10 w-10 items-center justify-center rounded-full text-muted">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ icon, title, text, children }: { icon?: ReactNode; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-raised text-muted">{icon}</div>}
      <p className="font-display text-xl font-semibold">{title}</p>
      {text && <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted">{text}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function Skeleton() {
  const t = useT();
  return (
    <div className="space-y-4" aria-busy aria-label={t("Lädt")}>
      {[0, 1].map((i) => (
        <div key={i} className="card animate-pulse p-6">
          <div className="h-3 w-24 rounded bg-raised" />
          <div className="mt-5 h-6 w-full rounded bg-raised" />
          <div className="mt-2 h-6 w-2/3 rounded bg-raised" />
          <div className="mt-6 space-y-2.5">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="h-12 rounded-2xl bg-raised" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
