import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { api, auth, assetUrl, fmtDate, type EvUser, type MineRow } from "../api";
import { useAuth } from "../auth";
import { Seal } from "../App";

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => unknown; remove: (id: unknown) => void }; }
}
const TURNSTILE_SITEKEY = "0x4AAAAAAELcSNe5KdmNBXR9";

function errMsg(code?: string): string {
  switch (code) {
    case "bad_credentials": return "That email and password don't match.";
    case "email_exists": return "An account with that email already exists — try signing in.";
    case "invalid_input": return "Enter a valid email and a password of at least 8 characters.";
    case "human_check_failed": return "Please complete the human check and try again.";
    default: return "";
  }
}

export default function Account() {
  const { user, ready, setUser, signOut } = useAuth();
  useEffect(() => { document.title = "Your account — EverVerify"; }, []);
  if (!ready) return <main className="container" style={{ padding: "60px 0" }}><div className="loading">Loading…</div></main>;
  return user ? <MyRegistry user={user} signOut={signOut} /> : <SignIn onAuthed={setUser} />;
}

function SignIn({ onAuthed }: { onAuthed: (u: EvUser) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [tsToken, setTsToken] = useState("");
  const tsRef = useRef<HTMLDivElement | null>(null);

  // load + render the Turnstile widget only for signup
  useEffect(() => {
    if (mode !== "signup") return;
    let widgetId: unknown = null;
    const render = () => {
      if (window.turnstile && tsRef.current) {
        tsRef.current.innerHTML = "";
        widgetId = window.turnstile.render(tsRef.current, { sitekey: TURNSTILE_SITEKEY, callback: (t: string) => setTsToken(t) });
      }
    };
    if (window.turnstile) render();
    else {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true; s.defer = true; s.onload = render;
      document.head.appendChild(s);
    }
    return () => { try { if (widgetId != null && window.turnstile) window.turnstile.remove(widgetId); } catch { /* ignore */ } };
  }, [mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const d = mode === "login" ? await auth.login(email.trim(), pw) : await auth.signup(email.trim(), pw, tsToken);
      if (d.ok && d.user) onAuthed(d.user);
      else setErr(d.detail || errMsg(d.error) || "Something went wrong — please try again.");
    } catch { setErr("Network error — please try again."); }
    finally { setBusy(false); }
  }

  return (
    <main className="container" style={{ maxWidth: 460, padding: "56px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 6 }}><Seal size={26} /></div>
      <h1 style={{ fontFamily: "var(--serif)", textAlign: "center", fontSize: 30 }}>{mode === "login" ? "Sign in" : "Create your account"}</h1>
      <p className="muted" style={{ textAlign: "center", marginBottom: 22 }}>
        One account across EverVerify and GenieMade — {mode === "login" ? "welcome back." : "free, forever."}
      </p>
      <form onSubmit={submit} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input className="input" type="email" placeholder="Email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder={mode === "login" ? "Password" : "Password (8+ characters)"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} />
        {mode === "signup" && <div ref={tsRef} style={{ minHeight: 65 }} />}
        {err && <div style={{ color: "#ffb4c1", fontSize: 14 }}>{err}</div>}
        <button className="btn btn-gold" type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="muted" style={{ textAlign: "center", marginTop: 16, fontSize: 14 }}>
        {mode === "login" ? (
          <>New here? <button className="linklike" onClick={() => { setMode("signup"); setErr(""); }}>Create a free account</button></>
        ) : (
          <>Already have an account? <button className="linklike" onClick={() => { setMode("login"); setErr(""); }}>Sign in</button></>
        )}
      </p>
    </main>
  );
}

function MyRegistry({ user, signOut }: { user: EvUser; signOut: () => void }) {
  const [rows, setRows] = useState<MineRow[] | null>(null);
  const [busyId, setBusyId] = useState("");

  useEffect(() => { api.registryMine().then((d) => setRows(d.registrations || [])).catch(() => setRows([])); }, []);

  async function toggle(r: MineRow) {
    setBusyId(r.receipt_id);
    try {
      const d = await api.registryPublish(r.receipt_id, !r.is_public);
      if (d.ok) setRows((rs) => (rs || []).map((x) => (x.receipt_id === r.receipt_id ? { ...x, is_public: !!d.is_public } : x)));
    } catch { /* ignore */ }
    setBusyId("");
  }

  return (
    <main className="container" style={{ padding: "44px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: "50%" }} /> : <span className="seal-badge"><Seal size={22} /></span>}
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 22 }}>{user.display_name || user.email}</div>
            <div className="muted" style={{ fontSize: 13 }}>{user.email}{user.plan ? ` · ${user.plan} plan` : ""}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign out</button>
      </div>

      <div className="kicker" style={{ marginTop: 34 }}>My registry</div>
      <h2 style={{ fontFamily: "var(--serif)" }}>Everything you've registered.</h2>
      <p className="muted">Toggle any record public or private, and open its public page or certificate.</p>

      {rows === null ? (
        <div className="loading">Loading your records…</div>
      ) : rows.length === 0 ? (
        <div className="empty-state">
          <div className="big">No records yet.</div>
          <p>Anything you create on GenieMade is registered here automatically — or register a file directly.</p>
          <Link href="/register" className="btn btn-gold" style={{ marginTop: 14 }}>Register a creation</Link>
        </div>
      ) : (
        <ul style={{ listStyle: "none", margin: "18px 0", padding: 0 }}>
          {rows.map((r) => (
            <li key={r.receipt_id} style={{ display: "grid", gridTemplateColumns: "56px 1fr auto", gap: 14, alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--border)" }}>
              {r.thumb_url ? <img src={assetUrl(r.thumb_url)} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }} /> : <div style={{ width: 56, height: 56, borderRadius: 10, background: "var(--panel2)" }} />}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title || "Untitled creation"}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  {fmtDate(r.created_at)} · <Link href={`/r/${r.receipt_id}`}>View record →</Link>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={"pill" + (r.is_public ? " good" : "")}>{r.is_public ? "Public" : "Private"}</span>
                <button className="btn btn-ghost btn-sm" disabled={busyId === r.receipt_id} onClick={() => toggle(r)}>
                  {busyId === r.receipt_id ? "…" : r.is_public ? "Make private" : "Make public"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
