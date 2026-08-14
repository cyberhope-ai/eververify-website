import { useEffect } from "react";
import { Link } from "wouter";
import { LANDING_MAP } from "../landings";
import { Seal } from "../App";

function setMeta(name: string, content: string) {
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
  el.setAttribute("content", content);
}
function setOG(prop: string, content: string) {
  let el = document.head.querySelector(`meta[property="${prop}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); }
  el.setAttribute("content", content);
}
function setJsonLd(obj: unknown | null) {
  let el = document.head.querySelector('script[data-ld="landing"]');
  if (obj) {
    if (!el) { el = document.createElement("script"); el.setAttribute("type", "application/ld+json"); el.setAttribute("data-ld", "landing"); document.head.appendChild(el); }
    el.textContent = JSON.stringify(obj);
  } else if (el) { el.remove(); }
}

export default function Landing({ path }: { path: string }) {
  const l = LANDING_MAP[path];

  useEffect(() => {
    if (!l) { document.title = "Not found — EverVerify"; return; }
    const url = `https://eververify.org/${l.path}`;
    document.title = l.title;
    setMeta("description", l.description);
    setOG("og:title", l.title);
    setOG("og:description", l.description);
    setOG("og:type", "article");
    setOG("og:url", url);
    setJsonLd({
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Article", headline: l.h1, description: l.description, url, publisher: { "@type": "Organization", name: "EverVerify", url: "https://eververify.org" } },
        { "@type": "FAQPage", mainEntity: l.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      ],
    });
    return () => setJsonLd(null);
  }, [l]);

  if (!l) return (
    <main className="container" style={{ padding: "80px 0" }}>
      <h2 style={{ fontFamily: "var(--serif)" }}>Not found</h2>
      <Link href="/">← Back to the registry</Link>
    </main>
  );

  return (
    <main className="container" style={{ padding: "44px 0", maxWidth: 780 }}>
      <span className="eyebrow">{l.eyebrow}</span>
      <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(28px,5vw,44px)", fontWeight: 600, margin: ".28em 0 .3em", lineHeight: 1.08 }}>{l.h1}</h1>
      <p className="lede" style={{ fontSize: 18, color: "var(--text)" }}>{l.intro}</p>

      <div style={{ margin: "22px 0 8px" }}>
        <Link href={l.cta.href} className="btn btn-gold">{l.cta.label}</Link>
      </div>

      {l.sections.map((s, i) => (
        <section key={i} style={{ marginTop: 26 }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 22 }}>{s.h}</h2>
          <p className="muted" style={{ fontSize: 15.5, color: "var(--text)" }}>{s.p}</p>
        </section>
      ))}

      <section style={{ marginTop: 34 }}>
        <div className="kicker">FAQ</div>
        <h2 style={{ fontFamily: "var(--serif)" }}>Common questions</h2>
        <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
          {l.faqs.map((f, i) => (
            <div key={i} className="card">
              <h3 style={{ marginTop: 0, fontSize: 16 }}>{f.q}</h3>
              <p className="muted" style={{ margin: "6px 0 0", fontSize: 14.5 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mission" style={{ marginTop: 34, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Seal size={20} /><b style={{ fontFamily: "var(--serif)", fontSize: 17 }}>Proof, not a guess.</b></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/verify" className="btn btn-ghost btn-sm">Verify a file</Link>
          <Link href="/register" className="btn btn-gold btn-sm">Register — free</Link>
        </div>
      </div>
    </main>
  );
}
