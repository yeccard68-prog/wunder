// Human review of content that ships inside the app (books, animations, visualisations).
// An editor approves an exact version: the fingerprint of the record as it was read. The app shows
// "checked by an editor" only while the record still has that fingerprint – editing the text later
// makes the approval lapse. Approvals are loaded from the database at start (live mode only).

export type BundleKind = "book" | "animation" | "visual" | "fact";

/** Fields that describe the review state, not the content – they do not change the fingerprint. */
const IGNORED = new Set(["verification_status", "status", "created_at"]);

/** Stable JSON: object keys sorted, so the fingerprint does not depend on key order. */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value as object)
      .filter((k) => !IGNORED.has(k))
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((value as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

/** 32-bit FNV-1a over the stable JSON of a record, as 8 hex digits. Enough to notice any edit. */
export function contentHash(record: object): string {
  const text = stable(record);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

let approved = new Map<string, string>(); // "kind:id" → fingerprint of the approved version

/** Called once the approvals have been loaded. */
export function setApprovals(rows: { kind: string; id: string; content_hash: string | null }[]) {
  approved = new Map(rows.filter((r) => r.content_hash).map((r) => [`${r.kind}:${r.id}`, r.content_hash!]));
}

/** "verified" if an editor approved exactly this version, otherwise the status written in the file. */
export function reviewedStatus<S extends string>(kind: BundleKind, record: { id: string; verification_status: S }): S | "verified" {
  return approved.get(`${kind}:${record.id}`) === contentHash(record) ? "verified" : record.verification_status;
}
