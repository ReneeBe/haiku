import { countSyllablesInLine } from "./syllables";

const ANTHROPIC_URL = import.meta.env.DEV
  ? "/api/anthropic/v1/messages"
  : "https://api.anthropic.com/v1/messages";

const MAGICLINK_URL = "https://magiclink.reneebe.workers.dev";
const EXPECTED = [5, 7, 5];
const MAX_RETRIES = 2;

function isValid575(lines: string[]): boolean {
  if (lines.length !== 3) return false;
  return lines.every((line, i) => countSyllablesInLine(line) === EXPECTED[i]);
}

function syllableFeedback(lines: string[]): string {
  return lines
    .map((line, i) => {
      const count = countSyllablesInLine(line);
      const target = EXPECTED[i];
      return `Line ${i + 1}: "${line}" has ${count} syllables (need ${target})`;
    })
    .join("\n");
}

export interface GenerateOptions {
  subject: string;
  signal?: AbortSignal;
}

export interface RebalanceOptions {
  lines: string[][];
  signal?: AbortSignal;
}

export interface GenerateResult {
  lines: string[];
  remaining: number | null;
}

interface ApiCallOptions {
  request: Record<string, unknown>;
  signal?: AbortSignal;
}

/** Low-level API call: always try MagicLink proxy first, fall back to direct if unavailable */
async function callClaude({
  request,
  signal,
}: ApiCallOptions): Promise<{ content: string; remaining: number | null }> {
  let content: string;
  let remaining: number | null = null;

  if (window.magiclink) {
    // MagicLink 2.0: send token if available, omit for visitor mode
    const token = localStorage.getItem("magiclink_token");
    const body: Record<string, unknown> = {
      projectId: "haiku-generator",
      provider: "claude",
      request,
    };
    if (token) {
      body.token = token;
    }
    const res = await fetch(`${MAGICLINK_URL}/api/proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    const json = (await res.json()) as {
      result?: { content: { type: string; text: string }[] };
      usage?: { remaining: number };
      error?: string;
    };
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    content = json.result!.content[0].text;
    if (json.usage) remaining = json.usage.remaining;
  } else {
    // Fallback: direct API key (e.g. local dev without MagicLink SDK)
    const apiKey = sessionStorage.getItem("haiku-api-key") ?? "";
    if (!apiKey) throw new Error("No MagicLink SDK and no API key configured");
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(request),
      signal,
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
    }
    const data = (await res.json()) as { content: { text: string }[] };
    content = data.content[0].text;
  }

  return { content, remaining };
}

function parseHaikuLines(content: string): string[] {
  return content
    .trim()
    .split("\n")
    .filter((l) => l.trim());
}

export async function generateHaiku({
  subject,
  signal,
}: GenerateOptions): Promise<GenerateResult> {
  const system =
    "You are a haiku poet. When given a subject, respond with exactly one haiku. Line 1 MUST have exactly 5 syllables, line 2 MUST have exactly 7 syllables, line 3 MUST have exactly 5 syllables. Count carefully. Output only the three lines separated by newlines. No title, no attribution, no explanation.";

  const messages: { role: string; content: string }[] = [
    { role: "user", content: subject },
  ];

  let lastRemaining: number | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const request = {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system,
      messages,
    };

    const { content, remaining } = await callClaude({
      request,
      signal,
    });
    lastRemaining = remaining;

    const lines = parseHaikuLines(content);

    if (isValid575(lines)) {
      return { lines, remaining };
    }

    // If not valid and we have retries left, add correction to conversation
    if (attempt < MAX_RETRIES) {
      messages.push({ role: "assistant", content });
      messages.push({
        role: "user",
        content: `That doesn't have the right syllable counts:\n${syllableFeedback(lines)}\n\nPlease try again. Output exactly 3 lines: 5 syllables, 7 syllables, 5 syllables. Nothing else.`,
      });
    } else {
      // Accept whatever we got on the last attempt
      return { lines, remaining };
    }
  }

  // Shouldn't reach here, but just in case
  return { lines: [], remaining: lastRemaining };
}

export async function rebalanceHaiku({
  lines,
  signal,
}: RebalanceOptions): Promise<GenerateResult> {
  const currentState = lines
    .map((words, i) => `Line ${i + 1}: ${words.join(" ")}`)
    .join("\n");

  const system =
    "You are a haiku poet. You MUST output exactly 3 lines with EXACTLY 5 syllables, then 7 syllables, then 5 syllables. The user has rearranged words in a haiku. Rewrite it so it makes sense and strictly follows 5-7-5. Preserve the original words and theme as much as possible, but add, remove, or change words as needed. Output ONLY the three lines separated by newlines. No title, no explanation.";

  const messages: { role: string; content: string }[] = [
    {
      role: "user",
      content: `Here is a haiku after the user rearranged some words:\n\n${currentState}\n\nRewrite this into a coherent haiku. Line 1 = exactly 5 syllables. Line 2 = exactly 7 syllables. Line 3 = exactly 5 syllables.`,
    },
  ];

  let lastRemaining: number | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const request = {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system,
      messages,
    };

    const { content, remaining } = await callClaude({
      request,
      signal,
    });
    lastRemaining = remaining;

    const resultLines = parseHaikuLines(content);

    if (isValid575(resultLines)) {
      return { lines: resultLines, remaining };
    }

    if (attempt < MAX_RETRIES) {
      messages.push({ role: "assistant", content });
      messages.push({
        role: "user",
        content: `That doesn't have the right syllable counts:\n${syllableFeedback(resultLines)}\n\nPlease try again. Output exactly 3 lines: 5 syllables, 7 syllables, 5 syllables. Nothing else.`,
      });
    } else {
      return { lines: resultLines, remaining };
    }
  }

  return { lines: [], remaining: lastRemaining };
}
