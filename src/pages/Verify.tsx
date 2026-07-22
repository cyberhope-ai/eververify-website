import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { api, fmtDate, sha256Hex, type VerifyResult } from "../api";
import { Seal } from "../App";

export default function Verify() {
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<VerifyResult | null>(null);
  const [note, setNote] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = "Verify a creation — EverVerify"; }, []);

  async function run(body: { receipt_id?: string; hash?: string }, label: string) {
    setBusy(true); setRes(null); setNote(label);
    try { setRes(await api.verify(body)); }
    catch { setRes({ ok: false, verdict: "error" }); }
    setBusy(false);
  }

  const isAuthentic = res && (res.verified || res.verdict === "authentic" || res.verdict === "registered");

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <span className="eyebrow">Verify</span>
      <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(30px,5vw,44px)", fontWeight: 600, margin: ".3em 0 .1em" }}>Is it authentic?</h1>
      <p className="muted" style={{ maxWidth: "56ch" }}>Check any creation against the registry. Paste a receipt ID, or drop a file — the file is fingerprinted in your browser and never uploaded.</p>

      <div className="vbox">
        <div className="vrow">
          <input className="input" placeholder="Receipt ID (e.g. a UUID from a certificate)" value={id} onChange={(e) => setId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && id.trim() && run({ receipt_id: id.trim() }, "receipt")} />
          <button className="btn btn-cyan" disabled={!id.trim() || busy} onClick={() => run({ receipt_id: id.trim() }, "receipt")}>{busy ? "Checking…" : "Verify"}</button>
        </div>
        <div className="drop" onClick={() => fileRef.current?.click()}>
          <Seal size={22} /><br />Drop an image or video here, or <b style={{ color: "var(--cyan)" }}>choose a file</b> to check by its fingerprint
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            setBusy(true); setRes(null); setNote("file");
            try { const h = await sha256Hex(f); await run({ hash: h }, "file"); } catch { setBusy(false); }
          }} />
        </div>

        {res && (
          <div className={"result " + (isAuthentic ? "ok" : "no")}>
            <div className="verdict">{isAuthentic ? <><Seal size={22} /> Authentic &amp; on the registry</> : <>Not found on the registry</>}</div>
            {isAuthentic ? (
              <dl className="kv">
                {res.registration?.owner && (<><dt>Owner</dt><dd>{res.registration.owner}</dd></>)}
                {(res.registration?.registered_at || res.certificate?.issued_at) && (<><dt>Registered</dt><dd>{fmtDate(res.registration?.registered_at || res.certificate?.issued_at)}</dd></>)}
                {res.certificate?.hash && (<><dt>Fingerprint</dt><dd className="mono">{res.certificate.hash.slice(0, 32)}…</dd></>)}
                {res.anchor?.status && (<><dt>Blockchain</dt><dd>{res.anchor.chain || "anchor"} · {res.anchor.status}</dd></>)}
                {res.certificate?.receipt_id && (<><dt>Record</dt><dd><Link href={`/r/${res.certificate.receipt_id}`}>View public record →</Link></dd></>)}
              </dl>
            ) : (
              <p className="muted" style={{ margin: "10px 0 0" }}>
                {note === "file" ? "This exact file isn't registered on EverVerify. If it should be, register it — free." : "No registry record matches that ID."}{" "}
                <Link href="/register">Register it →</Link>
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
