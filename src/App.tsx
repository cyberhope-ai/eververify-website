import { Link, Route, Switch, useLocation } from "wouter";
import Home from "./pages/Home";
import Verify from "./pages/Verify";
import Record from "./pages/Record";
import Register from "./pages/Register";
import About from "./pages/About";
import Account from "./pages/Account";
import { useAuth } from "./auth";

export function Seal({ size = 22 }: { size?: number }) {
  return (
    <svg className="seal" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l2.4 1.7 2.9-.2 1 2.7 2.4 1.6-.6 2.9 1 2.7-2 2.1.1 2.9-2.8.9-1.6 2.4-2.8-.7-2.8.7-1.6-2.4-2.8-.9.1-2.9-2-2.1 1-2.7-.6-2.9L4.7 6.2l1-2.7 2.9.2z" fill="none" stroke="#c88f2c" strokeWidth="1.3" />
      <path d="M8.5 12l2.3 2.3 4.7-4.7" fill="none" stroke="#f5c451" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Nav() {
  const [loc] = useLocation();
  const { user } = useAuth();
  const link = (href: string, label: string, cls = "") => (
    <Link href={href} className={(loc === href ? "active " : "") + cls}>{label}</Link>
  );
  return (
    <nav className="nav">
      <div className="nav-in">
        <Link href="/" className="brand"><Seal size={24} /> EverVerify</Link>
        <div className="nav-links">
          {link("/", "Registry", "hide-sm")}
          {link("/verify", "Verify")}
          {link("/about", "About", "hide-sm")}
          {user ? link("/account", "My registry") : link("/account", "Sign in")}
          <Link href="/register" className="btn btn-gold btn-sm">Register free</Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container fin">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text)", fontFamily: "var(--serif)", fontSize: 16 }}><Seal size={18} /> EverVerify</div>
          <div style={{ marginTop: 6 }}>The public registry of authentic creations.</div>
          <div style={{ marginTop: 8 }}><a href="tel:+18883524613" style={{ color: "var(--text)", fontWeight: 600 }}>📞 888-352-4613</a></div>
        </div>
        <div className="powered">
          A public-benefit service of <b style={{ color: "var(--text)" }}>Hope Training Academy</b>.<br />
          Powered by CyberHopeAI · PrecognitionOS.
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/verify" component={Verify} />
        <Route path="/register" component={Register} />
        <Route path="/about" component={About} />
        <Route path="/account" component={Account} />
        <Route path="/r/:id">{(params) => <Record id={params.id} />}</Route>
        <Route>{() => <div className="container" style={{ padding: "80px 0" }}><h2 style={{ fontFamily: "var(--serif)" }}>Not found</h2><Link href="/">← Back to the registry</Link></div>}</Route>
      </Switch>
      <Footer />
    </>
  );
}
