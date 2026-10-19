"use client";

import { useMemo } from "react";
import Feed from "@/components/Feed";
import { Empty } from "@/components/ui";
import { animationsFor } from "@/lib/animations";
import { booksFor, insightQueue } from "@/lib/books";
import { rankClips } from "@/lib/clips";
import { mixFeed } from "@/lib/feed";
import { factsFor, rankFacts } from "@/lib/facts";
import { visualsFor } from "@/lib/visuals";
import { rankForYou } from "@/lib/ranking";
import { useStore, useT } from "@/lib/store";

/** "Für dich": the app opens straight into one snapping feed – cards, facts, clips, animations; due repetitions are mixed in. */
export default function HomePage() {
  const { items, clips, state, getState } = useStore();
  const t = useT();

  // Rank once per visit so entries don't jump while the user interacts.
  const interestsKey = state.interests.join();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const forYou = useMemo(() => rankForYou(items, getState()), [items, interestsKey]);
  const animations = useMemo(() => animationsFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const books = useMemo(() => booksFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const visuals = useMemo(() => visualsFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const facts = useMemo(() => factsFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const feed = useMemo(() => mixFeed(forYou, rankClips(clips, getState()), animations, getState(), insightQueue(books, getState()), visuals, rankFacts(facts, getState())), [forYou, clips, animations, books, visuals, facts]);

  if (!feed.length)
    return (
      <div className="px-4">
        <Empty title={t("Alles entdeckt")} text={t("Du hast jede Karte gesehen. Neue Inhalte sind unterwegs.")} />
      </div>
    );
  return <Feed entries={feed} layout="snap" />;
}
