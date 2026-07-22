// EverVerify talks directly to the live CyberHopeAI registry engine (QSurface ledger).
// CORS is open on the engine, so no proxy is needed.
const BASE = "https://geniemade-engine.cyberhopeai.workers.dev";

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

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(BASE + path, { headers: { "content-type": "application/json" }, ...init });
  return (await r.json()) as T;
}

export const api = {
  registryRecent: () =>
    req<{ ok: boolean; count: number; registrations: Registration[] }>("/api/registry/recent"),
  verify: (body: { receipt_id?: string; hash?: string }) =>
    req<VerifyResult>("/api/verify", { method: "POST", body: JSON.stringify(body) }),
  report: (receipt_id: string, reason: string) =>
    req<{ ok: boolean; reported?: boolean }>("/api/registry/report", { method: "POST", body: JSON.stringify({ receipt_id, reason }) }),
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
