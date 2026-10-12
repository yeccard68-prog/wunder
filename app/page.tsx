"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronsDown, RotateCcw } from "lucide-react";
import Feed from "@/components/Feed";
import { Button, Empty, Ring } from "@/components/ui";
import { animationsFor } from "@/lib/animations";
import { booksFor, insightQueue } from "@/lib/books";
import { rankClips } from "@/lib/clips";
import { mixFeed } from "@/lib/feed";
import { dailyCount, dueReviews, goalQuestions, today } from "@/lib/gamification";
import { rankForYou } from "@/lib/ranking";
import { useStore, useT } from "@/lib/store";

/** First screen of the feed: today's goal, the daily challenge and due reviews. */
function Today() {
  const { items, state, setLaunch } = useStore();
  const router = useRouter();
  const t = useT();
  const dailyDone = state.dailyChallenge.date === today();
  const due = dueReviews(items, state).length;
  const goal = goalQuestions(state.goalMinutes);
  const count = dailyCount(state);
  const start = (mode: "daily" | "review") => {
    setLaunch({ mode });
    router.push("/quiz/");
  };
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t("Heute")}</p>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">{state.username ? t("Hallo {name}", { name: state.username }) : t("Hallo")}</h1>
      </div>
      <section className="card flex items-center gap-4 p-4">
        <Ring value={count / goal} size={58}>
          {count >= goal ? <Check size={20} className="text-good" /> : <span className="tnum text-sm font-bold">{count}/{goal}</span>}
        </Ring>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold leading-tight">{dailyDone ? t("Daily Challenge: {a}/5", { a: state.dailyChallenge.score ?? 0 }) : "Daily Challenge"}</p>
          <p className="text-sm text-muted">{dailyDone ? (count >= goal ? t("Tagesziel erreicht. Bis morgen!") : t("Noch {n} bis zum Tagesziel", { n: goal - count })) : t("5 Fragen · bis zu 30 Bonus-XP")}</p>
        </div>
        {!dailyDone && (
          <Button variant="accent" className="h-11 px-5" onClick={() => start("daily")}>
            {t("Start")} <ArrowRight size={16} />
          </Button>
        )}
      </section>
      {due > 0 && (
        <button onClick={() => start("review")} className="press card flex w-full items-center gap-3 p-4 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-raised">
            <RotateCcw size={18} />
          </span>
          <span className="flex-1 text-sm">
            <span className="block font-semibold">{due === 1 ? t("1 Wiederholung ist fällig") : t("{n} Wiederholungen sind fällig", { n: due })}</span>
            <span className="text-muted">{t("Schließe die Lücke, solange sie frisch ist.")}</span>
          </span>
          <ArrowRight size={18} className="text-muted" />
        </button>
      )}
      <p className="flex items-center justify-center gap-1.5 pt-6 text-sm font-semibold text-muted">
        <ChevronsDown size={16} /> {t("Wische nach oben für deinen Feed")}
      </p>
    </div>
  );
}

/** "Für dich": one snapping feed of question cards, clips and animations. */
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
  const feed = useMemo(() => mixFeed(forYou, rankClips(clips, getState()), animations, getState(), insightQueue(books, getState())), [forYou, clips, animations, books]);

  if (!feed.length)
    return (
      <div className="px-4">
        <Today />
        <Empty title={t("Alles entdeckt")} text={t("Du hast jede Karte gesehen. Neue Inhalte sind unterwegs.")} />
      </div>
    );
  return <Feed entries={feed} layout="snap" lead={<Today />} />;
}
