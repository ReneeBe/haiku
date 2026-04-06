import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { DraggableWord, wordSyllableCount } from "./DraggableWord";
import type { HaikuWord } from "../hooks/useHaikuGenerator";

interface Props {
  words: HaikuWord[];
  lineId: string;
  lineIndex: number;
  highlightEnabled: boolean;
  animate: boolean;
  expectedSyllables: number;
}

export function HaikuLine({ words, lineId, lineIndex, highlightEnabled, animate, expectedSyllables }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: lineId });

  // Calculate syllable offsets for each word
  let syllableOffset = 0;
  const offsets: number[] = [];
  let totalSyllables = 0;
  for (const w of words) {
    offsets.push(syllableOffset);
    const count = wordSyllableCount(w.text);
    syllableOffset += count;
    totalSyllables += count;
  }

  const syllableMatch = totalSyllables === expectedSyllables;

  return (
    <div
      ref={setNodeRef}
      className={`haiku-line-wrapper ${isOver ? "drop-target" : ""}`}
    >
      <p
        className={`haiku-line ${animate ? "visible" : ""}`}
        style={{ transitionDelay: `${lineIndex * 400}ms` }}
      >
        <SortableContext items={words.map((w) => w.id)} strategy={horizontalListSortingStrategy}>
          {words.map((word, i) => (
            <span key={word.id}>
              {i > 0 && " "}
              <DraggableWord
                word={word}
                syllableOffset={offsets[i]}
                highlightEnabled={highlightEnabled}
              />
            </span>
          ))}
        </SortableContext>
      </p>
      {highlightEnabled && (
        <span className={`syllable-count ${syllableMatch ? "match" : "mismatch"}`}>
          {totalSyllables}
        </span>
      )}
    </div>
  );
}
