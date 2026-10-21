// Features the editors can switch off without a new app version (migration 20261025170000_flags_overview.sql).
// The server enforces them; the app only hides what is off. Read once per app start. If the server does not
// know the switches yet (older database), everything counts as on – the server decides either way.
"use client";

import { useEffect, useState } from "react";
import * as api from "./supabase";

export interface Flags { chat: boolean; groups: boolean }
const ALL_ON: Flags = { chat: true, groups: true };

let cached: Promise<Flags> | null = null;

export function loadFlags(): Promise<Flags> {
  if (!api.isLive) return Promise.resolve(ALL_ON);
  cached ??= api.fetchFlags().then((f) => ({ ...ALL_ON, ...f }), () => ALL_ON);
  return cached;
}

/** Forget the cached switches (after an editor changed them). */
export const reloadFlags = () => {
  cached = null;
  return loadFlags();
};

/** The switches; null while loading. */
export function useFlags(): Flags | null {
  const [flags, setFlags] = useState<Flags | null>(null);
  useEffect(() => {
    let gone = false;
    loadFlags().then((f) => !gone && setFlags(f));
    return () => {
      gone = true;
    };
  }, []);
  return flags;
}
