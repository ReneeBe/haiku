import { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensors,
  useSensor,
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { HaikuLine } from "./HaikuLine";
import { SyllableWord } from "./SyllableWord";
import type { HaikuWord } from "../hooks/useHaikuGenerator";
import type { Status } from "../hooks/useHaikuGenerator";

const LINE_IDS = ["line-0", "line-1", "line-2"];
const EXPECTED_SYLLABLES = [5, 7, 5];

interface Props {
  lines: HaikuWord[][];
  status: Status;
  remaining: number | null;
  onReorder: (newLines: HaikuWord[][]) => void;
  onRebalance: (lines: HaikuWord[][]) => void;
}

function findLineIndex(lines: HaikuWord[][], wordId: string): number {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].some((w) => w.id === wordId)) return i;
  }
  return -1;
}

export function HaikuDisplay({ lines, status, remaining, onReorder, onRebalance }: Props) {
  const [animate, setAnimate] = useState(false);
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const crossLineMoveRef = useRef(false);
  const linesRef = useRef(lines);
  linesRef.current = lines;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  useEffect(() => {
    if (status === "done" && lines.length > 0) {
      setAnimate(false);
      requestAnimationFrame(() => setAnimate(true));
    }
  }, [lines, status]);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const currentLines = linesRef.current;
      const activeLineIdx = findLineIndex(currentLines, active.id as string);
      if (activeLineIdx === -1) return;

      let overLineIdx: number;
      const overIdStr = over.id as string;

      if (LINE_IDS.includes(overIdStr)) {
        overLineIdx = LINE_IDS.indexOf(overIdStr);
      } else {
        overLineIdx = findLineIndex(currentLines, overIdStr);
      }

      if (overLineIdx === -1 || activeLineIdx === overLineIdx) return;

      crossLineMoveRef.current = true;

      const activeWordIdx = currentLines[activeLineIdx].findIndex(
        (w) => w.id === active.id
      );
      const word = currentLines[activeLineIdx][activeWordIdx];

      const newLines = currentLines.map((l) => [...l]);
      newLines[activeLineIdx].splice(activeWordIdx, 1);

      if (LINE_IDS.includes(overIdStr)) {
        newLines[overLineIdx].push(word);
      } else {
        const overWordIdx = newLines[overLineIdx].findIndex(
          (w) => w.id === over.id
        );
        newLines[overLineIdx].splice(overWordIdx, 0, word);
      }

      onReorder(newLines);
    },
    [onReorder]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      const wasCrossLine = crossLineMoveRef.current;
      crossLineMoveRef.current = false;

      const currentLines = linesRef.current;

      // If no drop target, still rebalance if cross-line happened
      if (!over || active.id === over.id) {
        if (wasCrossLine) {
          onRebalance(currentLines);
        }
        return;
      }

      const activeLineIdx = findLineIndex(currentLines, active.id as string);
      const overIdStr = over.id as string;

      let overLineIdx: number;
      if (LINE_IDS.includes(overIdStr)) {
        overLineIdx = LINE_IDS.indexOf(overIdStr);
      } else {
        overLineIdx = findLineIndex(currentLines, overIdStr);
      }

      // Same-line reorder (no rebalance needed, syllable count unchanged)
      if (!wasCrossLine && activeLineIdx === overLineIdx && activeLineIdx !== -1 && !LINE_IDS.includes(overIdStr)) {
        const oldIndex = currentLines[activeLineIdx].findIndex((w) => w.id === active.id);
        const newIndex = currentLines[activeLineIdx].findIndex((w) => w.id === over.id);
        if (oldIndex !== newIndex) {
          const newLines = currentLines.map((l) => [...l]);
          newLines[activeLineIdx] = arrayMove(newLines[activeLineIdx], oldIndex, newIndex);
          onReorder(newLines);
        }
        return;
      }

      // Cross-line move: rebalance with the current state
      if (wasCrossLine) {
        onRebalance(currentLines);
      }
    },
    [onReorder, onRebalance]
  );

  const activeWord = activeId
    ? lines.flat().find((w) => w.id === activeId)
    : null;

  if (lines.length === 0 || status === "idle") return null;

  return (
    <div className={`haiku-card ${status === "loading" ? "shimmer" : ""}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => {
          setActiveId(e.active.id as string);
          crossLineMoveRef.current = false;
        }}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="haiku-lines">
          {lines.map((words, i) => (
            <HaikuLine
              key={i}
              words={words}
              lineId={LINE_IDS[i]}
              lineIndex={i}
              highlightEnabled={highlightEnabled}
              animate={animate}
              expectedSyllables={EXPECTED_SYLLABLES[i]}
            />
          ))}
        </div>
        <DragOverlay>
          {activeWord && (
            <span className="drag-overlay-word">
              <SyllableWord
                word={activeWord.text}
                syllableOffset={0}
                highlightEnabled={highlightEnabled}
              />
            </span>
          )}
        </DragOverlay>
      </DndContext>
      <div className="haiku-controls">
        <button
          className="toggle-btn"
          onClick={() => setHighlightEnabled((h) => !h)}
          title={highlightEnabled ? "Hide syllable colors" : "Show syllable colors"}
        >
          {highlightEnabled ? "Hide syllables" : "Show syllables"}
        </button>
      </div>
      {remaining !== null && (
        <p className="credits">
          {remaining} generation{remaining !== 1 ? "s" : ""} remaining
        </p>
      )}
    </div>
  );
}
