import { useState, useEffect, useRef, useCallback } from "react";
import { generateHaiku, rebalanceHaiku, type GenerateResult } from "../utils/api";

export type Status = "idle" | "loading" | "done" | "error";

export interface HaikuWord {
  id: string;
  text: string;
}

export interface HaikuState {
  lines: HaikuWord[][];
  status: Status;
  error: string;
  remaining: number | null;
}

function parseLines(raw: string[]): HaikuWord[][] {
  return raw.map((line, li) =>
    line.split(/\s+/).filter(Boolean).map((word, wi) => ({
      id: `${li}-${wi}-${word}`,
      text: word,
    }))
  );
}

export function useHaikuGenerator(
  debouncedSubject: string,
  apiKey: string,
  hasMagicLink: boolean,
  autoGenerate: boolean
) {
  const [state, setState] = useState<HaikuState>({
    lines: [],
    status: "idle",
    error: "",
    remaining: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const doGenerate = useCallback(
    async (subject: string) => {
      if (!subject.trim()) return;
      if (!hasMagicLink && !apiKey.trim()) return;

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((s) => ({ ...s, status: "loading", error: "" }));

      try {
        const result: GenerateResult = await generateHaiku({
          subject,
          apiKey,
          hasMagicLink,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setState({
          lines: parseLines(result.lines),
          status: "done",
          error: "",
          remaining: result.remaining,
        });
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setState((s) => ({
          ...s,
          status: "error",
          error: e instanceof Error ? e.message : "Something went wrong.",
        }));
      }
    },
    [apiKey, hasMagicLink]
  );

  // Auto-generate on debounced subject change
  useEffect(() => {
    if (autoGenerate && debouncedSubject.trim()) {
      doGenerate(debouncedSubject);
    }
  }, [debouncedSubject, autoGenerate, doGenerate]);

  const reorderLines = (newLines: HaikuWord[][]) => {
    setState((s) => ({ ...s, lines: newLines }));
  };

  const doRebalance = useCallback(
    async (currentLines: HaikuWord[][]) => {
      if (!hasMagicLink && !apiKey.trim()) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((s) => ({ ...s, status: "loading", error: "" }));

      try {
        const wordLines = currentLines.map((line) =>
          line.map((w) => w.text)
        );
        const result: GenerateResult = await rebalanceHaiku({
          lines: wordLines,
          apiKey,
          hasMagicLink,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setState({
          lines: parseLines(result.lines),
          status: "done",
          error: "",
          remaining: result.remaining,
        });
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setState((s) => ({
          ...s,
          status: "error",
          error: e instanceof Error ? e.message : "Something went wrong.",
        }));
      }
    },
    [apiKey, hasMagicLink]
  );

  return { ...state, doGenerate, reorderLines, doRebalance };
}
