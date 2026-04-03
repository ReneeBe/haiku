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

const ANTHROPIC_URL = import.meta.env.DEV
  ? "/api/anthropic/v1/messages"
  : "https://api.anthropic.com/v1/messages";

const MAGICLINK_URL = "https://magiclink.reneebe.workers.dev";

type Status = "idle" | "loading" | "done" | "error";

export default function App() {
  const [subject, setSubject] = useState("");
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem("haiku-api-key") ?? "");
  const [haiku, setHaiku] = useState<string[] | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [animate, setAnimate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasMagicLink = !!window.magiclink?.hasToken;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function saveApiKey(val: string) {
    setApiKey(val);
    if (val) sessionStorage.setItem("haiku-api-key", val);
    else sessionStorage.removeItem("haiku-api-key");
  }

  async function generate() {
    const text = subject.trim();
    if (!text) return;
    if (!hasMagicLink && !apiKey.trim()) return;

    setStatus("loading");
    setError("");
    setAnimate(false);

    const request = {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      system:
        "You are a haiku poet. When given a subject, respond with exactly one haiku in the traditional 5-7-5 syllable format. Output only the three lines of the haiku, separated by newlines. No title, no attribution, no explanation.",
      messages: [{ role: "user", content: text }],
    };

    try {
      let content: string;

      if (hasMagicLink) {
        // MagicLink proxy path
        const token = localStorage.getItem("magiclink_token");
        const res = await fetch(`${MAGICLINK_URL}/api/proxy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            projectId: "haiku-generator",
            provider: "claude",
            request,
          }),
        });
        const json = (await res.json()) as {
          result?: { content: { type: string; text: string }[] };
          usage?: { remaining: number };
          error?: string;
        };
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        content = json.result!.content[0].text;
        if (json.usage) setRemaining(json.usage.remaining);
      } else {
        // Direct API key path
        const res = await fetch(ANTHROPIC_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify(request),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
          throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { content: { text: string }[] };
        content = data.content[0].text;
      }

      const lines = content
        .trim()
        .split("\n")
        .filter((l) => l.trim());

      setHaiku(lines);
      setStatus("done");
      requestAnimationFrame(() => setAnimate(true));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="container">
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

        {/* Auth: MagicLink banner or API key input */}
        {hasMagicLink ? (
          <div className="demo-banner">
            <p className="demo-label">Demo mode active</p>
            <p className="demo-sub">You have 5 uses — no API key needed.</p>
          </div>
        ) : (
          <div className="api-key-area">
            <label className="api-key-label">Claude API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="api-key-input"
            />
            <p className="api-key-hint">
              Stored in session only — cleared when you close the tab.
              Or{" "}
              <a
                href="https://magiclink.reneebe.workers.dev"
                target="_blank"
                rel="noopener noreferrer"
              >
                get a MagicLink
              </a>{" "}
              to try it free.
            </p>
          </div>
        )}

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
            disabled={
              !subject.trim() ||
              status === "loading" ||
              (!hasMagicLink && !apiKey.trim())
            }
            className="generate-btn"
          >
            {status === "loading" ? <span className="spinner" /> : "Write"}
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
