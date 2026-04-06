import { splitIntoSyllables } from "../utils/syllables";
import { colorForSyllableIndex } from "../utils/colors";

interface Props {
  word: string;
  syllableOffset: number;
  highlightEnabled: boolean;
}

export function SyllableWord({ word, syllableOffset, highlightEnabled }: Props) {
  if (!highlightEnabled) {
    return <span>{word}</span>;
  }

  const syllables = splitIntoSyllables(word);
  return (
    <>
      {syllables.map((syl, i) => (
        <span
          key={i}
          style={{ color: colorForSyllableIndex(syllableOffset + i) }}
        >
          {syl}
        </span>
      ))}
    </>
  );
}
