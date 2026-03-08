/**
 * Lightweight line-based diff utility using the LCS (Longest Common Subsequence) algorithm.
 * Produces a unified diff suitable for rendering an inline diff overlay.
 */

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
 * Compute the LCS table for two arrays of strings.
 */
function lcsTable(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

/**
 * Backtrack the LCS table to produce a unified diff.
 */
function backtrack(dp: number[][], a: string[], b: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  let i = a.length;
  let j = b.length;

  // Collect in reverse, then reverse at the end
  const stack: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      stack.push({
        type: "unchanged",
        content: a[i - 1],
        oldLineNumber: i,
        newLineNumber: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({
        type: "added",
        content: b[j - 1],
        newLineNumber: j,
      });
      j--;
    } else {
      stack.push({
        type: "removed",
        content: a[i - 1],
        oldLineNumber: i,
      });
      i--;
    }
  }

  stack.reverse();
  return stack;
}

/**
 * Compute a line-based diff between two strings.
 */
export function computeDiff(oldText: string, newText: string): DiffResult {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const dp = lcsTable(oldLines, newLines);
  const lines = backtrack(dp, oldLines, newLines);

  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  for (const line of lines) {
    switch (line.type) {
      case "added":
        addedCount++;
        break;
      case "removed":
        removedCount++;
        break;
      case "unchanged":
        unchangedCount++;
        break;
    }
  }

  return { lines, addedCount, removedCount, unchangedCount };
}
