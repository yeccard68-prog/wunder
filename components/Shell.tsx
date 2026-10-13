"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Compass, Flame, House, Library, RotateCcw, User, WifiOff } from "lucide-react";
import { useStore, useT } from "@/lib/store";
import { liveStreak } from "@/lib/gamification";
import { setAnalytics } from "@/lib/analytics";
import { isChild } from "@/lib/content";
import Onboarding from "./Onboarding";
import { ageAllowed } from "@/lib/content";
import { Button, Skeleton, Wordmark } from "./ui";

// Four destinations. Clips, quiz rounds, animations and the community are reached through "Entdecken";
// their routes still exist, the navigation marks "Entdecken" while one of them is open.
const NAV = [
  { href: "/", label: "Für dich", Icon: House, also: [] as string[] },
  { href: "/explore/", label: "Entdecken", Icon: Compass, also: ["/clips", "/quiz", "/explain", "/social", "/lab"] },
  { href: "/library/", label: "Bibliothek", Icon: Library, also: ["/books"] },
  { href: "/profile/", label: "Profil", Icon: User, also: ["/admin", "/legal"] },
];

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const t = useT();
  const { toasts, ready, state, status, error, retry, stale, auth } = useStore();
  const online = useOnline();
  // usage events only with consent, only with a real account, never for children
  useEffect(() => setAnalytics(ready && auth.mode === "live" && !!state.settings.analytics && !isChild(state.ageBand)), [ready, auth.mode, state.settings.analytics, state.ageBand]);
  const immersive = path.startsWith("/clips"); // full-screen video feed
  const feed = path === "/"; // snapping feed: the page itself does not scroll, the feed does
  const nav = NAV;

  // Backend unreachable or misconfigured: say so – never show bundled content instead.
  if (status === "error")
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-8 text-center">
        <Wordmark className="mb-8 text-3xl" />
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-raised text-muted">
          <WifiOff size={22} />
        </span>
        <h1 className="font-display text-2xl font-semibold">{t("Wunder lädt gerade nicht")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{error && t(error)}</p>
        <Button onClick={retry} className="mt-6">
          <RotateCcw size={16} /> {t("Erneut versuchen")}
        </Button>
      </div>
    );

  // also for an account set up for an age band the app is no longer open to: it passes the age question again
  if (ready && (!state.onboarded || !ageAllowed(state.ageBand))) return <Onboarding />;

  return (
    <div className={`mx-auto flex max-w-md flex-col ${feed ? "h-dvh" : "min-h-dvh"}`}>
      {!immersive && <header className="sticky top-0 z-20 flex items-center justify-between bg-bg/85 px-5 pb-2.5 pt-[max(env(safe-area-inset-top),14px)] backdrop-blur-md">
        <Wordmark className="text-2xl" />
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="tnum flex h-8 items-center gap-1 rounded-full bg-surface px-2.5 shadow-sm" title={t("Streak")}>
            <Flame size={15} className="text-accent" fill="currentColor" /> {liveStreak(state)}
          </span>
          <span className="tnum flex h-8 items-center rounded-full bg-surface px-2.5 shadow-sm" title={t("Gesamt-XP")}>
            {state.xp} XP
          </span>
        </div>
      </header>}

      {!immersive && auth.mode === "demo" && (
        <div className="mx-4 mb-2 rounded-xl bg-raised px-3 py-2 text-xs text-muted" role="status">
          {t("Demo-Modus · Beispieldaten, Fortschritt nur auf diesem Gerät")}
        </div>
      )}
      {!immersive && auth.mode === "live" && (!online || stale) && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-raised px-3 py-2 text-xs text-muted" role="status">
          <WifiOff size={14} />
          <span className="flex-1">{t("Offline – du siehst den zuletzt geladenen Stand. Antworten werden erst mit Verbindung gespeichert.")}</span>
          {online && (
            <button onClick={retry} className="font-semibold underline">
              {t("Neu laden")}
            </button>
          )}
        </div>
      )}

      <main className={immersive ? "flex-1" : feed ? "min-h-0 flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))]" : "flex-1 px-4 pb-28 pt-1"}>{ready ? children : <Skeleton />}</main>

      <div className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex flex-col items-center gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`pop rounded-full px-4 py-2 text-sm font-bold shadow-lg ${t.tone === "xp" ? "bg-accent text-white" : "bg-ink text-bg"}`}>
            {t.text}
          </div>
        ))}
      </div>

      <nav aria-label={t("Hauptnavigation")} className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map(({ href, label, Icon, also }) => {
            const active = href === "/" ? path === "/" : [href.slice(0, -1), ...also].some((p) => path.startsWith(p));
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? "page" : undefined} className={`press flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active ? "text-ink" : "text-muted"}`}>
                  <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                  {t(label)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
