import { useState, useRef, useEffect } from "react";
import "./App.css";

declare global {
  interface Window {
    magiclink?: {
      hasToken: boolean;
      claude: (params: unknown) => Promise<{
        result: { content: { type: string; text: string }[] };
        usage: { count: number; limit: number; remaining: number };
      }>;
    };
  }
}

type Status = "idle" | "loading" | "done" | "error";

export default function App() {
  const [subject, setSubject] = useState("");
  const [haiku, setHaiku] = useState<string[] | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [animate, setAnimate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function generate() {
    const text = subject.trim();
    if (!text) return;

    if (!window.magiclink?.hasToken) {
      setError("No access token found. Visit your MagicLink to activate access.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");
    setAnimate(false);

    try {
      const res = await window.magiclink.claude({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 120,
        system:
          "You are a haiku poet. When given a subject, respond with exactly one haiku in the traditional 5-7-5 syllable format. Output only the three lines of the haiku, separated by newlines. No title, no attribution, no explanation.",
        messages: [{ role: "user", content: text }],
      });

      const lines = res.result.content[0].text
        .trim()
        .split("\n")
        .filter((l) => l.trim());

      setHaiku(lines);
      setRemaining(res.usage.remaining);
      setStatus("done");

      // trigger line-by-line animation
      requestAnimationFrame(() => setAnimate(true));
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Something went wrong. Try again.";
      setError(msg);
      setStatus("error");
    }
  }

  const hasToken = typeof window !== "undefined" && window.magiclink?.hasToken;

  return (
    <div className="container">
      {/* Background circles */}
      <div className="bg-circle bg-circle-1" />
      <div className="bg-circle bg-circle-2" />

      <main className="main">
        {/* Header */}
        <header className="header">
          <p className="label">day 16 / 50 projects</p>
          <h1 className="title">
            haiku<span className="accent">.</span>
          </h1>
          <p className="subtitle">
            Describe a feeling, a scene, a moment — and Claude will compose a
            haiku.
          </p>
        </header>

        {/* Input */}
        <div className="input-area">
          <input
            ref={inputRef}
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") generate();
            }}
            placeholder="the melancholy weather of winter..."
            className="input"
            disabled={status === "loading"}
          />
          <button
            onClick={generate}
            disabled={!subject.trim() || status === "loading"}
            className="generate-btn"
          >
            {status === "loading" ? (
              <span className="spinner" />
            ) : (
              "Write"
            )}
          </button>
        </div>

        {/* Haiku display */}
        {haiku && status === "done" && (
          <div className="haiku-card">
            <div className="haiku-lines">
              {haiku.map((line, i) => (
                <p
                  key={i}
                  className={`haiku-line ${animate ? "visible" : ""}`}
                  style={{ transitionDelay: `${i * 400}ms` }}
                >
                  {line}
                </p>
              ))}
            </div>
            {remaining !== null && (
              <p className="credits">
                {remaining} generation{remaining !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="error-card">
            <p>{error}</p>
          </div>
        )}

        {/* No token */}
        {!hasToken && status === "idle" && (
          <p className="no-token">
            Need a token?{" "}
            <a
              href="https://magiclink.reneebe.workers.dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get a MagicLink
            </a>{" "}
            to try it out.
          </p>
        )}

        {/* Footer */}
        <footer className="footer">
          <a
            href="https://github.com/ReneeBe/haiku"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <span className="dot">·</span>
          <a
            href="https://reneebe.github.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            reneebe.github.io
          </a>
        </footer>
      </main>
    </div>
  );
}
