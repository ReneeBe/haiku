/** Soft palette for syllable position highlighting (max 7 per line) */
export const SYLLABLE_COLORS = [
  "#c4a7e7", // lavender (accent)
  "#9ccfd8", // teal
  "#f6c177", // amber
  "#eb6f92", // rose
  "#e0def4", // silver
  "#31748f", // deep cyan
  "#ebbcba", // pale pink
];

export function colorForSyllableIndex(index: number): string {
  return SYLLABLE_COLORS[index % SYLLABLE_COLORS.length];
}
