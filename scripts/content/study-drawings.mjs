// Own drawings for "Studie kurz erklärt" (30.10.2026: only own pictures, the operator's wish): wordless sketches in the
// style of the first ones (beige ground, dark figures, one orange accent), 400 × 300. Writes public/img/studies/<id>.svg
// and sets image_url / image_credit in content/studies.json. Studies drawn by hand earlier keep their files.
//   node scripts/content/study-drawings.mjs
import fs from "node:fs";

const BG = "#f3ede4", INK = "#2b2a28", GREY = "#b8b0a6", WHITE = "#ffffff", ACCENT = "#e8552d", AMBER = "#c98a2b", GOLD = "#d9a933";
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="${BG}"/><defs><marker id="a" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="${ACCENT}"/></marker><marker id="k" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="${INK}"/></marker></defs>${body}</svg>`;
const BODY = "M-20 -38 h40 a6 6 0 0 1 6 6 v44 h-12 v40 h-28 v-40 h-12 v-44 a6 6 0 0 1 6 -6z";
/** A person standing on (x, y); style: ink (the one it is about), grey (others), outline (bystanders). */
const person = (x, y, s = 1, style = "ink") => {
  const paint = style === "ink" ? `fill="${INK}"` : style === "grey" ? `fill="${GREY}"` : style === "accent" ? `fill="${ACCENT}"` : `fill="${WHITE}" stroke="${GREY}" stroke-width="3"`;
  return `<g transform="translate(${x} ${y}) scale(${s})" ${paint}><circle cx="0" cy="-58" r="14"/><path d="${BODY}"/></g>`;
};
const line = (d, color = INK, w = 4, extra = "") => `<path d="${d}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const arrow = (d, color = ACCENT, w = 4) => line(d, color, w, `marker-end="url(#${color === ACCENT ? "a" : "k"})"`);
const jar = (x, y, s, fill) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-12" y="-6" width="24" height="26" rx="5" fill="${fill}" stroke="${INK}" stroke-width="2"/><rect x="-13" y="-12" width="26" height="7" rx="2" fill="${INK}"/><rect x="-8" y="2" width="16" height="9" rx="2" fill="${WHITE}" fill-opacity="0.8"/></g>`;
const flask = (x, y, liquid) => `<circle cx="${x}" cy="${y}" r="34" fill="${WHITE}" stroke="${INK}" stroke-width="4"/><path d="M${x - 31} ${y + 12} A34 34 0 0 0 ${x + 31} ${y + 12} Z" fill="${liquid}"/>`;
const wheel = (x, y, r) => {
  let s = `<circle cx="${x}" cy="${y}" r="${r}" fill="${WHITE}" stroke="${INK}" stroke-width="4"/>`;
  for (let i = 0; i < 10; i++) {
    const a = (i * 36 * Math.PI) / 180, b = ((i + 1) * 36 * Math.PI) / 180;
    if (i % 2) s += `<path d="M${x} ${y} L${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)} A${r} ${r} 0 0 1 ${(x + r * Math.cos(b)).toFixed(1)} ${(y + r * Math.sin(b)).toFixed(1)} Z" fill="${GREY}"/>`;
  }
  return s + `<circle cx="${x}" cy="${y}" r="7" fill="${INK}"/><path d="M${x} ${y - r - 18} l-9 -14 h18 z" fill="${ACCENT}" transform="rotate(180 ${x} ${y - r - 18})"/>`;
};

const drawings = {
  // Asch: one line to match, three to choose from, a row of people – the real participant last, unsure
  "s-asch": svg(`<rect x="40" y="40" width="120" height="90" rx="8" fill="${WHITE}" stroke="${GREY}" stroke-width="3"/>${line("M100 58 V112", INK, 6)}
    <rect x="200" y="40" width="160" height="90" rx="8" fill="${WHITE}" stroke="${GREY}" stroke-width="3"/>${line("M240 70 V112", INK, 6)}${line("M280 58 V112", INK, 6)}${line("M320 46 V112", INK, 6)}
    ${person(70, 280, 0.8, "grey")}${person(130, 280, 0.8, "grey")}${person(190, 280, 0.8, "grey")}${person(250, 280, 0.8, "grey")}${person(320, 280, 0.8, "ink")}
    <circle cx="352" cy="190" r="16" fill="${WHITE}" stroke="${ACCENT}" stroke-width="4"/><path d="M346 186 q6 -8 12 0 q0 6 -6 8 v4" stroke="${ACCENT}" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  // Dunning-Kruger: how good people think they are (dashed, flat and high) against how good they are (rising)
  "s-dunning-kruger": svg(`${line("M60 40 V250 H360", INK, 4)}${line("M80 90 C150 70 230 80 340 70", ACCENT, 5, 'stroke-dasharray="10 9"')}${line("M80 230 C160 200 250 140 340 80", INK, 5)}
    ${[110, 180, 250, 320].map((x, i) => `<circle cx="${x}" cy="${[79, 74, 77, 71][i]}" r="7" fill="${ACCENT}"/><circle cx="${x}" cy="${[218, 190, 147, 92][i]}" r="7" fill="${INK}"/>`).join("")}
    ${line("M110 90 V208", GREY, 3, 'stroke-dasharray="4 6"')}`),
  // Ebbinghaus: cards with nonsense syllables, and the curve of what is left: 100 % → 60 % after 20 minutes → 34 % after a day
  "s-ebbinghaus": svg(`${[0, 1, 2].map((i) => `<rect x="${40 + i * 10}" y="${34 + i * 10}" width="90" height="60" rx="6" fill="${WHITE}" stroke="${GREY}" stroke-width="3"/>`).join("")}
    ${[0, 1, 2].map((i) => line(`M${72} ${62 + i * 13} h${36 - i * 8}`, INK, 5)).join("")}
    ${line("M170 40 V250 H370", INK, 4)}${line("M175 50 C185 120 200 150 230 160 C270 172 320 178 365 182", ACCENT, 5)}
    <circle cx="175" cy="50" r="7" fill="${INK}"/><circle cx="230" cy="160" r="7" fill="${INK}"/><circle cx="330" cy="179" r="7" fill="${INK}"/>`),
  // Miller-Urey: water boiled in a flask, the vapour through a sphere with two electrodes and a spark, cooled, back to the flask
  "s-miller-urey": svg(`${flask(110, 215, "#9ec3e6")}<path d="M96 262 q14 -26 28 0 q-14 10 -28 0z" fill="${ACCENT}"/>
    ${line("M110 181 V70 H200", INK, 6)}<circle cx="250" cy="80" r="46" fill="${WHITE}" stroke="${INK}" stroke-width="4"/>
    ${line("M206 80 h26", INK, 5)}${line("M294 80 h-26", INK, 5)}${line("M232 80 l8 -10 l4 14 l6 -12 l4 8", ACCENT, 4)}
    ${line("M250 126 V200 C250 232 200 236 160 230", INK, 6)}${[0, 1, 2, 3].map((i) => `<ellipse cx="250" cy="${148 + i * 13}" rx="14" ry="6" fill="none" stroke="${GREY}" stroke-width="3"/>`).join("")}
    <path d="M190 232 q6 10 14 0" fill="${AMBER}"/>${arrow("M140 100 h30", ACCENT, 3)}${arrow("M262 150 v30", ACCENT, 3)}`),
  // Millikan: oil droplets sprayed in, falling between two charged plates, watched through a microscope
  "s-millikan": svg(`<rect x="70" y="100" width="200" height="12" fill="${INK}"/><rect x="70" y="200" width="200" height="12" fill="${INK}"/><rect x="164" y="100" width="12" height="12" fill="${BG}"/>
    <path d="M150 40 h40 l-10 26 h-20z" fill="${GREY}"/>${line("M170 66 V96", GREY, 4, 'stroke-dasharray="3 6"')}
    ${[[130, 140], [190, 150], [160, 175], [220, 132], [110, 182]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 2 ? 8 : 5}" fill="${i === 2 ? ACCENT : AMBER}"/>`).join("")}
    ${line("M300 106 H330 V150 M300 206 H330 V170", INK, 3)}<rect x="318" y="150" width="24" height="6" fill="${INK}"/><rect x="322" y="162" width="16" height="6" fill="${INK}"/>
    <g transform="rotate(-20 40 160)"><rect x="20" y="148" width="50" height="22" rx="4" fill="${INK}"/><rect x="66" y="152" width="14" height="14" fill="${GREY}"/></g>`),
  // Anchoring: a wheel of fortune, then two estimates – a low number gives a low guess, a high one a high guess
  "s-anker": svg(`${wheel(110, 160, 70)}${arrow("M200 160 h40", INK, 4)}
    <rect x="270" y="190" width="36" height="60" rx="4" fill="${GREY}"/><rect x="320" y="120" width="36" height="130" rx="4" fill="${ACCENT}"/>${line("M255 250 H370", INK, 4)}`),
  // The jam study: many jars, few take one home; six jars, more do
  "s-marmelade": svg(`<rect x="20" y="170" width="200" height="10" fill="${INK}"/><rect x="250" y="170" width="130" height="10" fill="${INK}"/>
    ${Array.from({ length: 24 }, (_, i) => jar(36 + (i % 8) * 24, 82 + Math.floor(i / 8) * 30, 0.7, [ACCENT, AMBER, "#7a3b6e"][i % 3])).join("")}
    ${Array.from({ length: 6 }, (_, i) => jar(276 + (i % 3) * 38, 120 + Math.floor(i / 3) * 0 - (i < 3 ? 38 : 0), 1, [ACCENT, AMBER, "#7a3b6e"][i % 3])).join("")}
    <path d="M100 222 h40 l-6 34 h-28z" fill="${WHITE}" stroke="${INK}" stroke-width="3"/>
    ${[0, 1, 2].map((i) => `<path d="M${262 + i * 40} 222 h32 l-5 30 h-22z" fill="${WHITE}" stroke="${INK}" stroke-width="3"/>${jar(278 + i * 40, 216, 0.55, ACCENT)}`).join("")}`),
  // Galton: an ox, many guesses, and the middle of all guesses right on its weight
  "s-galton": svg(`<g fill="${INK}"><rect x="110" y="60" width="120" height="56" rx="20"/><rect x="214" y="52" width="40" height="34" rx="12"/><rect x="122" y="108" width="12" height="40"/><rect x="146" y="108" width="12" height="40"/><rect x="186" y="108" width="12" height="40"/><rect x="208" y="108" width="12" height="40"/></g>${line("M222 52 q-8 -14 4 -18 M248 52 q8 -14 -4 -18", INK, 4)}
    ${line("M60 270 H340", INK, 4)}${[6, 14, 28, 52, 70, 54, 30, 16, 7].map((h, i) => `<rect x="${92 + i * 24}" y="${268 - h}" width="18" height="${h}" fill="${GREY}"/>`).join("")}
    ${line("M200 160 V272", ACCENT, 4, 'stroke-dasharray="6 6"')}<circle cx="200" cy="160" r="7" fill="${ACCENT}"/>`),
  // The pitch drop: a funnel of pitch on a stand, a drop hanging, a clock for the decades
  "s-pechtropfen": svg(`${line("M120 60 V260 M120 80 H230", INK, 6)}<path d="M180 70 h100 l-40 56 v24 h-20 v-24z" fill="${INK}"/><rect x="220" y="150" width="20" height="10" fill="${INK}"/>
    <path d="M230 160 q-12 24 0 36 q12 -12 0 -36z" fill="${INK}"/><path d="M190 214 v42 h80 v-42" fill="${WHITE}" stroke="${GREY}" stroke-width="4"/><ellipse cx="230" cy="250" rx="30" ry="6" fill="${INK}"/>
    <circle cx="330" cy="80" r="34" fill="${WHITE}" stroke="${INK}" stroke-width="4"/>${line("M330 80 V58 M330 80 L346 92", ACCENT, 4)}`),
  // Loftus: the scene with a yield sign – and what is remembered: a stop sign
  "s-loftus": svg(`<rect x="30" y="50" width="200" height="140" rx="8" fill="${WHITE}" stroke="${GREY}" stroke-width="3"/>
    <g fill="${INK}"><rect x="60" y="130" width="100" height="30" rx="8"/><path d="M80 130 l14 -22 h40 l12 22z"/><circle cx="84" cy="164" r="11"/><circle cx="138" cy="164" r="11"/></g>
    ${line("M196 170 V108", INK, 4)}<path d="M176 76 h40 l-20 32z" fill="${WHITE}" stroke="${ACCENT}" stroke-width="5" stroke-linejoin="round"/>
    ${person(300, 270, 0.9, "ink")}<circle cx="268" cy="146" r="6" fill="${WHITE}" stroke="${GREY}" stroke-width="3"/><circle cx="284" cy="128" r="9" fill="${WHITE}" stroke="${GREY}" stroke-width="3"/>
    <ellipse cx="320" cy="84" rx="58" ry="46" fill="${WHITE}" stroke="${GREY}" stroke-width="3"/><path d="M309 58 h22 l15 15 v22 l-15 15 h-22 l-15 -15 v-22z" fill="${ACCENT}"/>`),
  // Rutherford: alpha particles at a thin gold foil – most go through, a few are deflected, one bounces back
  "s-rutherford": svg(`<rect x="20" y="120" width="60" height="60" rx="4" fill="${INK}"/><rect x="80" y="144" width="10" height="12" fill="${INK}"/>
    <path d="M210 40 A140 140 0 0 1 210 260" fill="none" stroke="${GREY}" stroke-width="10"/><path d="M210 40 A140 140 0 0 0 210 260" fill="none" stroke="${GREY}" stroke-width="3" stroke-dasharray="4 8"/>
    <rect x="206" y="90" width="8" height="120" fill="${GOLD}"/>
    ${arrow("M96 142 H330", INK, 3)}${arrow("M96 150 H330", INK, 3)}${arrow("M96 158 H330", INK, 3)}${arrow("M96 146 H210 L320 90", ACCENT, 3)}${arrow("M96 154 H206 L130 110", ACCENT, 3)}`),
  // Stroop: words in colours that do not fit them – and a voice naming the colour
  "s-stroop": svg(`${[[60, ACCENT], [120, "#3d7f5a"], [180, "#3c63b0"]].map(([y, c], i) => `<g fill="${c}">${[0, 1, 2, 3].map((j) => `<rect x="${60 + j * 34}" y="${y}" width="26" height="34" rx="6"/>`).join("")}</g><rect x="${210}" y="${y + 4}" width="26" height="26" rx="13" fill="${[ "#3d7f5a", "#3c63b0", ACCENT][i]}"/>`).join("")}
    ${person(320, 270, 0.9, "ink")}<path d="M290 150 q-30 -10 -40 -40" stroke="${GREY}" stroke-width="3" fill="none" stroke-dasharray="4 6"/>`),
  // Pasteur: a swan-neck flask stays clear; with the neck broken off, mould grows; dust falls from above
  "s-pasteur": svg(`${flask(110, 200, "#f2e6b8")}${line("M110 166 V120 C110 80 170 70 160 110 C152 140 190 150 210 120", INK, 6)}
    ${flask(290, 200, "#f2e6b8")}${line("M290 166 V140", INK, 6)}${line("M282 138 l6 -6 l6 6 l6 -6", INK, 3)}
    <path d="M266 212 q8 -14 18 -4 q10 -12 18 2 q10 -6 14 6 q-24 14 -50 -4z" fill="#6f8a5a"/>
    ${[[60, 40], [150, 30], [250, 50], [300, 80], [330, 40], [200, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="${GREY}"/>`).join("")}${arrow("M290 70 V118", GREY, 3)}`),
  // Foucault: a long pendulum and the turning track on the floor
  "s-foucault": svg(`${line("M200 20 V190", INK, 3)}<circle cx="200" cy="200" r="16" fill="${INK}"/>
    <ellipse cx="200" cy="250" rx="150" ry="34" fill="${WHITE}" stroke="${GREY}" stroke-width="3"/>
    ${[0, 30, 60, 90, 120, 150].map((a) => { const r = (a * Math.PI) / 180, x = 140 * Math.cos(r), y = 30 * Math.sin(r); return line(`M${(200 - x).toFixed(1)} ${(250 - y).toFixed(1)} L${(200 + x).toFixed(1)} ${(250 + y).toFixed(1)}`, a === 150 ? ACCENT : GREY, a === 150 ? 4 : 2); }).join("")}
    ${arrow("M330 222 Q360 236 340 262", ACCENT, 4)}`),
  // Michelson-Morley: light split by a half mirror into two arms and brought together again
  "s-michelson-morley": svg(`<rect x="30" y="134" width="40" height="32" rx="4" fill="${INK}"/><rect x="186" y="110" width="8" height="80" fill="${GREY}" transform="rotate(45 190 150)"/>
    <rect x="182" y="22" width="16" height="12" fill="${INK}"/><rect x="346" y="142" width="12" height="16" fill="${INK}"/><rect x="176" y="262" width="28" height="18" rx="3" fill="${INK}"/>
    ${line("M70 150 H190", ACCENT, 4)}${line("M190 150 V36", ACCENT, 4)}${line("M190 150 H344", ACCENT, 4)}${arrow("M190 160 V256", ACCENT, 4)}
    ${line("M120 150 m-6 -6 l6 6 l-6 6", ACCENT, 3)}`),
  // Young: light through two slits, waves spreading, bright and dark stripes on the screen
  "s-doppelspalt": svg(`<circle cx="50" cy="150" r="18" fill="${GOLD}"/>${[1, 2, 3].map((i) => `<path d="M${60 + i * 20} ${150 - 40} q14 40 0 80" stroke="${GREY}" stroke-width="3" fill="none"/>`).join("")}
    <rect x="160" y="40" width="10" height="90" fill="${INK}"/><rect x="160" y="140" width="10" height="20" fill="${INK}"/><rect x="160" y="170" width="10" height="90" fill="${INK}"/>
    ${[1, 2, 3, 4].map((i) => `<path d="M${170 + i * 24} ${135 - i * 18} a${i * 24} ${i * 24} 0 0 1 0 ${i * 30}" stroke="${GREY}" stroke-width="2" fill="none"/><path d="M${170 + i * 24} ${165 - i * 12} a${i * 24} ${i * 24} 0 0 1 0 ${i * 30}" stroke="${GREY}" stroke-width="2" fill="none"/>`).join("")}
    <rect x="320" y="40" width="40" height="220" fill="${INK}"/>${[60, 92, 124, 150, 176, 208, 240].map((y, i) => `<rect x="320" y="${y - 8}" width="40" height="${i === 3 ? 20 : 12}" fill="${i === 3 ? "#fff3c4" : GOLD}" fill-opacity="${1 - Math.abs(i - 3) * 0.22}"/>`).join("")}`),
  // Endowment: the same mug – the owner's price stack is far taller than the buyer's
  "s-besitztum": svg(`<g transform="translate(200 150)"><rect x="-30" y="-34" width="60" height="70" rx="8" fill="${WHITE}" stroke="${INK}" stroke-width="4"/><path d="M30 -16 h12 a12 12 0 0 1 0 24 h-12" fill="none" stroke="${INK}" stroke-width="4"/></g>
    ${person(70, 280, 0.8, "ink")}${person(330, 280, 0.8, "grey")}
    ${Array.from({ length: 7 }, (_, i) => `<ellipse cx="120" cy="${250 - i * 14}" rx="18" ry="6" fill="${ACCENT}" stroke="${INK}" stroke-width="2"/>`).join("")}
    ${Array.from({ length: 3 }, (_, i) => `<ellipse cx="280" cy="${250 - i * 14}" rx="18" ry="6" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>`).join("")}`),
};

const DATA = "content/studies.json";
const rows = JSON.parse(fs.readFileSync(DATA, "utf8"));
for (const [id, s] of Object.entries(drawings)) {
  const row = rows.find((r) => r.id === id);
  if (!row) throw new Error(`no study ${id}`);
  fs.writeFileSync(`public/img/studies/${id}.svg`, s.replace(/\n\s*/g, ""));
  if (row.image_url && row.image_url.endsWith(".webp")) fs.rmSync(`public${row.image_url}`, { force: true }); // the photo it replaces
  row.image_url = `/img/studies/${id}.svg`;
  row.image_credit = "Zeichnung: Wunder";
  delete row.image_source;
}
fs.writeFileSync(DATA, JSON.stringify(rows, null, 2) + "\n");
console.log(`${Object.keys(drawings).length} drawings written; studies with a photo: ${rows.filter((r) => r.image_url?.endsWith(".webp")).length}`);
