// XP, levels, streaks, spaced repetition, ranking and content mapping.  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { XP, applyActivity, dailyItems, dueReviews, goalQuestions, isDue, levelInfo, liveStreak, mastery, newAchievements, today } from "../lib/gamification";
import { rankFollowing, rankForYou } from "../lib/ranking";
import { rankClips } from "../lib/clips";
import { buildContent } from "../lib/content";
import { demoContent } from "../lib/demo-content";
import type { AnswerRecord, UserState } from "../lib/types";

const { items, clips } = demoContent();
const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toLocaleDateString("sv");
const user = (patch: Partial<UserState> = {}): UserState => ({
  onboarded: true, username: "Test", interests: ["science"], books: { read: [], saved: [] }, goalMinutes: 5, motivation: "discover", xp: 0, week: { key: "", xp: 0 },
  answers: {}, clipStats: {}, comments: {}, likes: [], saves: [], hidden: [], reported: [], blocked: [], following: [],
  daily: { date: "", count: 0 }, streak: { current: 0, best: 0, lastDate: null }, dailyChallenge: { date: "", score: null },
  challenges: [], achievements: [], log: [], settings: { theme: "system", privateProfile: false, muted: true, captions: true, locale: "de" }, ageBand: null, ...patch,
});
const rec = (patch: Partial<AnswerRecord> = {}): AnswerRecord => ({ correct: true, at: "", categoryId: "science", difficulty: 1, box: null, due: null, reviews: 0, correctIndex: 0, explanation: "", ...patch });

test("XP rules: accuracy and difficulty, nothing for wrong answers", () => {
  assert.equal(XP.first(true, 1), 10);
  assert.equal(XP.first(true, 3), 30);
  assert.equal(XP.first(false, 3), 0);
  assert.equal(XP.claim, 5);
  assert.equal(XP.review, 5);
});

test("levels: 100 XP = level 2, 250 XP = level 3", () => {
  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(99).level, 1);
  assert.equal(levelInfo(100).level, 2);
  assert.equal(levelInfo(250).level, 3);
  assert.deepEqual([levelInfo(130).current, levelInfo(130).needed], [30, 150]);
});

test("streak: first day, next day, same day, gap", () => {
  const d1 = applyActivity(user());
  assert.deepEqual([d1.streak.current, d1.daily.count], [1, 1]);
  const next = applyActivity(user({ streak: { current: 4, best: 6, lastDate: day(-1) } }));
  assert.deepEqual([next.streak.current, next.streak.best], [5, 6]);
  const same = applyActivity(user({ streak: { current: 4, best: 4, lastDate: today() }, daily: { date: today(), count: 3 } }));
  assert.deepEqual([same.streak.current, same.daily.count], [4, 4]);
  const gap = applyActivity(user({ streak: { current: 9, best: 9, lastDate: day(-3) } }));
  assert.deepEqual([gap.streak.current, gap.streak.best], [1, 9]);
});

test("the displayed streak drops to 0 after a missed day", () => {
  assert.equal(liveStreak(user({ streak: { current: 5, best: 5, lastDate: day(-1) } })), 5);
  assert.equal(liveStreak(user({ streak: { current: 5, best: 5, lastDate: day(-2) } })), 0);
});

test("daily goal follows the chosen minutes", () => {
  assert.deepEqual([goalQuestions(3), goalQuestions(5), goalQuestions(10)], [5, 10, 15]);
});

test("spaced repetition: only due questions are offered for review", () => {
  const past = new Date(Date.now() - 60_000).toISOString();
  const future = new Date(Date.now() + 3_600_000).toISOString();
  assert.equal(isDue(past), true);
  assert.equal(isDue(future), false);
  assert.equal(isDue(null), false);
  const s = user({ answers: { s1: rec({ correct: false, box: 0, due: past }), s2: rec({ correct: false, box: 0, due: future }), s3: rec() } });
  assert.deepEqual(dueReviews(items, s).map((i) => i.id), ["s1"]);
});

test("daily challenge: five questions from the user's interests, stable per day", () => {
  const a = dailyItems(items, ["history"], "2026-10-11");
  assert.equal(a.length, 5);
  assert.ok(a.every((i) => i.categoryId === "history" && i.kind === "question"));
  assert.deepEqual(a.map((i) => i.id), dailyItems(items, ["history"], "2026-10-11").map((i) => i.id));
  assert.notDeepEqual(a.map((i) => i.id), dailyItems(items, ["history"], "2026-10-12").map((i) => i.id));
});

test("category mastery is the difficulty-weighted share answered correctly", () => {
  assert.equal(mastery(items, user(), "science"), 0);
  const science = items.filter((i) => i.kind === "question" && i.categoryId === "science");
  const all = Object.fromEntries(science.map((i) => [i.id, rec()]));
  assert.equal(mastery(items, user({ answers: all }), "science"), 1);
});

test("achievements unlock from state and are not awarded twice", () => {
  const s = user({ answers: { s1: rec() } });
  assert.ok(newAchievements(s).some((a) => a.id === "first"));
  assert.ok(!newAchievements({ ...s, achievements: ["first"] }).some((a) => a.id === "first"));
});

test("feed ranking: interests first, answered and hidden cards left out", () => {
  const ranked = rankForYou(items, user({ interests: ["economy"], hidden: ["e1"], answers: { e2: rec({ categoryId: "economy" }) } }));
  assert.ok(!ranked.some((r) => r.item.id === "e1"));
  assert.equal(ranked[0].item.categoryId, "economy");
  assert.ok(!ranked.some((r) => r.item.id === "e2")); // answered correctly: not shown again
  assert.ok(ranked.every((r) => r.reason.length > 0));
});

test("following feed only shows cards liked by followed people", () => {
  assert.equal(rankFollowing(items, user()).length, 0);
  assert.ok(rankFollowing(items, user({ following: ["p1"] })).length > 0);
});

test("clip ranking: interests first, hidden clips removed, watched clips later", () => {
  const first = rankClips(clips, user({ interests: ["earth"] }))[0];
  assert.equal(first.categoryId, "earth");
  const ranked = rankClips(clips, user({ interests: ["earth"], hidden: ["v-venus"], clipStats: { [first.id]: { plays: 1, completed: 1 } } }));
  assert.ok(!ranked.some((c) => c.id === "v-venus"));
  assert.notEqual(ranked[0].id, first.id);
});

test("content mapping: video quizzes stay out of the feed and are attached to their clip", () => {
  assert.equal(items.length, 801);
  assert.equal(clips.length, 77);
  assert.ok(clips.every((c) => c.quiz && !items.some((i) => i.id === c.quiz!.id)));
});

test("content from the backend carries no answers until the user has answered", () => {
  const row = { id: "x", kind: "question", category_id: "science", question: "?", options: ["a", "b"], difficulty: 1, source_name: null, source_url: null, verification_status: "unverified", show_in_feed: true, created_at: "2026-10-01T12:00:00Z" };
  const { items: live } = buildContent([row], []);
  assert.equal(live[0].minAge, 10);
  assert.equal(live[0].correctIndex, undefined);
  assert.equal(live[0].explanation, undefined);
  assert.equal(live[0].popularity, 0);
});

test("badges: every badge has a progress that matches its check, and the next badge is the closest one", async () => {
  const { ACHIEVEMENTS, nextAchievement } = await import("../lib/gamification");
  const s = user({ answers: { a: rec(), b: rec({ correct: false }) }, streak: { current: 2, best: 2, lastDate: null } } as Partial<UserState>);
  for (const a of ACHIEVEMENTS) {
    const [cur, target] = a.progress(s);
    assert.ok(target > 0, a.id);
    assert.equal(cur >= target, a.check(s), a.id); // the ring is full exactly when the badge is earned
  }
  const next = nextAchievement({ ...s, achievements: ["first"] });
  assert.equal(next?.achievement.id, "streak3"); // 2 of 3 days is the largest share done
});
