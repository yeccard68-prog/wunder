// Chat in duels and groups. The database decides everything (migration 20261025120000_chat.sql): only players
// aged 16+, word filter, no links or contact data, 500 characters, rate limit, reports and blocking. This
// module mirrors the text rules for an instant hint while typing – the server checks again either way.
import { BLOCK_ANYWHERE, BLOCK_WORD, nameWords } from "./names";

export interface ChatPlace { duel?: string; group?: string }
export interface ChatMessage { id: number; mine: boolean; name: string | null; body: string; at: string }
export interface ChatList { allowed: boolean; messages: ChatMessage[] }
export type ChatReason = "insult" | "spam" | "personal" | "other";

export const CHAT_MAX = 500;
export const CHAT_POLL_MS = 5_000;

export type ChatProblem = "empty" | "long" | "words" | "link" | "contact";

/** Tidies a message like the server does: single spaces, trimmed. */
export const tidy = (text: string) => text.replace(/\s+/g, " ").trim();

const LINK = /(https?:\/\/|www\.|[a-z0-9-]+\.(com|de|net|org|io|me|at|ch|ly|gg|tv|app|info|eu|co|uk)\b)/i;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE = /\+?[0-9]{7,}/;

/** Why a message would be refused, or null when it is fine. */
export function chatProblem(text: string): ChatProblem | null {
  const body = tidy(text);
  if (!body) return "empty";
  if (body.length > CHAT_MAX) return "long";
  // word by word: in a sentence, joining all words would find insults across word borders
  const { words } = nameWords(body);
  if (words.some((w) => BLOCK_ANYWHERE.some((b) => w.includes(b)) || BLOCK_WORD.includes(w))) return "words";
  if (EMAIL.test(body) || PHONE.test(body.replace(/[\s()/.-]/g, ""))) return "contact";
  if (LINK.test(body)) return "link";
  return null;
}

/** Only players aged 16+ get the chat (the server checks the same). */
export const chatAllowedFor = (ageBand: string | null | undefined) => ageBand === "16+";
