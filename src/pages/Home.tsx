import { useEffect, useState } from "react";
import { Link } from "wouter";
import { api, fmtDate, type Registration } from "../api";
import { Seal } from "../App";

export default function Home() {
  const [regs, setRegs] = useState<Registration[] | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    document.title = "EverVerify — the public registry of authentic creations";
    api.registryRecent().then((d) => { setRegs(d.registrations || []); setCount(d.count ?? 0); }).catch(() => { setRegs([]); setCount(0); });
  }, []);

  return (
    <main>
      {/* hero */}
      <section className="hero">
        <div className="container">
          <span className="eyebrow">The public registry of authentic creations</span>
          <h1>Proof of what's real — <em>and what's AI.</em></h1>
          <p className="lede">
            EverVerify gives every creation a permanent public record: who made it, when, whether it's
            AI-generated, and that it hasn't been altered since. Proof set at the moment of creation — not a guess.
          </p>
          <div className="cta">
            <Link href="/register" className="btn btn-gold">Register your work — free</Link>
            <Link href="/verify" className="btn btn-ghost">Verify a creation</Link>
          </div>
        </div>
      </section>

      {/* registry feed */}
      <section className="section">
        <div className="container">
          <div className="kicker">The registry</div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <h2>The wall of the real.</h2>
            <div className="statbar">
              <div className="stat"><span className="n">{count === null ? "—" : count.toLocaleString()}</span><span className="l">creations verified</span></div>
            </div>
          </div>

          {regs === null ? (
            <div className="loading">Loading the registry…</div>
          ) : regs.length === 0 ? (
            <div className="empty-state">
              <div className="big">The registry is brand new.</div>
              <p>Be the first to put a provably-authentic creation on the public record.</p>
              <Link href="/register" className="btn btn-gold" style={{ marginTop: 14 }}>Register the first creation</Link>
            </div>
          ) : (
            <div className="feed">
              {regs.slice(0, 12).map((r) => (
                <Link key={r.receipt_id} href={`/r/${r.receipt_id}`} className="tile">
                  {r.thumb_url ? <img className="ph" src={r.thumb_url} alt={r.title || "creation"} loading="lazy" /> : <div className="ph empty">no preview</div>}
                  <span className="sl"><Seal size={15} /></span>
                  <div className="meta">
                    <div className="o">{r.owner || "Anonymous"}</div>
                    <div className="d">{fmtDate(r.created_at)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* what we prove */}
      <section className="section">
        <div className="container">
          <div className="kicker">What EverVerify proves</div>
          <h2>Proof by registration — not detection.</h2>
          <div className="cards">
            <div className="card"><h3>Provably AI — and disclosed</h3><p>Every image and video created with GenieMade is registered as verifiably AI-generated — with the model and the moment it was made. The honest, compliance-ready way to publish AI content.</p></div>
            <div className="card"><h3>Authentic &amp; yours</h3><p>Register any creation and get a tamper-evident public record of who registered it and when — your timestamped proof of ownership, and evidence it hasn't been altered since.</p></div>
            <div className="card"><h3>We prove — we don't guess</h3><p>EverVerify tells you what's on the record. It doesn't scan a random file and pretend to "detect" AI — those tools analyze after the fact and are often wrong. Our proof is set at creation, so it's certain.</p></div>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="section">
        <div className="container">
          <div className="kicker">How it works</div>
          <h2>Three steps. Provable forever.</h2>
          <div className="steps">
            <div className="step"><div className="n">1</div><h3>Register</h3><p>Add an image or video — or create it in GenieMade, where it's registered automatically. Free.</p></div>
            <div className="step"><div className="n">2</div><h3>Get your record</h3><p>A permanent public certificate: who made it, when, a cryptographic fingerprint, and the EverVerify seal.</p></div>
            <div className="step"><div className="n">3</div><h3>Verify anywhere</h3><p>Anyone can confirm it's authentic and yours — and unlike buried metadata, the proof survives screenshots and re-uploads.</p></div>
          </div>
        </div>
      </section>

      {/* mission strip */}
      <section className="section">
        <div className="container">
          <div className="mission">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}><Seal size={20} /><b style={{ fontFamily: "var(--serif)", fontSize: 18 }}>A registry with a mission.</b></div>
            <p>EverVerify is a <b>public-benefit service of Hope Training Academy</b>, a 501(c)(3) charity that trains underserved people for living-wage tech careers. The people it trains help run the registry — so every verification supports real jobs and real training.</p>
            <p style={{ marginTop: 10 }}><Link href="/about">Read the mission →</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}
