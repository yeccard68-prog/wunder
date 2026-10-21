// Cloudflare Pages Function for /clips/*: answers range requests ("bytes=0-99") with 206 Partial Content.
// Pages serves static files only as a whole, but Safari on iPhone/iPad needs ranges to play a video.
// Only used on the Cloudflare copy of the app (NEXT_PUBLIC_MEDIA_BASE); Vercel ignores this folder.
// Clips are small (≤ 3 MB), so the file is read once and the requested part cut out.

const withRanges = (res) => {
  const headers = new Headers(res.headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(res.body, { status: res.status, headers });
};

export async function onRequestHead({ request, env }) {
  return withRanges(await env.ASSETS.fetch(new Request(request.url, { method: "HEAD" })));
}

export async function onRequestGet({ request, env }) {
  const asset = await env.ASSETS.fetch(new Request(request.url));
  const range = request.headers.get("Range");
  if (!range || asset.status !== 200) return withRanges(asset);
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!m || (m[1] === "" && m[2] === "")) return withRanges(asset);
  const body = await asset.arrayBuffer();
  const size = body.byteLength;
  const start = m[1] === "" ? Math.max(0, size - Number(m[2])) : Number(m[1]);
  const end = m[1] === "" || m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes" } });
  }
  const headers = new Headers(asset.headers);
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  headers.set("Accept-Ranges", "bytes");
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(body.slice(start, end + 1), { status: 206, headers });
}
