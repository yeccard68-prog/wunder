"use client";

import { useMemo, useState } from "react";
import DailyPuzzles from "@/components/DailyPuzzles";
import Feed from "@/components/Feed";
import { Empty } from "@/components/ui";
import { animationsFor } from "@/lib/animations";
import { comparisonsFor, withComparisons } from "@/lib/compare";
import { portraitsFor } from "@/lib/portraits";
import { booksFor, insightQueue } from "@/lib/books";
import { rankClips } from "@/lib/clips";
import { mixFeed } from "@/lib/feed";
import { eventsFor } from "@/lib/days";
import { factsFor, rankFacts } from "@/lib/facts";
import { today } from "@/lib/gamification";
import { exercisesFor } from "@/lib/exercises";
import { dailyOpen, dailyPuzzles, feedPuzzles } from "@/lib/puzzles";
import { studiesFor } from "@/lib/studies";
import { visualsFor } from "@/lib/visuals";
import { rankForYou } from "@/lib/ranking";
import { deviceRegion } from "@/lib/region";
import { useStore, useT } from "@/lib/store";

/**
 * "Für dich": one snapping feed – cards, facts, clips, animations, puzzles; due repetitions are mixed in. Once a day
 * the three "Rätsel des Tages" come first.
 */
export default function HomePage() {
  const { items, clips, state, getState, loadMore } = useStore();
  const t = useT();

  // Rank once per visit so entries don't jump while the user interacts; the feed's chance is drawn once per visit too.
  const [seed] = useState(() => String(Date.now()));
  const interestsKey = state.interests.join();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const forYou = useMemo(() => rankForYou(items, getState(), { region: deviceRegion(), seed }), [items, interestsKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const animations = useMemo(() => withComparisons(animationsFor(state.settings.locale, state.ageBand), [...comparisonsFor(state.settings.locale, state.ageBand), ...portraitsFor(state.settings.locale, state.ageBand)], deviceRegion(), seed), [state.settings.locale, state.ageBand]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const books = useMemo(() => booksFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const visuals = useMemo(() => visualsFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const facts = useMemo(() => factsFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const date = today();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const puzzles = useMemo(() => feedPuzzles(items, getState(), 6, date), [items.length, date, state.settings.locale, state.ageBand]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const feed = useMemo(() => mixFeed(forYou, rankClips(clips, getState()), animations, getState(), insightQueue(books, getState()), visuals, rankFacts(facts, getState()), eventsFor(state.settings.locale, state.ageBand), studiesFor(state.settings.locale, state.ageBand), puzzles, seed, exercisesFor(state.ageBand, state.settings.locale, 40, seed)), [forYou, clips, animations, books, visuals, facts, puzzles]);
  // today’s three puzzles, fixed for this visit (answering a card must not swap the crossword under the finger)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const daily = useMemo(() => (items.length ? dailyPuzzles(items, getState(), date) : []), [items.length > 0, date, state.settings.locale, state.ageBand]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dailyLeft = useMemo(() => dailyOpen(getState(), daily, date), [daily]);
  const [gateDone, setGateDone] = useState(false);

  if (dailyLeft.length && !gateDone && state.settings.dailyPuzzles !== false) return <DailyPuzzles puzzles={daily} open={dailyLeft} onFinished={() => setGateDone(true)} />;

  if (!feed.length)
    return (
      <div className="px-4">
        <Empty title={t("Alles entdeckt")} text={t("Du hast jede Karte gesehen. Neue Inhalte sind unterwegs.")} />
      </div>
    );
  return <Feed entries={feed} layout="snap" onNearEnd={loadMore} />;
}
