import { useState, useRef, useEffect } from "react";
import { HaikuDisplay } from "./components/HaikuDisplay";
import { OnboardingGuide, useOnboarding } from "./components/OnboardingGuide";
import { useDebounce } from "./hooks/useDebounce";
import { useHaikuGenerator } from "./hooks/useHaikuGenerator";
import "./App.css";

declare global {
  interface Window {
    magiclink?: { hasToken?: boolean };
  }
}

export default function App() {
  const [subject, setSubject] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const autoGenerate = true;
  const debouncedSubject = useDebounce(subject, 800);

  const { lines, status, error, remaining, doGenerate, reorderLines, doRebalance } =
    useHaikuGenerator(debouncedSubject, autoGenerate);

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
            disabled={!subject.trim() || status === "loading"}
            className="generate-btn"
            title="Regenerate"
          >
            {status === "loading" ? (
              <span className="spinner" />
            ) : (
              "↻"
            )}
          </button>
        </div>

        {/* Haiku display */}
        <HaikuDisplay
          lines={lines}
          status={status}
          remaining={remaining}
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
