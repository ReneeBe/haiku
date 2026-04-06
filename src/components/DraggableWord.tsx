import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SyllableWord } from "./SyllableWord";
import type { HaikuWord } from "../hooks/useHaikuGenerator";
import { countSyllables } from "../utils/syllables";

interface Props {
  word: HaikuWord;
  syllableOffset: number;
  highlightEnabled: boolean;
}

export function DraggableWord({ word, syllableOffset, highlightEnabled }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: word.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: "inline-block",
    padding: "2px 4px",
    borderRadius: "4px",
    cursor: "grab",
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? "0 0 12px rgba(196, 167, 231, 0.4)" : "none",
    scale: isDragging ? "1.08" : "1",
  };

  return (
    <span ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SyllableWord
        word={word.text}
        syllableOffset={syllableOffset}
        highlightEnabled={highlightEnabled}
      />
    </span>
  );
}

/** Get the syllable count of a word for offset calculation */
export function wordSyllableCount(word: string): number {
  return countSyllables(word);
}
