"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { linkOrigin } from "@/lib/native";
import { drawShareCard, shareImage, type ShareCard } from "@/lib/shareCard";
import { useStore, useT } from "@/lib/store";

/**
 * Shares a card as a picture (topic, text, source, link to the app). The picture is drawn on the device;
 * if the system cannot share files it is downloaded, and if drawing fails the text is shared instead.
 */
export default function ShareImageButton({ card, text, fileName, className = "" }: { card: Omit<ShareCard, "link">; text: string; fileName: string; className?: string }) {
  const { toast, share } = useStore();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    const link = linkOrigin();
    try {
      const blob = await drawShareCard({ ...card, link });
      const how = await shareImage(blob, fileName, `${text}\n${link}`);
      if (how === "downloaded") toast(t("Bild gespeichert – du kannst es jetzt teilen."));
    } catch {
      share(`${text}\n${link}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button onClick={run} disabled={busy} aria-label={t("Als Bild teilen")} data-testid="share-image" className={`press flex h-10 w-10 items-center justify-center rounded-full text-muted disabled:opacity-50 ${className}`}>
      <Share2 size={18} />
    </button>
  );
}
