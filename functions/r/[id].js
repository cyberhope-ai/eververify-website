// Serve the SPA shell for /r/<id> with per-record OpenGraph/Twitter/title injected SERVER-SIDE, so social
// unfurlers (which never run JS) and no-JS crawlers get a proper per-record card. The React app still loads
// and hydrates normally. Uses context.next() to pull the shell through the normal asset/_redirects pipeline,
// then rewrites the <head>. Any failure falls back to the untouched shell (never a blank page).
const ENGINE = "https://geniemade-engine.cyberhopeai.workers.dev";
const SITE = "https://eververify.org";

function esc(s) {
  return String(s).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
}

export async function onRequestGet(context) {
  const { params, next } = context;
  const id = String(params.id || "");

  // the SPA shell (index.html), via the normal pipeline (_redirects /* -> /index.html)
  const res = await next();
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("text/html")) return res;
  let html = await res.text();
  if (!html.includes("</head>")) return new Response(html, res);

  // defaults (unknown / not found)
  let title = "EverVerify record";
  let desc = "A verified creation on the EverVerify public registry — proof of what's real.";
  let image = `${SITE}/favicon.svg`;

  try {
    const r = await fetch(`${ENGINE}/api/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ receipt_id: id }),
    });
    const d = await r.json();
    const reg = d.registration || {};
    const authd = d.verified || d.verdict === "registered" || d.verdict === "authentic";
    if (authd) {
      const owner = reg.owner || "a creator";
      title = `${reg.title || "Verified creation"} — Verified on EverVerify`;
      desc = `Authenticity record for "${reg.title || "this creation"}" by ${owner} on the EverVerify public registry — cryptographic proof it's authentic and its owner's.`;
      const thumb = reg.thumb_url || (d.generation && d.generation.url);
      if (thumb) image = thumb.startsWith("http") ? thumb : ENGINE + thumb;
    }
  } catch (e) {
    /* keep generic defaults rather than error the page */
  }

  const url = `${SITE}/r/${id}`;
  const tags =
    `<title>${esc(title)}</title>` +
    `<meta name="description" content="${esc(desc)}">` +
    `<meta property="og:type" content="website">` +
    `<meta property="og:site_name" content="EverVerify">` +
    `<meta property="og:title" content="${esc(title)}">` +
    `<meta property="og:description" content="${esc(desc)}">` +
    `<meta property="og:url" content="${esc(url)}">` +
    `<meta property="og:image" content="${esc(image)}">` +
    `<meta name="twitter:card" content="summary_large_image">` +
    `<meta name="twitter:title" content="${esc(title)}">` +
    `<meta name="twitter:description" content="${esc(desc)}">` +
    `<meta name="twitter:image" content="${esc(image)}">`;

  html = html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, "")
    .replace(/<meta\s+name="description"[^>]*>/gi, "")
    .replace("</head>", tags + "</head>");

  const headers = new Headers(res.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "public, max-age=300");
  return new Response(html, { status: 200, headers });
}
