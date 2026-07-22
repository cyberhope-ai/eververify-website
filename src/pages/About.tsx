import { useEffect } from "react";
import { Link } from "wouter";
import { Seal } from "../App";

export default function About() {
  useEffect(() => { document.title = "About — EverVerify"; }, []);
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <span className="eyebrow">About</span>
      <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(30px,5vw,46px)", fontWeight: 600, margin: ".3em 0 .12em" }}>A neutral registry, <span className="gold">for the public good.</span></h1>
      <p className="muted" style={{ maxWidth: "62ch", fontSize: 18 }}>
        EverVerify exists to answer one question the internet can no longer answer on its own: <em style={{ color: "var(--gold)", fontStyle: "italic" }}>is this real, and is it theirs?</em>
      </p>

      <section className="section">
        <div className="kicker">What we are</div>
        <h2>The record everyone can check.</h2>
        <p className="muted" style={{ maxWidth: "64ch" }}>
          As AI makes anything fakeable, proof of authenticity becomes essential — and increasingly, legally required.
          EverVerify is a <b style={{ color: "var(--text)" }}>free, neutral, public registry</b> where images and videos are
          authenticated and made verifiable forever. We don't compete to make content; we're the independent place that
          confirms it's real and whose it is. Neutrality is the point — it's what makes the record trustworthy to
          creators, marketplaces, and courts alike.
        </p>
      </section>

      <section className="section">
        <div className="kicker">How it's built</div>
        <h2>Three parts, one mission.</h2>
        <div className="cards">
          <div className="card"><h3>Hope Training Academy</h3><p>The 501(c)(3) charity that owns EverVerify as a public-benefit service — and trains the underserved people who help run it into living-wage tech careers.</p></div>
          <div className="card"><h3>The workforce</h3><p>Operating the registry is real, credentialed digital work. Donations fund the training and the jobs. The registry is the mission, made real.</p></div>
          <div className="card"><h3>CyberHopeAI</h3><p>Provides the technology — PrecognitionOS, with QSeal attestation and the QSurface registry ledger — that makes every record cryptographic and independently verifiable.</p></div>
        </div>
        <div className="mission" style={{ marginTop: 18 }}>
          <p style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--text)" }}>"The charity owns the trust. The company owns the tech. And the people the charity is lifting are the ones who run the registry."</p>
        </div>
      </section>

      <section className="section">
        <div className="kicker">The charity, in brief</div>
        <div className="cards">
          <div className="card"><h3>501(c)(3) public charity</h3><p>Video Game Palooza, Inc., d/b/a Hope Training Academy · EIN 46-4169197 · Indianapolis, IN.</p></div>
          <div className="card"><h3>2,000+ served since 2018</h3><p>A U.S. Department of Labor Registered Apprenticeship and community workforce partnerships.</p></div>
          <div className="card"><h3>Free to the public</h3><p>Registration and verification are free. Support the mission with an optional donation.</p></div>
        </div>
      </section>

      <section className="section center">
        <h2 style={{ fontFamily: "var(--serif)" }}>Put your work on the record.</h2>
        <p className="muted" style={{ maxWidth: "48ch", margin: "8px auto 0" }}>Free to register, free to verify, and every check supports someone building a new career.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
          <Link href="/register" className="btn btn-gold"><Seal size={16} /> Register free</Link>
          <Link href="/verify" className="btn btn-ghost">Verify a creation</Link>
        </div>
      </section>
    </main>
  );
}
