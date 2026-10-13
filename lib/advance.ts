// After the question about a clip is answered the feed moves on by itself.
// The learner gets time to read the feedback (longer after a wrong answer) and can stay instead.
import { useCallback, useEffect, useRef, useState } from "react";

export const ADVANCE_MS = { correct: 2600, wrong: 4600 };

/** start(correct) arms the timer, stay() cancels it; `pending` is true while it runs. */
export function useAutoAdvance(go: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState(false);
  const stay = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPending(false);
  }, []);
  const start = useCallback(
    (correct: boolean) => {
      stay();
      setPending(true);
      timer.current = setTimeout(() => {
        timer.current = null;
        setPending(false);
        go();
      }, correct ? ADVANCE_MS.correct : ADVANCE_MS.wrong);
    },
    [go, stay],
  );
  useEffect(() => stay, [stay]); // leaving the page cancels it
  return { start, stay, pending };
}

/** Scrolls an element into view, without animation where the system asks for reduced motion. */
export function scrollToElement(el: Element | null | undefined) {
  el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}
