// EverVerify talks directly to the live CyberHopeAI registry engine (QSurface ledger).
// CORS is open on the engine, so no proxy is needed.
const BASE = "https://geniemade-engine.cyberhopeai.workers.dev";
export const ENGINE = BASE;
// registry thumbs/media come back as engine-relative "/asset/..." paths — make them absolute.
export function assetUrl(p?: string | null): string | undefined {
  if (!p) return undefined;
  return p.startsWith("http") ? p : ENGINE + p;
}

export type Registration = {
  receipt_id: string;
  owner: string;
  title: string | null;
  hash_short: string;
  thumb_url: string | null;
  created_at: string;
  verify_url: string;
};

export type VerifyResult = {
  ok: boolean;
  verdict?: "authentic" | "registered" | "unknown" | "no_receipt" | string;
  verified?: boolean;
  generation?: { capability?: string; url?: string; model?: string; created_at?: string };
  certificate?: { hash?: string; receipt_id?: string; issued_at?: string; type?: string };
  registration?: { owner?: string; registered_at?: string; title?: string | null; thumb_url?: string | null; is_public?: boolean };
  anchor?: { chain?: string; status?: string; block_height?: number | null; submitted_at?: string; confirmed_at?: string | null };
};

// --- cross-domain SSO: one GenieMade account across both sister sites. The engine session is a stateless
// signed token; we keep it in localStorage and send it as Authorization: Bearer (cookies can't cross domains). ---
const TOKEN_KEY = "ev_token";
export function getToken(): string | null { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
export function setToken(t: string | null) { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } }

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json", ...(init?.headers as Record<string, string> | undefined) };
  const token = getToken();
  if (token) headers["authorization"] = `Bearer ${token}`;
  const r = await fetch(BASE + path, { ...init, headers });
  return (await r.json()) as T;
}

export type FeedPage = { ok: boolean; count: number; next_cursor: string | null; registrations: Registration[] };
export type RegistryStats = { ok: boolean; total_public: number; creators: number; total_all: number };
export type EvUser = { id: string; email?: string; plan?: string; credits?: number; display_name?: string; avatar_url?: string | null };
export type MineRow = Registration & { is_public: boolean; ever_url: string };
export type AuthResp = { ok: boolean; token?: string; user?: EvUser; error?: string; detail?: string };

export const auth = {
  async login(email: string, password: string): Promise<AuthResp> {
    const d = await req<AuthResp>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    if (d.ok && d.token) setToken(d.token);
    return d;
  },
  async signup(email: string, password: string, turnstile?: string): Promise<AuthResp> {
    const d = await req<AuthResp>("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password, turnstile }) });
    if (d.ok && d.token) setToken(d.token);
    return d;
  },
  me: () => req<{ ok: boolean; authenticated?: boolean; user?: EvUser }>("/api/auth/me"),
  logout: () => setToken(null),
};

export const api = {
  registryRecent: () =>
    req<{ ok: boolean; count: number; registrations: Registration[] }>("/api/registry/recent"),
  // Paginated, searchable public feed (keyset cursor) — powers the infinite-scroll registry wall.
  registryFeed: (p: { limit?: number; cursor?: string | null; q?: string } = {}) => {
    const u = new URLSearchParams();
    if (p.limit) u.set("limit", String(p.limit));
    if (p.cursor) u.set("cursor", p.cursor);
    if (p.q) u.set("q", p.q);
    const qs = u.toString();
    return req<FeedPage>("/api/registry/feed" + (qs ? "?" + qs : ""));
  },
  registryStats: () => req<RegistryStats>("/api/registry/stats"),
  verify: (body: { receipt_id?: string; hash?: string }) =>
    req<VerifyResult>("/api/verify", { method: "POST", body: JSON.stringify(body) }),
  report: (receipt_id: string, reason: string) =>
    req<{ ok: boolean; reported?: boolean }>("/api/registry/report", { method: "POST", body: JSON.stringify({ receipt_id, reason }) }),
  // authed (Bearer token): the signed-in user's own account + registrations + public/private toggle
  account: () => req<{ ok: boolean; account?: EvUser }>("/api/account"),
  registryMine: () => req<{ ok: boolean; count: number; registrations: MineRow[] }>("/api/registry/mine"),
  registryPublish: (receipt_id: string, is_public: boolean) =>
    req<{ ok: boolean; receipt_id?: string; is_public?: boolean; error?: string }>("/api/registry/publish", { method: "POST", body: JSON.stringify({ receipt_id, is_public }) }),
};

// Client-side SHA-256 of a file -> hex, so "verify by upload" never sends the image anywhere.
export async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function fmtDate(s?: string): string {
  if (!s) return "";
  try { return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
  catch { return s; }
}
