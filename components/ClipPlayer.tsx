"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui";
import { useT } from "@/lib/store";

/** How long a clip may stay without data before we stop waiting and offer a retry. */
export const STALL_MS = 15000;

type Status = "loading" | "ready" | "error";

/**
 * Video player for one clip in the feed. Shows the preview image and a spinner while loading,
 * a play button when paused, and an explanation with a retry button when the file cannot be
 * loaded – a broken clip never takes the feed down with it.
 */
export default function ClipPlayer({ src, poster, start = 0, end = null, title, active, mounted, autoplay, muted, onTime, onComplete, onStarted }: {
  src: string;
  poster?: string | null;
  start?: number; // segment of the file that is played (seconds)
  end?: number | null;
  title: string;
  active: boolean; // the clip currently on screen
  mounted: boolean; // only clips near the screen get a video element
  autoplay: boolean;
  muted: boolean;
  onTime?: (seconds: number) => void;
  onComplete?: () => void;
  onStarted?: () => void;
}) {
  const t = useT();
  const video = useRef<HTMLVideoElement>(null);
  const last = useRef(start);
  const [status, setStatus] = useState<Status>("loading");
  const [paused, setPaused] = useState(true);
  const [buffering, setBuffering] = useState(false); // waiting for data after the first picture (also briefly at every loop)
  const [attempt, setAttempt] = useState(0);
  const [cover, setCover] = useState(false); // landscape footage fills the screen, vertical clips are shown whole
  const [offline, setOffline] = useState(false);

  // once a picture is there it stays visible; later waiting only shows the spinner on top
  const shown = () => {
    setStatus("ready");
    setBuffering(false);
  };
  const retry = useCallback(() => {
    setStatus("loading");
    setBuffering(false);
    setAttempt((n) => n + 1);
  }, []);

  /** play() rejects for harmless reasons too (autoplay blocked, interrupted by a pause) – only a media error is a failure. */
  const play = useCallback(() => {
    const v = video.current;
    if (!v) return;
    v.play().catch(() => {
      if (v.error) setStatus("error");
    });
  }, []);

  // Only the active clip plays; everything else is paused and rewound.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (active) {
      onStarted?.();
      if (autoplay) play();
    } else {
      v.pause();
      if (v.readyState > 0) v.currentTime = start;
      last.current = start;
      onTime?.(start);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, autoplay, attempt, start]);

  useEffect(() => {
    if (video.current) video.current.muted = muted;
  }, [muted, mounted, attempt]);

  // Nothing arrives for a long time → stop the spinner and say so.
  useEffect(() => {
    if (!active || status !== "loading") return;
    const id = setTimeout(() => setStatus((s) => (s === "loading" ? "error" : s)), STALL_MS);
    return () => clearTimeout(id);
  }, [active, status, attempt]);

  // Back online → try again without the user having to ask.
  useEffect(() => {
    if (status !== "error") return;
    setOffline(!navigator.onLine);
    const on = () => retry();
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
  }, [status, retry]);

  const onTimeUpdate = () => {
    const v = video.current;
    if (!v) return;
    let now = v.currentTime;
    // the picture is moving → it is not loading, whatever event was missed
    if (!v.paused && v.readyState >= 3) shown();
    // A clip can be a segment of a longer file: jump back to its start when the end is reached.
    if (end !== null && now >= end) {
      v.currentTime = start;
      now = start;
      onComplete?.();
      if (active) play();
    } else if (now < last.current - 0.5) onComplete?.(); // looped → watched to the end
    last.current = now;
    onTime?.(now);
  };
  const onMeta = () => {
    const v = video.current;
    if (!v) return;
    setCover(v.videoWidth > v.videoHeight);
    if (start && v.currentTime < start) v.currentTime = start;
  };
  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) play();
    else v.pause();
  };

  const fit = cover ? "object-cover" : "object-contain";
  return (
    <div className="absolute inset-0" data-testid="clip-player" data-status={status} data-paused={paused}>
      {poster && status !== "ready" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" aria-hidden className={`absolute inset-0 h-full w-full ${fit} ${status === "error" ? "opacity-25" : ""}`} onError={(e) => (e.currentTarget.style.display = "none")} />
      )}
      {mounted && status !== "error" && (
        <video
          key={attempt}
          ref={video}
          src={start ? `${src}#t=${start}` : src}
          aria-label={title}
          loop={end === null}
          playsInline
          muted
          preload={active ? "auto" : "metadata"}
          onLoadedMetadata={onMeta}
          onLoadedData={() => setStatus("ready")}
          onCanPlay={shown}
          onPlaying={shown}
          onWaiting={() => setBuffering(true)}
          onTimeUpdate={onTimeUpdate}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
          onError={() => setStatus("error")}
          onClick={toggle}
          className={`absolute inset-0 h-full w-full ${fit} ${status === "ready" ? "" : "opacity-0"}`}
        />
      )}
      {active && (status === "loading" || (buffering && status === "ready" && !paused)) && (
        <div role="status" aria-label={t("Clip wird geladen")} className="pointer-events-none absolute left-1/2 top-[42%] h-12 w-12 -translate-x-1/2 animate-spin rounded-full border-[3px] border-white/25 border-t-white" />
      )}
      {status === "error" && (
        <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
          {offline && <WifiOff size={26} />}
          <p className="font-display text-xl font-semibold">{t("Dieser Clip lädt gerade nicht.")}</p>
          <p className="text-sm text-white/75">{offline ? t("Du bist offline. Sobald die Verbindung zurück ist, geht es weiter.") : t("Prüfe deine Verbindung oder wische zum nächsten Clip.")}</p>
          <Button variant="secondary" onClick={retry}>
            <RotateCcw size={16} /> {t("Erneut versuchen")}
          </Button>
        </div>
      )}
      {active && paused && status === "ready" && (
        <button onClick={toggle} aria-label={t("Abspielen")} className="pop absolute left-1/2 top-[42%] flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-black/45 backdrop-blur">
          <Play size={34} fill="currentColor" />
        </button>
      )}
    </div>
  );
}
