import { useState, useRef, useEffect } from "react";
import { HaikuDisplay } from "./components/HaikuDisplay";
import { OnboardingGuide, useOnboarding } from "./components/OnboardingGuide";
import { useDebounce } from "./hooks/useDebounce";
import { useHaikuGenerator } from "./hooks/useHaikuGenerator";
import "./App.css";

declare global {
  interface Window {
    magiclink?: { hasToken: boolean };
  }
}

export default function App() {
  const [subject, setSubject] = useState("");
  const [apiKey, setApiKey] = useState(
    () => sessionStorage.getItem("haiku-api-key") ?? ""
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const hasMagicLink = !!window.magiclink?.hasToken;

  // In MagicLink mode, don't auto-generate (conserve credits)
  const autoGenerate = !hasMagicLink && !!apiKey.trim();
  const debouncedSubject = useDebounce(subject, 800);

  const { lines, status, error, remaining, doGenerate, reorderLines, doRebalance } =
    useHaikuGenerator(debouncedSubject, apiKey, hasMagicLink, autoGenerate);

  const { step, advance, dismiss, restart } = useOnboarding();

  // Show onboarding after first haiku is generated
  const hasShownRef = useRef(false);
  useEffect(() => {
    if (status === "done" && !hasShownRef.current) {
      hasShownRef.current = true;
      // Onboarding shows automatically if not dismissed
    }
  }, [status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function saveApiKey(val: string) {
    setApiKey(val);
    if (val) sessionStorage.setItem("haiku-api-key", val);
    else sessionStorage.removeItem("haiku-api-key");
  }

  function handleManualGenerate() {
    doGenerate(subject);
  }

  return (
    <div className="container">
      <div className="bg-circle bg-circle-1" />
      <div className="bg-circle bg-circle-2" />

      <main className="main">
        {/* Header */}
        <header className="header">
          <p className="label">day 17 / 50 projects</p>
          <h1 className="title">
            haiku<span className="accent">.</span>
          </h1>
          <p className="subtitle">
            Type a subject and watch the haiku take shape. Drag words to
            rearrange. Syllable colors show the 5-7-5 structure.
          </p>
        </header>

        {/* Auth */}
        {hasMagicLink ? (
          <div className="demo-banner">
            <p className="demo-label">Demo mode active</p>
            <p className="demo-sub">
              You have 5 uses. Press Write to generate.
            </p>
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
              Stored in session only. Haiku updates as you type.
              {" "}Or{" "}
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
              if (e.key === "Enter") handleManualGenerate();
            }}
            placeholder="the melancholy weather of winter..."
            className="input"
          />
          <button
            onClick={handleManualGenerate}
            disabled={
              !subject.trim() ||
              status === "loading" ||
              (!hasMagicLink && !apiKey.trim())
            }
            className="generate-btn"
            title={autoGenerate ? "Regenerate" : "Write"}
          >
            {status === "loading" ? (
              <span className="spinner" />
            ) : autoGenerate ? (
              "↻"
            ) : (
              "Write"
            )}
          </button>
        </div>

        {/* Haiku display */}
        <HaikuDisplay
          lines={lines}
          status={status}
          remaining={remaining}
          hasMagicLink={hasMagicLink}
          onReorder={reorderLines}
          onRebalance={doRebalance}
        />

        {/* Error */}
        {status === "error" && (
          <div className="error-card">
            <p>{error}</p>
          </div>
        )}

        {/* Footer */}
        <footer className="footer">
          <button className="help-btn" onClick={restart} title="Show guide">
            ?
          </button>
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

      {/* Onboarding */}
      <OnboardingGuide step={step} onAdvance={advance} onDismiss={dismiss} />
    </div>
  );
}
