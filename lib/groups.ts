// Groups: a fixed circle of players (invited with a code). Anyone in the group can start a group round – six
// questions from one topic, 20 seconds each, everyone plays them within three days, and a ranking shows who
// knew most. The rules live in the database (migration 20261025110000_groups.sql).

export const GROUP_QUESTIONS = 6;
export const GROUP_NAME_MAX = 40;

export interface GroupSummary { id: string; name: string; code: string; members: number; openRound: boolean; updatedAt: string }
export interface GroupMember { id: string; name: string | null; me: boolean; owner: boolean }
export interface GroupRanking { name: string | null; me: boolean; score: number; done: boolean }
export interface GroupRound {
  id: string;
  category: string;
  createdAt: string;
  closesAt: string;
  open: boolean;
  played: number; // how many of the six questions I have answered
  players: number;
  ranking: GroupRanking[] | null; // only once I have played the round, or it has closed
}
export interface GroupState { id: string; name: string; code: string; owner: boolean; members: GroupMember[]; rounds: GroupRound[] }

/** Places with ties: equal scores share a place (1, 2, 2, 4). */
export function places(ranking: { score: number }[]): number[] {
  return ranking.map((r) => ranking.filter((o) => o.score > r.score).length + 1);
}

/** "noch 2 Tage" style: whole days or hours left until the round closes. */
export function timeLeft(closesAt: string, now = Date.now()): { days: number; hours: number } {
  const ms = Math.max(0, new Date(closesAt).getTime() - now);
  return { days: Math.floor(ms / 86_400_000), hours: Math.ceil((ms % 86_400_000) / 3_600_000) };
}
