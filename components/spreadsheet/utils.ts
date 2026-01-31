import { Cell } from "./types";

/**
 * Converts column index to letter (0 -> A, 1 -> B, ..., 26 -> AA)
 */
export function getColLabel(index: number): string {
    let label = "";
    let i = index;
    while (i >= 0) {
        label = String.fromCharCode(65 + (i % 26)) + label;
        i = Math.floor(i / 26) - 1;
    }
    return label;
}

/**
 * Converts column letter to index (A -> 0, B -> 1)
 */
export function getColIndex(label: string): number {
    let index = 0;
    for (let i = 0; i < label.length; i++) {
        index = index * 26 + label.charCodeAt(i) - 64;
    }
    return index - 1;
}

/**
 * Parses "A1" to { row: 0, col: 0 }
 */
export function parseCellId(cellId: string): { row: number; col: number } | null {
    const match = cellId.match(/^([A-Z]+)([0-9]+)$/);
    if (!match) return null;
    const colStr = match[1];
    const rowStr = match[2];
    return {
        col: getColIndex(colStr),
        row: parseInt(rowStr) - 1,
    };
}

/**
 * Parses a range "A1:B3" to array of cell IDs ["0,0", "0,1", "1,0", "1,1", "2,0", "2,1"]
 */
export function parseRange(rangeStr: string): string[] {
    const parts = rangeStr.split(":");
    if (parts.length !== 2) return [];

    const start = parseCellId(parts[0]);
    const end = parseCellId(parts[1]);

    if (!start || !end) return [];

    const cellIds: string[] = [];
    const startRow = Math.min(start.row, end.row);
    const endRow = Math.max(start.row, end.row);
    const startCol = Math.min(start.col, end.col);
    const endCol = Math.max(start.col, end.col);

    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            cellIds.push(`${r},${c}`);
        }
    }

    return cellIds;
}

/**
 * Evaluates a formula
 */
// evaluateFormula removed in favor of recursive FormulaInterpreter

