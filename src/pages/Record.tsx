import { useEffect, useState } from "react";
import { Link } from "wouter";
import { api, fmtDate, assetUrl, type VerifyResult } from "../api";
import { Seal } from "../App";

export default function Record({ id }: { id: string }) {
  const [res, setRes] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    document.title = "EverVerify record";
    setLoading(true);
    api.verify({ receipt_id: id }).then(setRes).catch(() => setRes({ ok: false })).finally(() => setLoading(false));
  }, [id]);

  const auth = !!(res && (res.verified || res.verdict === "authentic" || res.verdict === "registered"));
  const media = assetUrl(res?.generation?.url);
  const isVideo = res?.generation?.capability?.startsWith("video");
  const url = typeof window !== "undefined" ? window.location.href : "";

  function copy() {
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); });
  }

  async function downloadCert() {
    if (!res) return;
    const reg = res.registration || {};
    try {
      const { generateCertificate } = await import("../certificate");
      await generateCertificate({
        imageUrl: media,
        owner: reg.owner || "—",
        title: reg.title || null,
        date: reg.registered_at || res.certificate?.issued_at,
        hash: res.certificate?.hash || null,
        receiptId: id,
        verifyUrl: `https://eververify.org/r/${id}`,
        capability: res.generation?.capability,
      });
    } catch { /* ignore */ }
  }

  async function doReport() {
    const reason = window.prompt("Report this listing — what's wrong with it? (spam, stolen, abusive, etc.)");
    if (reason === null) return;
    try { await api.report(id, reason || "unspecified"); setReported(true); } catch { /* ignore */ }
  }

  if (loading) return <main className="container" style={{ padding: "60px 0" }}><div className="loading">Loading the record…</div></main>;

  if (!auth) return (
    <main className="container" style={{ padding: "60px 0" }}>
      <h1 style={{ fontFamily: "var(--serif)" }}>No record found</h1>
      <p className="muted">Nothing on the registry matches this ID.</p>
      <Link href="/verify" className="btn btn-ghost" style={{ marginTop: 12 }}>Try the verifier</Link>
    </main>
  );

  return (
    <main className="container" style={{ paddingTop: 34, paddingBottom: 40 }}>
      <Link href="/" className="muted" style={{ fontSize: 14 }}>← Registry</Link>
      <div className="record">
        <div className="media">
          {media ? (isVideo ? <video src={media} controls loop /> : <img src={media} alt={res?.registration?.title || "creation"} />) : <div style={{ aspectRatio: "1", display: "grid", placeItems: "center", color: "var(--muted)" }}>preview unavailable</div>}
        </div>
        <div>
          <div className="big-verdict"><span className="seal-badge"><Seal size={20} /></span> Verified</div>
          <p className="muted" style={{ marginTop: 8 }}>This creation is authenticated and on the EverVerify public registry.</p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0" }}>
            <span className="pill good">● Authentic</span>
            {res?.registration?.is_public !== false && <span className="pill">Public record</span>}
            {res?.anchor?.status && <span className="pill gold">⛓ {res.anchor.chain || "Anchored"} · {res.anchor.status}</span>}
          </div>

          <dl className="kv">
            {res?.registration?.title && (<><dt>Title</dt><dd>{res.registration.title}</dd></>)}
            {res?.registration?.owner && (<><dt>Owner</dt><dd>{res.registration.owner}</dd></>)}
            {(res?.registration?.registered_at || res?.certificate?.issued_at) && (<><dt>Registered</dt><dd>{fmtDate(res?.registration?.registered_at || res?.certificate?.issued_at)}</dd></>)}
            {res?.certificate?.hash && (<><dt>Fingerprint</dt><dd className="mono">{res.certificate.hash}</dd></>)}
            <dt>Receipt</dt><dd className="mono">{id}</dd>
          </dl>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
            <button className="btn btn-cyan btn-sm" onClick={copy}>{copied ? "Copied ✓" : "Copy shareable link"}</button>
            <button className="btn btn-ghost btn-sm" onClick={downloadCert}>Certificate (PDF)</button>
            <Link href="/verify" className="btn btn-ghost btn-sm">Verify another</Link>
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>Anyone can independently confirm this record — the proof is the fingerprint of the file itself, not removable metadata.</p>
          <p style={{ fontSize: 12, marginTop: 12 }}>
            {reported ? <span className="muted">Thanks — reported for review.</span> : <button onClick={doReport} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", textDecoration: "underline", font: "inherit", padding: 0 }}>Report this listing</button>}
          </p>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            Want provable work of your own? <a href="https://geniemadeit.com/app" target="_blank" rel="noreferrer">Create it on GenieMade ↗</a> — every creation is sealed and registered here automatically.
          </p>
        </div>
      </div>
    </main>
  );
}
