// Programmatic SEO landing pages — one page per search intent (JibJab-style), all data-driven so adding a
// page is just adding an entry here (and to the sitemap function's LANDINGS list). Keyed by full path.
export type Faq = { q: string; a: string };
export type Landing = {
  path: string;            // e.g. "check/ai-generated"
  eyebrow: string;
  h1: string;
  title: string;           // <title> / og:title
  description: string;     // meta description / og:description
  intro: string;
  sections: { h: string; p: string }[];
  faqs: Faq[];
  cta: { label: string; href: string };
};

export const LANDINGS: Landing[] = [
  {
    path: "check/ai-generated",
    eyebrow: "Check a creation",
    h1: "How to tell if an image is AI-generated",
    title: "How to Tell if an Image Is AI-Generated — EverVerify",
    description: "The reliable way to know if an image is AI-generated isn't a detector that guesses — it's a public record set when the image was made. Here's how provenance works, and how to check one on EverVerify.",
    intro: "AI-image \"detectors\" analyze a file after the fact and are frequently wrong in both directions — flagging real photos as fake and missing generated ones. The dependable signal is provenance: a record made at the moment of creation that says what a file is and who made it. EverVerify is the public registry where that record lives.",
    sections: [
      { h: "Why detectors aren't enough", p: "After-the-fact detection guesses from pixels and artifacts. Compression, edits, and new models break those guesses, so a confident-looking score can be flatly wrong. Nothing about a pixel proves its origin." },
      { h: "Provenance is proof, not a guess", p: "When a creation is registered, its exact contents are fingerprinted (SHA-256) and recorded with who registered it and when, cryptographically signed. Anyone can re-fingerprint the file and confirm it matches — proof that survives screenshots and re-uploads." },
      { h: "How to check a file on EverVerify", p: "Drop the image into the verifier. We fingerprint it in your browser (the file never leaves your device) and tell you if that exact file is on the public registry — who registered it, when, and whether it's disclosed as AI-generated." },
    ],
    faqs: [
      { q: "Can you 100% detect AI images?", a: "No tool can reliably detect AI from pixels alone. What you can prove is provenance — whether a file has a registered record of what it is and who made it. That's certainty; detection is a guess." },
      { q: "Does EverVerify scan my image?", a: "No. Verification fingerprints the file in your browser and only sends the fingerprint. Your image never leaves your device." },
      { q: "What if an image isn't on the registry?", a: "Then there's simply no record for it — EverVerify says \"unknown\" rather than guessing. Anyone can register a creation for free to give it a record." },
    ],
    cta: { label: "Verify an image now", href: "/verify" },
  },
  {
    path: "check/deepfake",
    eyebrow: "Check a creation",
    h1: "How to verify whether a photo or video is a deepfake",
    title: "How to Check if a Photo or Video Is a Deepfake — EverVerify",
    description: "Deepfake 'detectors' are an arms race you can't win from pixels. The durable defense is provenance — a signed public record of what a file is and who made it. Learn how, and check one on EverVerify.",
    intro: "Deepfakes get better every month, and detectors chasing them from pixels alone keep losing ground. The approach that holds up is the opposite: establish what's real at the source with a public, tamper-evident record — then anyone can check a file against it.",
    sections: [
      { h: "Why 'detecting' deepfakes is a losing game", p: "Every detector trained on today's fakes is beaten by tomorrow's model. It's an arms race with no finish line, and false positives damage real people and real footage." },
      { h: "Prove the real instead of chasing the fake", p: "If authentic creations carry a registered record — fingerprint, author, timestamp, signature — then the absence of a record on a viral 'clip' is itself informative, and the presence of one is provable." },
      { h: "Check a file against the registry", p: "Drop an image or video into EverVerify. We fingerprint it locally and tell you whether that exact file has a public record — and if it's disclosed as AI-generated." },
    ],
    faqs: [
      { q: "Is there a reliable deepfake detector?", a: "Not from pixels alone — detection is probabilistic and degrades as models improve. Provenance (a signed record made at creation) is the reliable signal." },
      { q: "How does provenance stop deepfakes?", a: "It flips the burden: real creations carry a verifiable record, so unregistered viral media can't borrow the credibility of the real thing." },
    ],
    cta: { label: "Verify a file now", href: "/verify" },
  },
  {
    path: "how-to/verify-a-photo",
    eyebrow: "How to",
    h1: "How to verify a photo is authentic and unaltered",
    title: "How to Verify a Photo Is Authentic — EverVerify",
    description: "Verify a photo in seconds: EverVerify fingerprints the file in your browser and checks it against the public registry — proving who made it, when, and that it hasn't been altered. Free.",
    intro: "\"Verifying\" a photo doesn't mean running it through a filter that guesses. It means checking the file against a record made when it was created. Here's exactly how to do that on EverVerify — in your browser, without uploading anything.",
    sections: [
      { h: "Step 1 — Drop in the file", p: "Open the verifier and choose the image. It's fingerprinted (SHA-256) right in your browser; only the fingerprint is sent, never the photo." },
      { h: "Step 2 — Read the record", p: "If that exact file is registered, you'll see who registered it, when, whether it's AI-generated, and a signed certificate you can download or link to." },
      { h: "Step 3 — Register your own", p: "Have work worth protecting? Register it free — it gives your photo a public, timestamped record you can point anyone to." },
    ],
    faqs: [
      { q: "Do I have to upload my photo?", a: "No. The photo is fingerprinted locally; only the fingerprint leaves your device. Your file stays with you." },
      { q: "What does 'unaltered' mean here?", a: "The fingerprint is of the exact bytes registered. If even one pixel changes, the fingerprint changes — so a match proves the file is bit-for-bit what was registered." },
      { q: "Is verifying free?", a: "Yes — verifying and registering are both free. Volume is what makes a registry trustworthy." },
    ],
    cta: { label: "Verify a photo now", href: "/verify" },
  },
  {
    path: "learn/content-credentials",
    eyebrow: "Learn",
    h1: "What are content credentials and provenance?",
    title: "Content Credentials & Provenance, Explained — EverVerify",
    description: "Content credentials attach a verifiable record of origin to a creation. Learn what provenance means, how it differs from AI detection, and how EverVerify makes any image or video provable.",
    intro: "\"Content credentials\" and \"provenance\" both point at the same idea: a creation should carry a verifiable record of where it came from. That record — not an after-the-fact guess — is what lets anyone trust what they're looking at.",
    sections: [
      { h: "Provenance vs. detection", p: "Detection inspects a finished file and estimates whether it's AI or edited. Provenance records the truth at creation and signs it, so there's nothing to estimate — you either have a record or you don't." },
      { h: "How a record is made", p: "The creation is fingerprinted and signed with the author and timestamp, then published to a public registry. The fingerprint is content-addressed, so the record is bound to the exact file, not removable metadata." },
      { h: "Why a public registry matters", p: "Credentials buried in a file get stripped by screenshots and re-uploads. A public registry survives that — the proof is the fingerprint of the bytes, checkable by anyone, forever." },
    ],
    faqs: [
      { q: "Are content credentials the same as metadata?", a: "No. Metadata is easily stripped or forged. A registry record is content-addressed and signed, so it can't be silently altered and survives re-uploads." },
      { q: "Who can add a content credential?", a: "Anyone — on EverVerify, registering a creation is free, and anything made on GenieMade is registered automatically." },
    ],
    cta: { label: "Register your work — free", href: "/register" },
  },
];

export const LANDING_MAP: Record<string, Landing> = Object.fromEntries(LANDINGS.map((l) => [l.path, l]));
