import { useState } from "react";

const STORAGE_KEY = "haiku-onboarded";

const STEPS = [
  {
    title: "Type to generate",
    text: "Start typing a subject and your haiku will appear as you go. Each keystroke refines the poem.",
  },
  {
    title: "Syllable colors",
    text: "Each color represents a syllable position across all three lines, so you can see the 5-7-5 structure at a glance.",
  },
  {
    title: "Drag to rearrange",
    text: "Grab any word and drag it to a new position within the line. The poem rearranges to match.",
  },
];

export function useOnboarding() {
  const [step, setStep] = useState<number | null>(() => {
    if (localStorage.getItem(STORAGE_KEY)) return null;
    return 0;
  });

  const advance = () => {
    setStep((s) => {
      if (s === null) return null;
      if (s >= STEPS.length - 1) {
        localStorage.setItem(STORAGE_KEY, "true");
        return null;
      }
      return s + 1;
    });
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setStep(null);
  };

  const restart = () => setStep(0);

  return { step, advance, dismiss, restart };
}

interface Props {
  step: number | null;
  onAdvance: () => void;
  onDismiss: () => void;
}

export function OnboardingGuide({ step, onAdvance, onDismiss }: Props) {
  if (step === null) return null;
  const current = STEPS[step];

  return (
    <div className="onboarding-overlay" onClick={onDismiss}>
      <div className="onboarding-card" onClick={(e) => e.stopPropagation()}>
        <p className="onboarding-step">
          {step + 1} / {STEPS.length}
        </p>
        <h3 className="onboarding-title">{current.title}</h3>
        <p className="onboarding-text">{current.text}</p>
        <div className="onboarding-actions">
          <button className="onboarding-skip" onClick={onDismiss}>
            Skip
          </button>
          <button className="onboarding-next" onClick={onAdvance}>
            {step === STEPS.length - 1 ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
