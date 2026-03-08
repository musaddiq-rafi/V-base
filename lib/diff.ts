/**
 * Line-based diff utility powered by the `diff` npm package (Myers algorithm).
 * Produces structured output for rendering a VS Code-style inline diff view.
 */

import { diffLines, Change } from "diff";

export type DiffLineType = "added" | "removed" | "unchanged";

export interface DiffLine {
  type: DiffLineType;
  content: string;
  /** Line number in the old (original) file. undefined for added lines. */
  oldLineNumber?: number;
  /** Line number in the new (proposed) file. undefined for removed lines. */
  newLineNumber?: number;
}

export interface DiffResult {
  lines: DiffLine[];
  addedCount: number;
  removedCount: number;
  unchangedCount: number;
}

/**
 * Compute a line-based diff between two strings using Myers' algorithm.
 */
export function computeDiff(oldText: string, newText: string): DiffResult {
  const changes: Change[] = diffLines(oldText, newText);

  const lines: DiffLine[] = [];
  let oldLineNum = 1;
  let newLineNum = 1;
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  for (const change of changes) {
    // Split the change value into individual lines.
    // diffLines includes a trailing newline, so we drop the last empty split.
    const splitLines = change.value.split("\n");
    // If the value ends with \n, the last element is empty — drop it
    if (splitLines[splitLines.length - 1] === "") {
      splitLines.pop();
    }

    for (const line of splitLines) {
      if (change.added) {
        lines.push({ type: "added", content: line, newLineNumber: newLineNum });
        newLineNum++;
        addedCount++;
      } else if (change.removed) {
        lines.push({
          type: "removed",
          content: line,
          oldLineNumber: oldLineNum,
        });
        oldLineNum++;
        removedCount++;
      } else {
        lines.push({
          type: "unchanged",
          content: line,
          oldLineNumber: oldLineNum,
          newLineNumber: newLineNum,
        });
        oldLineNum++;
        newLineNum++;
        unchangedCount++;
      }
    }
  }

  return { lines, addedCount, removedCount, unchangedCount };
}
