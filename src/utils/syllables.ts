import { hyphenateSync } from "hyphen/en";
import { syllable } from "syllable";

/** Split a word into syllables visually using hyphenation patterns */
export function splitIntoSyllables(word: string): string[] {
  // Strip punctuation for hyphenation, reattach after
  const leadMatch = word.match(/^([^a-zA-Z]*)/);
  const trailMatch = word.match(/([^a-zA-Z]*)$/);
  const lead = leadMatch?.[1] ?? "";
  const trail = trailMatch?.[1] ?? "";
  const core = word.slice(lead.length, word.length - (trail.length || 0) || undefined);

  if (!core) return [word];

  try {
    const hyphenated = hyphenateSync(core);
    const parts = hyphenated.split("\u00AD");
    if (parts.length === 0) return [word];
    // Reattach punctuation to first/last syllable
    parts[0] = lead + parts[0];
    parts[parts.length - 1] = parts[parts.length - 1] + trail;
    return parts;
  } catch {
    return [word];
  }
}

/** Count syllables in a single word (accurate, using the syllable package) */
export function countSyllables(word: string): number {
  // Strip punctuation for counting
  const core = word.replace(/[^a-zA-Z]/g, "");
  if (!core) return 0;
  return syllable(core);
}

/** Count total syllables in a line of text */
export function countSyllablesInLine(line: string): number {
  return line
    .split(/\s+/)
    .filter(Boolean)
    .reduce((sum, word) => sum + countSyllables(word), 0);
}
