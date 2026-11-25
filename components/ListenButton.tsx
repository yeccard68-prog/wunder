"use client";

import { useEffect, useRef, useState } from "react";
import { Music, Play, Square } from "lucide-react";
import { duration, play, type Snippet } from "@/lib/listen";
import { useT } from "@/lib/store";

/**
 * The play button of a listening card: plays the theme only when tapped, shows the progress, stops when the card goes.
 * The piano recordings are fetched on the first tap, so the sound may begin a moment later ("Lädt …").
 */
export default function ListenButton({ snippet }: { snippet: Snippet }) {
  const t = useT();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const handle = useRef<{ stop: () => void } | null>(null);
  const raf = useRef(0);
  const secs = duration(snippet);

  const stop = () => {
    handle.current?.stop();
    handle.current = null;
    cancelAnimationFrame(raf.current);
    setPlaying(false);
    setLoading(false);
    setProgress(0);
  };
  useEffect(() => () => { handle.current?.stop(); cancelAnimationFrame(raf.current); }, []);

  const start = () => {
    const h = play(snippet, {
      onStart: () => {
        setLoading(false);
        const began = performance.now();
        const tick = () => {
          setProgress(Math.min(1, (performance.now() - began) / 1000 / secs));
          raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
      },
      onEnd: () => { cancelAnimationFrame(raf.current); handle.current = null; setPlaying(false); setLoading(false); setProgress(0); },
    });
    if (!h) { setUnsupported(true); return; }
    handle.current = h;
    setPlaying(true);
    setLoading(true);
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
          <p className="flex items-center gap-1.5 text-sm font-semibold"><Music size={14} /> {t("Hörprobe")} · {Math.round(secs)} s{loading && <span className="font-normal text-muted"> · {t("Lädt …")}</span>}</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-ink" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>
      {unsupported && <p className="mt-2 text-sm text-muted">{t("Dein Browser kann leider keine Töne abspielen.")}</p>}
    </div>
  );
}
