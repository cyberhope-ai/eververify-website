import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { api, fmtDate, assetUrl, type Registration } from "../api";
import { Seal } from "../App";

// Smoothly counts up 0 -> target once target is known (the headline "N certified" figure).
function useCountUp(target: number | null, ms = 900): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === null) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

export default function Home() {
  const [stats, setStats] = useState<{ total: number; creators: number } | null>(null);
  const [items, setItems] = useState<Registration[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const [feedError, setFeedError] = useState(false);
  const [refreshed, setRefreshed] = useState<string | null>(null);
  const [daily, setDaily] = useState<{day:string;registration:Registration|null} | null>(null);
  const [dailyError, setDailyError] = useState(false);
  const [q, setQ] = useState("");
  const qRef = useRef(q);
  qRef.current = q;
  const sentinel = useRef<HTMLDivElement | null>(null);
  const didMount = useRef(false);

  const total = useCountUp(stats ? stats.total : null);

  // Load one page. reset=true starts fresh (first load or a new search).
  const load = useCallback(async (reset: boolean) => {
    setLoading(true);
    try {
      const d = await api.registryFeed({ limit: 24, cursor: reset ? null : cursor, q: qRef.current || undefined });
      if (!d.ok || !Array.isArray(d.registrations)) throw new Error("feed_unavailable");
      setItems((prev) => (reset ? d.registrations : [...prev, ...d.registrations]));
      setCursor(d.next_cursor);
      setHasMore(!!d.next_cursor);
      setFeedError(false);
      setRefreshed(new Date().toLocaleTimeString());
    } catch {
      setFeedError(true);
      setHasMore(false);
    } finally {
      setLoading(false);
      setFirstLoaded(true);
    }
  }, [cursor]);

  // First paint: title + headline stats + first page.
  useEffect(() => {
    document.title = "EverVerify — the public registry of authentic creations";
    api.registryStats()
      .then((s) => setStats({ total: s.total_public, creators: s.creators }))
      .catch(() => setStats({ total: 0, creators: 0 }));
    load(true);
    api.pictureOfDay().then(d=>{if(!d.ok)throw new Error();setDaily(d);}).catch(()=>setDailyError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search: refetch from the top whenever the query changes (skip the mount run).
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    const t = setTimeout(() => {
      setItems([]); setCursor(null); setHasMore(true); setFirstLoaded(false);
      load(true);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Infinite scroll: load the next page as the sentinel nears the viewport.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) load(false);
    }, { rootMargin: "700px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, load]);

  return (
    <main>
      {/* hero */}
      <section className="hero">
        <div className="container">
          <span className="eyebrow">The public registry of authentic creations</span>
          <h1>Proof of what's real — <em>and what's AI.</em></h1>
          <p className="lede">
            EverVerify gives every creation a permanent public record — cryptographically signed and
            timestamped: who registered it, when, and the exact digital fingerprint that proves it hasn't
            been altered since. Creations made with GenieMade carry their provenance from the moment
            they're made — the model, the time, and the maker, sealed in.
          </p>
          <div className="cta">
            <Link href="/register" className="btn btn-gold">Register your work — free</Link>
            <Link href="/verify" className="btn btn-ghost">Verify a creation</Link>
          </div>
        </div>
      </section>

      <section className="section" id="picture-of-the-day">
        <div className="container">
          <div className="kicker">A different perspective, every day</div>
          <h2>Picture of the day</h2>
          <p>One daily random selection from images their owners have shared publicly. Not a competition or endorsement.</p>
          {daily?.registration ? <div className="daily-picture">
            <Link href={`/r/${daily.registration.receipt_id}`} className="daily-image-link">
              <img src={assetUrl(daily.registration.thumb_url)} alt={daily.registration.title || "Today's public creation"}/>
            </Link>
            <div className="daily-caption">
              <span className="eyebrow">{daily.day} · UTC selection</span>
              <h3>{daily.registration.title || "Untitled creation"}</h3>
              <p>Registered by <strong>{daily.registration.owner || "Anonymous"}</strong></p>
              <p>On the registry since {fmtDate(daily.registration.created_at)}</p>
              <Link href={`/r/${daily.registration.receipt_id}`} className="btn btn-gold">View its public record →</Link>
              <p className="daily-note">A daily selection from the current public collection; it can change if owners change visibility. New registrations join the following day's selection.</p>
            </div>
          </div> : <p role="status">{dailyError ? "Today's selection is temporarily unavailable. You can still browse the public gallery below." : daily ? "No eligible public images for today's selection yet." : "Choosing today's public picture…"}</p>}
        </div>
      </section>

      {/* registry feed */}
      <section className="section" id="registry">
        <div className="container">
          <div className="kicker">The registry</div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <h2>Newest public creations</h2>
            <div className="statbar">
              <div className="stat"><span className="n">{stats === null ? "—" : total.toLocaleString()}</span><span className="l">creations on the record</span></div>
              <div className="stat"><span className="n">{stats === null ? "—" : stats.creators.toLocaleString()}</span><span className="l">creators</span></div>
            </div>
          </div>

          <p>Newest registrations first. Private creations are never included. To share your own new GenieMade images, visit <a href="https://geniemadeit.com/account">Account → EverVerify sharing</a> or publish selected images from your Vault.</p>
          <button className="btn btn-ghost" disabled={loading} onClick={()=>load(true)}>Refresh newest creations</button>
          {refreshed && <p className="daily-note">Gallery checked at {refreshed}. {items[0] && !q ? `Newest public registration: ${fmtDate(items[0].created_at)}.` : ""}</p>}
          {feedError && <p role="alert">The gallery could not be refreshed. Any displayed records are from the last successful load. Please try Refresh.</p>}

          <div className="searchbar">
            <input
              className="input"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the registry by creator or title…"
              aria-label="Search the registry"
            />
          </div>

          {!firstLoaded ? (
            <div className="loading">Loading the registry…</div>
          ) : feedError && items.length === 0 ? null : items.length === 0 ? (
            <div className="empty-state">
              <div className="big">{q ? "No matches." : "The registry is brand new."}</div>
              <p>{q ? "Try a different creator or title." : "Be the first to put a provably-authentic creation on the public record."}</p>
              {!q && <Link href="/register" className="btn btn-gold" style={{ marginTop: 14 }}>Register the first creation</Link>}
            </div>
          ) : (
            <>
              <div className="feed">
                {items.map((r) => (
                  <Link key={r.receipt_id} href={`/r/${r.receipt_id}`} className="tile">
                    {r.thumb_url ? <img className="ph" src={assetUrl(r.thumb_url)} alt={r.title || "creation"} loading="lazy" /> : <div className="ph empty">no preview</div>}
                    <span className="sl"><Seal size={15} /></span>
                    <div className="meta">
                      <div className="o">{r.owner || "Anonymous"}</div>
                      <div className="d">{fmtDate(r.created_at)}</div>
                    </div>
                  </Link>
                ))}
              </div>
              <div ref={sentinel} className="sentinel" aria-hidden="true" />
              {loading && <div className="loading">Loading more…</div>}
              {!hasMore && <div className="feed-end">You've reached the beginning of the record.</div>}
            </>
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
