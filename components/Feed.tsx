"use client";

import { useEffect, useRef, useState } from "react";
import type { Ranked } from "@/lib/ranking";
import { useStore, useT } from "@/lib/store";
import KnowledgeCard from "./KnowledgeCard";

const PAGE = 6;

/** Vertical feed that reveals more cards as the user scrolls. */
export default function Feed({ entries }: { entries: Ranked[] }) {
  const { state } = useStore();
  const t = useT();
  const [count, setCount] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setCount((c) => c + PAGE), { rootMargin: "600px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const visible = entries.filter((e) => !state.hidden.includes(e.item.id));
  return (
    <div className="space-y-4">
      {visible.slice(0, count).map((e) => (
        <KnowledgeCard key={e.item.id} item={e.item} reason={t(e.reason, e.vars)} />
      ))}
      <div ref={sentinel} />
      {count >= visible.length && visible.length > 0 && <p className="py-8 text-center text-sm text-muted">{t("Das war alles für heute. Morgen gibt es Neues.")}</p>}
    </div>
  );
}
