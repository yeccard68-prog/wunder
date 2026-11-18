"use client";

import { useEffect, useRef, useState } from "react";
import { Music, Play, Square } from "lucide-react";
import { duration, play, type Snippet } from "@/lib/listen";
import { useT } from "@/lib/store";

/** The play button of a listening card: plays the theme only when tapped, shows the progress, stops when the card goes. */
export default function ListenButton({ snippet }: { snippet: Snippet }) {
  const t = useT();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [unsupported, setUnsupported] = useState(false);
  const handle = useRef<{ stop: () => void } | null>(null);
  const raf = useRef(0);
  const secs = duration(snippet);

  const stop = () => {
    handle.current?.stop();
    handle.current = null;
    cancelAnimationFrame(raf.current);
    setPlaying(false);
    setProgress(0);
  };
  useEffect(() => () => { handle.current?.stop(); cancelAnimationFrame(raf.current); }, []);

  const start = () => {
    const h = play(snippet, () => { cancelAnimationFrame(raf.current); handle.current = null; setPlaying(false); setProgress(0); });
    if (!h) { setUnsupported(true); return; }
    handle.current = h;
    setPlaying(true);
    const began = performance.now();
    const tick = () => {
      setProgress(Math.min(1, (performance.now() - began) / 1000 / h.seconds));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  return (
    <div className="mt-3 rounded-2xl border border-line bg-raised p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={playing ? stop : start}
          aria-label={playing ? t("Hörprobe stoppen") : t("Hörprobe abspielen")}
          data-testid="listen-button"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-surface transition active:scale-95"
        >
          {playing ? <Square size={18} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold"><Music size={14} /> {t("Hörprobe")} · {Math.round(secs)} s</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-ink" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>
      {unsupported && <p className="mt-2 text-sm text-muted">{t("Dein Browser kann leider keine Töne abspielen.")}</p>}
    </div>
  );
}
