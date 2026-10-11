"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, RotateCcw, Users } from "lucide-react";
import Feed from "@/components/Feed";
import { Button, Empty, Ring, Segmented } from "@/components/ui";
import { dailyCount, dueReviews, goalQuestions, today } from "@/lib/gamification";
import { rankFollowing, rankForYou } from "@/lib/ranking";
import { isChild } from "@/lib/content";
import { useStore, useT } from "@/lib/store";

export default function HomePage() {
  const { items, state, getState, setLaunch } = useStore();
  const router = useRouter();
  const t = useT();
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const child = isChild(state.ageBand); // no social feed for children

  // Rank once per visit so cards don't jump while the user interacts.
  const interestsKey = state.interests.join();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const forYou = useMemo(() => rankForYou(items, getState()), [items, interestsKey]);
  const following = useMemo(() => rankFollowing(items, state), [items, state]);

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

      {!child && <Segmented value={tab} onChange={setTab} options={[{ value: "foryou", label: t("Für dich") }, { value: "following", label: t("Folge ich") }]} />}

      {tab === "foryou" ? (
        forYou.length ? <Feed key="fy" entries={forYou} /> : <Empty title={t("Alles entdeckt")} text={t("Du hast jede Karte gesehen. Neue Inhalte sind unterwegs.")} />
      ) : following.length ? (
        <Feed key="fo" entries={following} />
      ) : (
        <Empty icon={<Users size={22} />} title={t("Noch niemand hier")} text={t("Folge Leuten, um zu sehen, welche Karten ihnen gefallen.")}>
          <Button onClick={() => router.push("/social/")}>{t("Leute entdecken")}</Button>
        </Empty>
      )}
    </div>
  );
}
