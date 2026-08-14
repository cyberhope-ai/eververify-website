import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { api, auth, assetUrl, fmtDate, type EvUser, type MineRow, type EvAddress, type ApiKey } from "../api";
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
  return user ? <Hub user={user} signOut={signOut} /> : <SignIn onAuthed={setUser} />;
}

/* ---------------- sign in / sign up ---------------- */
function SignIn({ onAuthed }: { onAuthed: (u: EvUser) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [tsToken, setTsToken] = useState("");
  const tsRef = useRef<HTMLDivElement | null>(null);

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
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const d = mode === "login" ? await auth.login(email.trim(), pw) : await auth.signup(email.trim(), pw, tsToken);
      if (d.ok && d.user) onAuthed(d.user);
      else setErr(d.detail || errMsg(d.error) || "Something went wrong — please try again.");
    } catch { setErr("Network error — please try again."); }
    finally { setBusy(false); }
  }

  return (
    <main className="container" style={{ maxWidth: 460, padding: "56px 0" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><Seal size={26} /></div>
      <h1 style={{ fontFamily: "var(--serif)", textAlign: "center", fontSize: 30 }}>{mode === "login" ? "Sign in" : "Create your account"}</h1>
      <p className="muted" style={{ textAlign: "center", marginBottom: 22 }}>One account across EverVerify and GenieMade — {mode === "login" ? "welcome back." : "free, forever."}</p>
      <form onSubmit={submit} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input className="input" type="email" placeholder="Email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder={mode === "login" ? "Password" : "Password (8+ characters)"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} />
        {mode === "signup" && <div ref={tsRef} style={{ minHeight: 65 }} />}
        {err && <div style={{ color: "#ffb4c1", fontSize: 14 }}>{err}</div>}
        <button className="btn btn-gold" type="submit" disabled={busy} style={{ width: "100%" }}>{busy ? "…" : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
      <p className="muted" style={{ textAlign: "center", marginTop: 16, fontSize: 14 }}>
        {mode === "login"
          ? <>New here? <button className="linklike" onClick={() => { setMode("signup"); setErr(""); }}>Create a free account</button></>
          : <>Already have an account? <button className="linklike" onClick={() => { setMode("login"); setErr(""); }}>Sign in</button></>}
      </p>
    </main>
  );
}

/* ---------------- signed-in hub ---------------- */
function Hub({ user, signOut }: { user: EvUser; signOut: () => void }) {
  const { refresh } = useAuth();
  const [tab, setTab] = useState<"registry" | "settings" | "keys">("registry");
  const tabBtn = (k: typeof tab, label: string) => (
    <button className={"tab" + (tab === k ? " active" : "")} onClick={() => setTab(k)}>{label}</button>
  );
  return (
    <main className="container" style={{ padding: "44px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user.avatar_url ? <img src={assetUrl(user.avatar_url)} alt="" style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover" }} /> : <span className="seal-badge"><Seal size={22} /></span>}
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 22 }}>{user.display_name || user.email}</div>
            <div className="muted" style={{ fontSize: 13 }}>{user.email}{user.plan ? ` · ${user.plan} plan` : ""}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign out</button>
      </div>

      <div className="tabs" style={{ margin: "26px 0 4px" }}>
        {tabBtn("registry", "My registry")}
        {tabBtn("settings", "Settings")}
        {tabBtn("keys", "API keys")}
      </div>

      {tab === "registry" && <RegistryTab />}
      {tab === "settings" && <SettingsTab user={user} onSaved={refresh} />}
      {tab === "keys" && <KeysTab />}
    </main>
  );
}

function RegistryTab() {
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
  if (rows === null) return <div className="loading">Loading your records…</div>;
  if (rows.length === 0) return (
    <div className="empty-state">
      <div className="big">No records yet.</div>
      <p>Anything you create on GenieMade is registered here automatically — or register a file directly.</p>
      <Link href="/register" className="btn btn-gold" style={{ marginTop: 14 }}>Register a creation</Link>
    </div>
  );
  return (
    <ul style={{ listStyle: "none", margin: "10px 0", padding: 0 }}>
      {rows.map((r) => (
        <li key={r.receipt_id} style={{ display: "grid", gridTemplateColumns: "56px 1fr auto", gap: 14, alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--border)" }}>
          {r.thumb_url ? <img src={assetUrl(r.thumb_url)} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }} /> : <div style={{ width: 56, height: 56, borderRadius: 10, background: "var(--panel2)" }} />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title || "Untitled creation"}</div>
            <div className="muted" style={{ fontSize: 12.5 }}>{fmtDate(r.created_at)} · <Link href={`/r/${r.receipt_id}`}>View record →</Link></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={"pill" + (r.is_public ? " good" : "")}>{r.is_public ? "Public" : "Private"}</span>
            <button className="btn btn-ghost btn-sm" disabled={busyId === r.receipt_id} onClick={() => toggle(r)}>{busyId === r.receipt_id ? "…" : r.is_public ? "Make private" : "Make public"}</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Note({ text, ok }: { text: string; ok?: boolean }) {
  if (!text) return null;
  return <div style={{ fontSize: 13.5, color: ok ? "var(--good,#2f8f5b)" : "#ffb4c1", marginTop: 4 }}>{text}</div>;
}

function SettingsTab({ user, onSaved }: { user: EvUser; onSaved: () => void }) {
  const [name, setName] = useState(user.display_name || "");
  const [username, setUsername] = useState(user.username || "");
  const [profMsg, setProfMsg] = useState(""); const [profOk, setProfOk] = useState(false); const [savingProf, setSavingProf] = useState(false);
  const avatarInput = useRef<HTMLInputElement | null>(null);
  const [avatarMsg, setAvatarMsg] = useState("");

  const [addr, setAddr] = useState<EvAddress | null>(null);
  const [addrMsg, setAddrMsg] = useState(""); const [addrOk, setAddrOk] = useState(false);
  useEffect(() => { api.addressGet().then((d) => setAddr(d.address)).catch(() => setAddr({ line1: "", line2: "", city: "", region: "", postal_code: "", country: "" })); }, []);

  const [curPw, setCurPw] = useState(""); const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState(""); const [pwOk, setPwOk] = useState(false); const [savingPw, setSavingPw] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setSavingProf(true); setProfMsg("");
    try {
      const d = await api.accountUpdate({ display_name: name.trim(), username: username.trim() });
      if (d.ok) { setProfOk(true); setProfMsg("Saved."); onSaved(); }
      else { setProfOk(false); setProfMsg(d.message || "Couldn't save."); }
    } catch { setProfOk(false); setProfMsg("Network error."); }
    finally { setSavingProf(false); }
  }
  async function uploadAvatar(f: File) {
    setAvatarMsg("Uploading…");
    try { const d = await api.avatarUpload(f); setAvatarMsg(d.ok ? "Updated." : (d.message || "Upload failed.")); if (d.ok) onSaved(); }
    catch { setAvatarMsg("Upload failed."); }
  }
  async function saveAddress(e: React.FormEvent) {
    e.preventDefault(); if (!addr) return; setAddrMsg("");
    try { const d = await api.addressPut(addr); setAddrOk(d.ok); setAddrMsg(d.ok ? "Saved." : "Couldn't save."); }
    catch { setAddrOk(false); setAddrMsg("Network error."); }
  }
  async function savePassword(e: React.FormEvent) {
    e.preventDefault(); setSavingPw(true); setPwMsg("");
    try {
      const d = await api.changePassword(curPw, newPw);
      if (d.ok) { setPwOk(true); setPwMsg("Password changed."); setCurPw(""); setNewPw(""); }
      else { setPwOk(false); setPwMsg(d.message || "Couldn't change password."); }
    } catch { setPwOk(false); setPwMsg("Network error."); }
    finally { setSavingPw(false); }
  }
  const af = (k: keyof EvAddress, ph: string) => (
    <input className="input" placeholder={ph} value={addr?.[k] || ""} onChange={(e) => setAddr((a) => ({ ...(a as EvAddress), [k]: e.target.value }))} />
  );

  return (
    <div style={{ display: "grid", gap: 18, maxWidth: 560 }}>
      <form onSubmit={saveProfile} className="card">
        <h3 style={{ marginTop: 0 }}>Profile</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "10px 0 14px" }}>
          {user.avatar_url ? <img src={assetUrl(user.avatar_url)} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} /> : <span className="seal-badge"><Seal size={22} /></span>}
          <div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => avatarInput.current?.click()}>Change picture</button>
            <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = ""; }} />
            <Note text={avatarMsg} ok={avatarMsg === "Updated."} />
          </div>
        </div>
        <label className="fld">Display name<input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="fld">Username<input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="lowercase, letters/numbers/_" /></label>
        <Note text={profMsg} ok={profOk} />
        <button className="btn btn-gold btn-sm" type="submit" disabled={savingProf} style={{ marginTop: 12 }}>{savingProf ? "Saving…" : "Save profile"}</button>
      </form>

      <form onSubmit={saveAddress} className="card">
        <h3 style={{ marginTop: 0 }}>Address</h3>
        <div style={{ display: "grid", gap: 10 }}>
          {af("line1", "Address line 1")}
          {af("line2", "Address line 2 (optional)")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{af("city", "City")}{af("region", "State / region")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{af("postal_code", "Postal code")}{af("country", "Country")}</div>
        </div>
        <Note text={addrMsg} ok={addrOk} />
        <button className="btn btn-gold btn-sm" type="submit" style={{ marginTop: 12 }} disabled={!addr}>Save address</button>
      </form>

      <form onSubmit={savePassword} className="card">
        <h3 style={{ marginTop: 0 }}>Change password</h3>
        <div style={{ display: "grid", gap: 10 }}>
          <input className="input" type="password" placeholder="Current password" autoComplete="current-password" value={curPw} onChange={(e) => setCurPw(e.target.value)} />
          <input className="input" type="password" placeholder="New password (8+ characters)" autoComplete="new-password" minLength={8} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
        </div>
        <Note text={pwMsg} ok={pwOk} />
        <button className="btn btn-gold btn-sm" type="submit" disabled={savingPw || !curPw || newPw.length < 8} style={{ marginTop: 12 }}>{savingPw ? "…" : "Change password"}</button>
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Signed in with Google? You don't have a password to change.</p>
      </form>
    </div>
  );
}

function KeysTab() {
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<{ name: string; key: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () => api.keysList().then((d) => setKeys(d.keys || [])).catch(() => setKeys([]));
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { const d = await api.keysCreate(name.trim() || "API key"); if (d.ok && d.key) { setFresh({ name: d.name || "API key", key: d.key }); setName(""); load(); } }
    catch { /* ignore */ }
    finally { setBusy(false); }
  }
  async function revoke(id: string) { await api.keysRevoke(id); load(); }

  return (
    <div style={{ maxWidth: 620 }}>
      <p className="muted" style={{ marginTop: 6 }}>Use an API key to verify or register programmatically. Send it as the <span className="mono">x-api-key</span> header.</p>
      <form onSubmit={create} className="card" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input className="input" style={{ flex: 1, minWidth: 200 }} placeholder="Key name (e.g. My integration)" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-gold btn-sm" type="submit" disabled={busy}>{busy ? "…" : "Create key"}</button>
      </form>

      {fresh && (
        <div className="card" style={{ borderColor: "var(--cyan)", marginTop: 12 }}>
          <div style={{ fontWeight: 600 }}>New key: {fresh.name}</div>
          <div className="mono" style={{ wordBreak: "break-all", background: "var(--panel2)", padding: "10px 12px", borderRadius: 8, margin: "8px 0", fontSize: 13 }}>{fresh.key}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard?.writeText(fresh.key)}>Copy</button>
            <button className="linklike" onClick={() => setFresh(null)}>Dismiss</button>
            <span className="muted" style={{ fontSize: 12.5 }}>Copy it now — it won't be shown again.</span>
          </div>
        </div>
      )}

      {keys === null ? <div className="loading">Loading keys…</div> : keys.length === 0 ? (
        <p className="muted" style={{ marginTop: 16 }}>No API keys yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
          {keys.map((k) => (
            <li key={k.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: "1px solid var(--border)", opacity: k.revoked ? 0.55 : 1 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{k.name} {k.revoked && <span className="pill">revoked</span>}</div>
                <div className="muted mono" style={{ fontSize: 12 }}>{k.prefix} · {k.calls} calls · created {fmtDate(k.created_at)}</div>
              </div>
              {!k.revoked && <button className="btn btn-ghost btn-sm" onClick={() => revoke(k.id)}>Revoke</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
