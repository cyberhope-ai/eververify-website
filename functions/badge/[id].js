// Embeddable "Verified by EverVerify" badge, served as an SVG per record. Every site that embeds it links
// back to the record's page on eververify.org — so the badge is the automated backlink engine (the JibJab
// share-loop, but for provenance). URL: /badge/<receipt_id>.svg  (the .svg suffix is optional).
const ENGINE = "https://geniemade-engine.cyberhopeai.workers.dev";

function esc(s) {
  return String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}

export async function onRequestGet(context) {
  const id = String(context.params.id || "").replace(/\.svg$/i, "");
  let verified = false;
  try {
    const r = await fetch(`${ENGINE}/api/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ receipt_id: id }),
    });
    const d = await r.json();
    verified = !!(d.verified || d.verdict === "registered" || d.verdict === "authentic");
  } catch (e) { /* fall through to unverified styling */ }

  const accent = verified ? "#f5c451" : "#8f7fbb";
  const status = verified ? "Verified" : "Unverified";
  const W = 196, H = 44;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(status)} by EverVerify">` +
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="9" fill="#130b1e" stroke="#332a52"/>` +
    `<g transform="translate(13,10)">` +
    `<path d="M12 1l2.4 1.7 2.9-.2 1 2.7 2.4 1.6-.6 2.9 1 2.7-2 2.1.1 2.9-2.8.9-1.6 2.4-2.8-.7-2.8.7-1.6-2.4-2.8-.9.1-2.9-2-2.1 1-2.7-.6-2.9L3.7 5.2l1-2.7 2.9.2z" fill="none" stroke="${accent}" stroke-width="1.2"/>` +
    `<path d="M8 12l2.3 2.3 4.7-4.7" fill="none" stroke="${accent}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</g>` +
    `<text x="46" y="19" fill="#f7f1ff" font-family="ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif" font-size="13" font-weight="700">${esc(status)}</text>` +
    `<text x="46" y="34" fill="#a99fc6" font-family="ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif" font-size="11">by EverVerify</text>` +
    `</svg>`;

  return new Response(svg, {
    headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=600" },
  });
}
