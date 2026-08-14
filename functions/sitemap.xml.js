// Dynamic sitemap for eververify.org — static pages + EVERY public registry record (/r/<id>).
// Cloudflare Pages Function: serves GET /sitemap.xml. Pages through the engine's registry feed so the
// sitemap grows automatically with the registry (the SEO flywheel). Single-file cap ~40k (sitemap limit
// is 50k); when the public registry approaches that, upgrade to a sitemap index + paginated children.
const ENGINE = "https://geniemade-engine.cyberhopeai.workers.dev";
const SITE = "https://eververify.org";
const STATIC = [
  { p: "/", changefreq: "daily", priority: "1.0" },
  { p: "/verify", changefreq: "weekly", priority: "0.8" },
  { p: "/register", changefreq: "weekly", priority: "0.7" },
  { p: "/about", changefreq: "monthly", priority: "0.5" },
];

function xmlEscape(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}

export async function onRequestGet() {
  const urls = STATIC.map((s) => ({ loc: SITE + s.p, changefreq: s.changefreq, priority: s.priority }));
  let cursor = null, guard = 0;
  try {
    do {
      const u = new URL(ENGINE + "/api/registry/feed");
      u.searchParams.set("limit", "100");
      if (cursor) u.searchParams.set("cursor", cursor);
      const r = await fetch(u.toString(), { headers: { accept: "application/json" } });
      if (!r.ok) break;
      const d = await r.json();
      for (const reg of d.registrations || []) {
        urls.push({
          loc: `${SITE}/r/${reg.receipt_id}`,
          lastmod: (reg.created_at || "").slice(0, 10) || undefined,
          changefreq: "monthly",
          priority: "0.7",
        });
      }
      cursor = d.next_cursor;
      guard++;
    } while (cursor && guard < 500 && urls.length < 45000);
  } catch (e) {
    /* serve whatever we've gathered rather than 500 the sitemap */
  }
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url><loc>${xmlEscape(u.loc)}</loc>` +
          (u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : "") +
          `<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
      )
      .join("\n") +
    `\n</urlset>\n`;
  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
