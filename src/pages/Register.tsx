import { useEffect } from "react";
import { Seal } from "../App";

const GENIE = "https://geniemadeit.com/app";

export default function Register() {
  useEffect(() => { document.title = "Register your work — free · EverVerify"; }, []);
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <span className="eyebrow">Register — free</span>
      <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(30px,5vw,46px)", fontWeight: 600, margin: ".3em 0 .12em" }}>Put your work on the record.</h1>
      <p className="muted" style={{ maxWidth: "58ch" }}>Registration is free and always will be — volume is what makes the registry trustworthy. Here's how to get your creations on it.</p>

      <div className="cards">
        <div className="card">
          <div className="seal-badge" style={{ marginBottom: 10 }}><Seal size={18} /></div>
          <h3>Create it in GenieMade</h3>
          <p>Every image and video you make in GenieMade is sealed and registered to EverVerify automatically — the moment it's created. This is the fastest path.</p>
          <a href={GENIE} className="btn btn-gold btn-sm" style={{ marginTop: 14 }}>Create &amp; auto-register →</a>
        </div>
        <div className="card">
          <div className="seal-badge" style={{ marginBottom: 10 }}><Seal size={18} /></div>
          <h3>Bring your own work</h3>
          <p>Already have images or videos? Sign in to fingerprint and register them to the public record. <span className="gold">(Direct upload here is rolling out — for now, register through your GenieMade account.)</span></p>
          <a href={GENIE} className="btn btn-ghost btn-sm" style={{ marginTop: 14 }}>Sign in to register →</a>
        </div>
      </div>

      <section className="section">
        <div className="kicker">Why register</div>
        <h2>Free proof that's yours to point to.</h2>
        <div className="cards">
          <div className="card"><h3>Prove authorship</h3><p>A public certificate that shows you made it and when — the evidence marketplaces and platforms increasingly ask for.</p></div>
          <div className="card"><h3>Fight theft &amp; fakes</h3><p>Disprove impersonators and stolen re-posts with an independent record that survives screenshots.</p></div>
          <div className="card"><h3>Support the mission</h3><p>The registry is run by people Hope Training Academy is lifting into tech careers. Registering helps fund that.</p></div>
        </div>
      </section>
    </main>
  );
}
