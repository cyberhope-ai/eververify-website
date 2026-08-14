import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { api, sha256Hex } from "../api";
import { useAuth } from "../auth";
import { Seal } from "../App";

const GENIE = "https://geniemadeit.com/app";

// ~1024px JPEG thumbnail (data URL) for the registry card — images only; the file itself is never uploaded.
function makeThumb(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) return resolve(undefined);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1024, s = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * s)), h = Math.max(1, Math.round(img.height * s));
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d")?.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try { resolve(c.toDataURL("image/jpeg", 0.85)); } catch { resolve(undefined); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(undefined); };
    img.src = url;
  });
}

type Done = { receipt_id: string; already: boolean };

export default function Register() {
  const { user, ready } = useAuth();
  useEffect(() => { document.title = "Register your work — free · EverVerify"; }, []);

  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState("");
  const [thumb, setThumb] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hashing, setHashing] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  async function onPick(f: File) {
    setErr(""); setDone(null); setFile(f); setHashing(true);
    setTitle(f.name.replace(/\.[^.]+$/, ""));
    try {
      const [h, t] = await Promise.all([sha256Hex(f), makeThumb(f)]);
      setHash(h); setThumb(t);
    } catch { setErr("Couldn't read that file — try another."); }
    finally { setHashing(false); }
  }

  async function register() {
    if (!hash) return;
    setBusy(true); setErr("");
    try {
      const d = await api.register({ hash, title: title.slice(0, 140), is_public: isPublic, thumbnail: thumb });
      const rid = d.receipt_id || d.registration?.receipt_id;
      if (rid) setDone({ receipt_id: rid, already: !!d.already_registered });
      else if (d.error === "already_registered") setErr("This exact file was already registered by someone else — the first registration stands.");
      else setErr(d.message || "Registration failed — please try again.");
    } catch { setErr("Network error — please try again."); }
    finally { setBusy(false); }
  }

  function reset() { setFile(null); setHash(""); setThumb(undefined); setTitle(""); setDone(null); setErr(""); }

  const gate = ready && !user;

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <span className="eyebrow">Register — free</span>
      <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(30px,5vw,46px)", fontWeight: 600, margin: ".3em 0 .12em" }}>Put your work on the record.</h1>
      <p className="muted" style={{ maxWidth: "58ch" }}>Register any image or video to the public registry — free. We fingerprint the file <b>on your device</b> and record only the fingerprint, so your file never leaves your hands.</p>

      {/* the register widget */}
      <div className="card" style={{ marginTop: 22, maxWidth: 640 }}>
        {gate ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div className="seal-badge" style={{ marginBottom: 10 }}><Seal size={18} /></div>
            <h3>Sign in to register</h3>
            <p className="muted" style={{ margin: "6px 0 14px" }}>Registration is tied to your account, so it's provably yours. One account works across EverVerify and GenieMade.</p>
            <Link href="/account" className="btn btn-gold btn-sm">Sign in / create a free account</Link>
          </div>
        ) : done ? (
          <div style={{ textAlign: "center", padding: "6px 0" }}>
            <div className="big-verdict" style={{ justifyContent: "center" }}><span className="seal-badge"><Seal size={20} /></span> {done.already ? "Already yours" : "Registered"}</div>
            <p className="muted" style={{ margin: "10px 0 16px" }}>{done.already ? "You'd already registered this file — here's its record." : "Your file is on the public registry, provably yours as of now."}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href={`/r/${done.receipt_id}`} className="btn btn-gold btn-sm">View the record →</Link>
              <button className="btn btn-ghost btn-sm" onClick={reset}>Register another</button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="drop"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) onPick(e.dataTransfer.files[0]); }}
              style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: "26px 18px", textAlign: "center", cursor: "pointer" }}
            >
              {file ? (
                <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
                  {thumb && <img src={thumb} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />}
                  <div style={{ textAlign: "left", minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</div>
                    <div className="muted mono" style={{ fontSize: 12 }}>{hashing ? "fingerprinting…" : hash ? hash.slice(0, 24) + "…" : ""}</div>
                  </div>
                </div>
              ) : (
                <><div style={{ fontSize: 26 }}>🔒</div><div style={{ fontWeight: 600, marginTop: 4 }}>Choose or drop an image or video</div><div className="muted" style={{ fontSize: 13 }}>Fingerprinted on your device — never uploaded</div></>
              )}
            </div>
            <input ref={fileInput} type="file" accept="image/*,video/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />

            {hash && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (shown on the certificate)" />
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--muted)", cursor: "pointer" }}>
                  <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                  List this on the public registry (uncheck to keep it private — still provable, just not shown publicly)
                </label>
                {err && <div style={{ color: "#ffb4c1", fontSize: 14 }}>{err}</div>}
                <button className="btn btn-gold" onClick={register} disabled={busy || hashing}>{busy ? "Registering…" : "Register this file — free"}</button>
              </div>
            )}
            {err && !hash && <div style={{ color: "#ffb4c1", fontSize: 14, marginTop: 10 }}>{err}</div>}
          </>
        )}
      </div>

      <div className="cards" style={{ marginTop: 26 }}>
        <div className="card">
          <div className="seal-badge" style={{ marginBottom: 10 }}><Seal size={18} /></div>
          <h3>Or create it in GenieMade</h3>
          <p>Every image and video you make in GenieMade is sealed and registered to EverVerify automatically — the moment it's created.</p>
          <a href={GENIE} className="btn btn-ghost btn-sm" style={{ marginTop: 14 }}>Create &amp; auto-register →</a>
        </div>
        <div className="card"><h3>Prove authorship</h3><p>A public certificate that shows you made it and when — the evidence marketplaces and platforms increasingly ask for.</p></div>
        <div className="card"><h3>Support the mission</h3><p>The registry is run by people Hope Training Academy is lifting into tech careers. Registering helps fund that.</p></div>
      </div>
    </main>
  );
}
