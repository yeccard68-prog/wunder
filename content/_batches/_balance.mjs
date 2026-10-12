// Shared by content batches: the correct answer must not sit in the same place most of the time.
// Where the order of the options carries no meaning (no numbers, no "none of these"), the correct
// option is moved to a position derived from the question id – stable across runs.
const fixedOrder = (opts) => opts.some((o) => /^[\d−–-]|^Etwa \d|^Nein|^Ja\b|Nichts davon|kein Subjekt/.test(o));
const spot = (id) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 4;

/** rows: [id, category, difficulty, minAge, maxAge, question, options, correct, explanation, wiki, enQuestion, enOptions, enExplanation, tags] */
export const balance = (rows) =>
  rows.map((row) => {
    const [id, , , , , , options, correct, , , , enOptions] = row;
    const to = spot(id);
    if (fixedOrder(options) || to === correct) return row;
    const swap = (list) => list && list.map((o, i) => (i === to ? list[correct] : i === correct ? list[to] : o));
    const next = [...row];
    next[6] = swap(options);
    next[7] = to;
    next[11] = swap(enOptions);
    return next;
  });
