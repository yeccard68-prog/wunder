"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Puzzle } from "lucide-react";
import Feed from "@/components/Feed";
import { Empty } from "@/components/ui";
import type { FeedEntry } from "@/lib/feed";
import { useStore, useT } from "@/lib/store";

/** "Rätsel": logic and number puzzles with hints, open ones first. */
export default function RiddlesPage() {
  const { items, state } = useStore();
  const t = useT();
  const riddles = useMemo(() => items.filter((i) => i.hints?.length).sort((a, b) => a.difficulty - b.difficulty), [items]);
  // the order is fixed when the page opens, so a solved riddle does not jump away under the finger
  const entries = useMemo<FeedEntry[]>(
    () => [...riddles.filter((i) => !state.answers[i.id]), ...riddles.filter((i) => state.answers[i.id])].map((item) => ({ kind: "item", item, reason: "" })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [riddles]
  );
  const solved = riddles.filter((i) => state.answers[i.id]?.correct).length;

  return (
    <div className="space-y-4">
      <Link href="/explore/" className="press -ml-1 flex items-center gap-1.5 text-sm font-semibold text-muted">
        <ArrowLeft size={18} /> {t("Zurück zu Entdecken")}
      </Link>
      <header>
        <h1 className="font-display text-3xl font-semibold leading-tight">{t("Rätsel")}</h1>
        <p className="text-sm text-muted">{t("Knobelaufgaben zum Selbst-Denken. Wenn du feststeckst, hilft ein Tipp nach dem anderen – ohne die Lösung zu verraten.")}</p>
        {riddles.length > 0 && <p className="mt-2 text-xs font-semibold text-muted" role="status">{t("{n} von {m} gelöst", { n: solved, m: riddles.length })}</p>}
      </header>
      {entries.length ? <Feed entries={entries} /> : <Empty icon={<Puzzle size={22} />} title={t("Noch keine Rätsel")} text={t("Neue Rätsel folgen.")} />}
    </div>
  );
}
