// Shareable pictures: a fact or a question as a 1080×1350 image (the format Instagram and most messengers show
// uncropped) with the topic, the text, the source and a link to the app. Drawn on the device with a canvas –
// nothing is uploaded, no service involved. Shared through the system share sheet where it accepts files,
// otherwise saved as a download.
import { BRAND } from "./brand";

export const CARD_W = 1080;
export const CARD_H = 1350;

export interface ShareCard {
  kicker: string; // e.g. "WUSSTEST DU? · WISSENSCHAFT"
  title: string; // the fact or the question
  detail?: string | string[]; // one or two sentences under it, or several short lines (answer options)
  footer: string; // e.g. "Quelle: Wikipedia – Faultiere"
  color: string; // topic colour (any CSS colour)
  link: string; // where the app is, e.g. https://wunder-one.vercel.app
}

/** Splits text into lines that fit `width` – word by word, long words are kept whole. */
export function wrapLines(text: string, width: number, measure: (s: string) => number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** The font sizes that make the title fit: as large as possible, never more than `maxLines`. */
export function fitTitle(text: string, width: number, measureAt: (s: string, size: number) => number, sizes = [84, 74, 64, 56, 48, 42], maxLines = 7) {
  for (const size of sizes) {
    const lines = wrapLines(text, width, (s) => measureAt(s, size));
    if (lines.length <= maxLines) return { size, lines };
  }
  const size = sizes[sizes.length - 1];
  return { size, lines: wrapLines(text, width, (s) => measureAt(s, size)).slice(0, maxLines) };
}

/** The font family behind a CSS variable, resolved (a canvas cannot read `var(...)`). */
const fontOf = (cssVar: string, fallback: string) => {
  const el = document.createElement("span");
  el.style.fontFamily = `var(${cssVar})`;
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  document.body.appendChild(el);
  const family = getComputedStyle(el).fontFamily;
  el.remove();
  return family && !family.includes("var(") ? family : fallback;
};

export async function drawShareCard(card: ShareCard): Promise<Blob> {
  const display = fontOf("--font-display", "Georgia, serif");
  const sans = fontOf("--font-sans", "system-ui, sans-serif");
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const g = canvas.getContext("2d")!;
  const pad = 96;
  const width = CARD_W - 2 * pad;

  g.fillStyle = "#11100e";
  g.fillRect(0, 0, CARD_W, CARD_H);
  g.fillStyle = card.color;
  g.fillRect(0, 0, CARD_W, 14);

  // brand
  g.fillStyle = "#f4f1ec";
  g.font = `600 52px ${display}`;
  g.textBaseline = "alphabetic";
  g.fillText(BRAND.name, pad, pad + 40);
  g.fillStyle = "#ff6d48";
  g.fillText(".", pad + g.measureText(BRAND.name).width, pad + 40);

  // kicker
  g.fillStyle = card.color;
  g.font = `600 30px ${sans}`;
  g.fillText(card.kicker.toUpperCase(), pad, 300);

  // title
  const { size, lines } = fitTitle(card.title, width, (s, px) => {
    g.font = `600 ${px}px ${display}`;
    return g.measureText(s).width;
  });
  g.font = `600 ${size}px ${display}`;
  g.fillStyle = "#f4f1ec";
  let y = 300 + size * 1.5;
  for (const line of lines) {
    g.fillText(line, pad, y);
    y += size * 1.18;
  }

  // detail
  if (card.detail) {
    g.font = `400 36px ${sans}`;
    g.fillStyle = "#c9c3ba";
    y += 28;
    const paragraphs = Array.isArray(card.detail) ? card.detail : [card.detail];
    const detailLines = paragraphs.flatMap((p) => wrapLines(p, width, (s) => g.measureText(s).width));
    for (const line of detailLines.slice(0, 6)) {
      if (y > CARD_H - 260) break;
      g.fillText(line, pad, y);
      y += 50;
    }
  }

  // footer: source and link
  g.fillStyle = "#2f2b27";
  g.fillRect(pad, CARD_H - 200, width, 2);
  g.font = `400 28px ${sans}`;
  g.fillStyle = "#a39d94";
  g.fillText(wrapLines(card.footer, width, (s) => g.measureText(s).width)[0] ?? "", pad, CARD_H - 140);
  g.font = `600 32px ${sans}`;
  g.fillStyle = "#f4f1ec";
  g.fillText(card.link.replace(/^https?:\/\//, ""), pad, CARD_H - 88);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas"))), "image/png"));
}

/** Shares the picture where the system allows files, otherwise downloads it. Returns how it went. */
export async function shareImage(blob: Blob, fileName: string, text: string): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([blob], fileName, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return "shared";
    } catch {
      return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "downloaded";
}
