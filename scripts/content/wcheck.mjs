// node wcheck.mjs "lang|Title|regex" ... – prints the first match of regex in each article (slowly, to respect the API)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const spec of process.argv.slice(2)) {
  const [lang, title, ...re] = spec.split("|");
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&format=json&titles=${encodeURIComponent(title)}`;
  let out = "";
  try {
    const j = await (await fetch(url, { headers: { "User-Agent": "WunderContentCheck/1.0 (https://github.com/yeccard68-prog/wunder)" } })).json();
    const p = Object.values(j.query.pages)[0];
    const t = (p.extract || "").replace(/\n+/g, " ");
    const m = new RegExp(re.join("|"), "i").exec(t);
    out = `${p.title} | ` + (m ? "…" + t.slice(Math.max(0, m.index - 140), m.index + 170) + "…" : p.extract ? "(no match)" : "MISSING");
  } catch (e) { out = `${title} | error`; }
  console.log("==", out);
  await sleep(1500);
}
